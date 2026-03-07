import { GoogleGenAI, type Content } from '@google/genai';
import { callMethod, getList } from '../api/client';

// ── Model & prompt ────────────────────────────────────────────────────────────

export const GEMINI_MODEL = 'gemini-3-flash-preview';

const SYSTEM_PROMPT = `You are the BuildSupply Pro AI assistant — an expert business analyst for an Ethiopian construction materials import and wholesale company.

You have live access to business data via tools. Always fetch fresh data before answering data-related questions.

CAPABILITIES:
- Stock levels, inventory, low-stock alerts, warehouse summaries
- Sales performance, top customers, revenue trends
- Import shipment tracking and landed cost analysis
- Purchase order and sales order status
- Business KPIs and actionable insights

RULES:
- Always format currency as ETB (e.g. ETB 1,240,000)
- Be concise, direct, and actionable
- When you use a tool, summarize the result clearly — don't just dump raw data
- If asked in Amharic, respond fully in Amharic
- The company imports steel, cement, tiles, paint, pipes from China, Turkey, UAE and sells wholesale to Ethiopian contractors and developers`;

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOL_DECLARATIONS = [
  {
    name: 'get_dashboard_stats',
    description: 'Get current business KPIs: total stock value, pending POs, active shipments, monthly sales, low-stock items, overdue POs.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_stock_levels',
    description: 'Get current stock levels for items. Optionally filter by warehouse name or item group (Steel, Cement, Tiles, Paints, Pipes).',
    parameters: {
      type: 'object',
      properties: {
        warehouse: { type: 'string', description: 'Warehouse name to filter by' },
        item_group: { type: 'string', description: 'Item group to filter by' },
      },
    },
  },
  {
    name: 'get_warehouse_summary',
    description: 'Get stock summary per warehouse: item count and total value.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_top_items',
    description: 'Get top selling items by revenue. Period: month, quarter, or year.',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'month | quarter | year' },
        limit: { type: 'number', description: 'How many items (default 10)' },
      },
    },
  },
  {
    name: 'get_top_customers',
    description: 'Get top customers by total revenue this year.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'How many customers (default 10)' },
      },
    },
  },
  {
    name: 'get_purchase_orders',
    description: 'Get recent purchase orders with supplier, date, total, and status.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status e.g. "To Receive and Bill"' },
      },
    },
  },
  {
    name: 'get_sales_orders',
    description: 'Get recent sales orders with customer, date, total, and status.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status e.g. "To Deliver and Bill"' },
      },
    },
  },
  {
    name: 'get_import_shipments',
    description: 'Get import shipments with origin country, ETA, status, and total landed cost.',
    parameters: { type: 'object', properties: {} },
  },
];

const TOOLS: any[] = [{ functionDeclarations: TOOL_DECLARATIONS }];

// ── Tool executor ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTool(name: string, args: Record<string, any> = {}): Promise<unknown> {
  switch (name) {
    case 'get_dashboard_stats':
      return callMethod('buildsupply.api.dashboard.get_dashboard_stats');

    case 'get_stock_levels':
      return callMethod('buildsupply.api.inventory.get_stock_levels', {
        warehouse: args.warehouse ?? null,
        item_group: args.item_group ?? null,
      });

    case 'get_warehouse_summary':
      return callMethod('buildsupply.api.inventory.get_warehouse_summary');

    case 'get_top_items':
      return callMethod('buildsupply.api.reports.get_top_items', {
        limit: args.limit ?? 10,
        period: args.period ?? 'year',
      });

    case 'get_top_customers':
      return callMethod('buildsupply.api.reports.get_top_customers', { limit: args.limit ?? 10 });

    case 'get_purchase_orders':
      return getList({
        doctype: 'Purchase Order',
        fields: ['name', 'supplier_name', 'transaction_date', 'grand_total', 'status', 'schedule_date'],
        filters: args.status ? [['status', '=', args.status]] : undefined,
        order_by: 'transaction_date desc',
        limit_page_length: 20,
      });

    case 'get_sales_orders':
      return getList({
        doctype: 'Sales Order',
        fields: ['name', 'customer_name', 'transaction_date', 'grand_total', 'status', 'delivery_date'],
        filters: args.status ? [['status', '=', args.status]] : undefined,
        order_by: 'transaction_date desc',
        limit_page_length: 20,
      });

    case 'get_import_shipments':
      return getList({
        doctype: 'Import Shipment',
        fields: ['name', 'shipment_title', 'origin_country', 'eta', 'status', 'total_landed_cost'],
        filters: [['docstatus', '=', 1]],
        order_by: 'creation desc',
        limit_page_length: 20,
      });

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Human-readable tool labels ────────────────────────────────────────────────

export const TOOL_LABELS: Record<string, string> = {
  get_dashboard_stats: 'Checking business KPIs',
  get_stock_levels: 'Looking up stock levels',
  get_warehouse_summary: 'Fetching warehouse summary',
  get_top_items: 'Analysing top items',
  get_top_customers: 'Analysing top customers',
  get_purchase_orders: 'Fetching purchase orders',
  get_sales_orders: 'Fetching sales orders',
  get_import_shipments: 'Checking import shipments',
};

// ── Main chat function ────────────────────────────────────────────────────────

export type ChatHistory = Content[];

export interface ToolOutput {
  name: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
}

export interface ChatTurnResult {
  text: string;
  updatedHistory: ChatHistory;
  toolsUsed: string[];
  toolOutputs: ToolOutput[];
}

export async function runChatTurn(
  history: ChatHistory,
  onToolCall?: (label: string) => void,
): Promise<ChatTurnResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not configured in .env');

  const ai = new GoogleGenAI({ apiKey });
  const working = [...history];
  const toolsUsed: string[] = [];
  const toolOutputs: ToolOutput[] = [];
  const MAX_ROUNDS = 6;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: working,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: TOOLS,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const functionCalls = response.functionCalls;

    // Add model turn to history
    working.push({ role: 'model', parts });

    if (!functionCalls?.length) {
      // No more tool calls — final text response
      return { text: response.text ?? '', updatedHistory: working, toolsUsed, toolOutputs };
    }

    // Execute all tool calls in parallel
    const validCalls = functionCalls.filter(fc => fc.name);
    const toolResults = await Promise.all(
      validCalls.map(async (fc) => {
        const name = fc.name as string;
        const label = TOOL_LABELS[name] ?? name;
        onToolCall?.(label);
        toolsUsed.push(label);
        const result = await executeTool(name, (fc.args ?? {}) as Record<string, any>);
        toolOutputs.push({ name, label, result });
        return {
          functionResponse: {
            name: name,
            response: { result },
          },
        };
      }),
    );

    // Add tool results back to history as a user turn
    working.push({ role: 'user', parts: toolResults });
  }

  return {
    text: 'I was unable to complete the request after several attempts.',
    updatedHistory: working,
    toolsUsed,
    toolOutputs,
  };
}
