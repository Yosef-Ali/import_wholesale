import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Trash2, Loader2, ArrowUp, Check, ChevronDown, ChevronRight, Package, Ship, TrendingUp, ShoppingCart, Users, Warehouse, AlertTriangle, CircleDot, ExternalLink } from 'lucide-react';
import { runChatTurn, type ChatHistory, type ToolOutput } from '../../lib/gemini';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UIMessage {
  role: 'user' | 'assistant';
  text: string;
  toolsUsed?: string[];
  toolOutputs?: ToolOutput[];
  id: number;
}

let _id = 0;
const uid = () => ++_id;

const SUGGESTIONS: { icon: React.ReactNode; label: string; prompt: string }[] = [
  { icon: <Package size={16} strokeWidth={1.75} />, label: 'Stock value', prompt: 'What is my current total stock value?' },
  { icon: <TrendingUp size={16} strokeWidth={1.75} />, label: 'Top sellers', prompt: 'Show me top selling items this year' },
  { icon: <Ship size={16} strokeWidth={1.75} />, label: 'Shipments', prompt: 'Any active import shipments?' },
  { icon: <AlertTriangle size={16} strokeWidth={1.75} />, label: 'Low stock', prompt: 'Are there any low stock alerts?' },
  { icon: <Users size={16} strokeWidth={1.75} />, label: 'Top customers', prompt: 'Which customers generated most revenue?' },
  { icon: <ShoppingCart size={16} strokeWidth={1.75} />, label: 'Pending POs', prompt: 'What purchase orders are pending?' },
];

// Context-aware follow-up chips per tool type
const FOLLOWUP_CHIPS: Record<string, { label: string; prompt: string }[]> = {
  get_dashboard_stats: [
    { label: 'Low stock alerts', prompt: 'Show me items with low stock' },
    { label: 'Pending orders', prompt: 'What purchase orders are pending?' },
    { label: 'Sales trend', prompt: 'Show me sales trend this quarter' },
  ],
  get_stock_levels: [
    { label: 'Low stock only', prompt: 'Which items are below safety stock?' },
    { label: 'By warehouse', prompt: 'Show stock levels grouped by warehouse' },
    { label: 'Reorder needed', prompt: 'Which items need to be reordered?' },
  ],
  get_import_shipments: [
    { label: 'Landed costs', prompt: 'Break down landed costs for active shipments' },
    { label: 'Delayed?', prompt: 'Are any shipments delayed or overdue?' },
    { label: 'Pending POs', prompt: 'Show purchase orders waiting for receipt' },
  ],
  get_top_items: [
    { label: 'By category', prompt: 'Break down top items by category' },
    { label: 'This quarter', prompt: 'Show top items this quarter only' },
    { label: 'Low performers', prompt: 'Which items have lowest sales?' },
  ],
  get_top_customers: [
    { label: 'Payment status', prompt: 'Which customers have outstanding payments?' },
    { label: 'New customers', prompt: 'Show me recently added customers' },
    { label: 'Customer orders', prompt: 'Show recent sales orders by customer' },
  ],
  get_purchase_orders: [
    { label: 'Overdue POs', prompt: 'Which purchase orders are overdue?' },
    { label: 'By supplier', prompt: 'Show POs grouped by supplier' },
    { label: 'Shipment status', prompt: 'Show import shipment tracking' },
  ],
  get_sales_orders: [
    { label: 'Undelivered', prompt: 'Which sales orders are not yet delivered?' },
    { label: 'Top customers', prompt: 'Which customers placed the most orders?' },
    { label: 'Revenue today', prompt: 'What is today\'s sales revenue?' },
  ],
  get_warehouse_summary: [
    { label: 'Stock details', prompt: 'Show detailed stock levels' },
    { label: 'Low stock', prompt: 'Which warehouses have low stock items?' },
    { label: 'Top value items', prompt: 'Which items hold the most stock value?' },
  ],
};

async function* wordStream(text: string): AsyncGenerator<string> {
  const words = text.split(' ');
  for (const word of words) {
    yield word + ' ';
    await new Promise((r) => setTimeout(r, 16));
  }
}

// ── Design tokens ────────────────────────────────────────────────────────────

const T = {
  orange: '#FF8400',
  orangeLight: 'rgba(255,132,0,0.1)',
  orangeBorder: 'rgba(255,132,0,0.25)',
  blue: '#2563eb',
  purple: '#7c3aed',
  green: '#10b981',
  greenBg: 'rgba(16,185,129,0.1)',
  greenBorder: 'rgba(16,185,129,0.2)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.08)',
  redBorder: 'rgba(239,68,68,0.2)',
  amber: '#f59e0b',
  amberBg: 'rgba(245,158,11,0.1)',
  amberBorder: 'rgba(245,158,11,0.2)',
  blueBg: 'rgba(37,99,235,0.08)',
  blueBorder: 'rgba(37,99,235,0.2)',
  font: '"Geist", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  radius: '0.75rem',
  radiusSm: '0.5rem',
  radiusPill: '100px',
};

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  let bg = T.blueBg, border = T.blueBorder, color = T.blue, label = status;
  if (s.includes('complet') || s.includes('deliver') || s.includes('receiv') || s.includes('paid') || s === 'closed') {
    bg = T.greenBg; border = T.greenBorder; color = T.green;
  } else if (s.includes('pending') || s.includes('draft') || s.includes('to ')) {
    bg = T.amberBg; border = T.amberBorder; color = T.amber;
  } else if (s.includes('overdue') || s.includes('cancel') || s.includes('reject') || s.includes('stopped')) {
    bg = T.redBg; border = T.redBorder; color = T.red;
  } else if (s.includes('transit') || s.includes('ordered') || s.includes('active') || s.includes('submitted')) {
    bg = T.blueBg; border = T.blueBorder; color = T.blue;
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.65rem', fontWeight: 700, fontFamily: T.mono,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      background: bg, color, border: `1px solid ${border}`,
      padding: '0.15rem 0.5rem', borderRadius: T.radiusPill,
      whiteSpace: 'nowrap', lineHeight: 1,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ── Mini Sparkline (pure CSS bars) ───────────────────────────────────────────

function Sparkline({ values, color = T.orange, height = 24 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {values.map((v, i) => (
        <div key={i} style={{
          width: 4, borderRadius: 2,
          height: `${Math.max(8, (v / max) * 100)}%`,
          background: i === values.length - 1 ? color : `${color}55`,
          transition: 'height 0.4s ease',
        }} />
      ))}
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max = 100, color = T.orange, label }: { value: number; max?: number; color?: string; label?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ width: '100%' }}>
      {label && <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginBottom: 3, fontFamily: T.mono }}>{label}</div>}
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: 'width 0.6s ease',
          boxShadow: `0 0 8px ${color}40`,
        }} />
      </div>
    </div>
  );
}

// ── Delta Indicator ──────────────────────────────────────────────────────────

function Delta({ value, suffix = '%' }: { value?: number | string; suffix?: string }) {
  if (value === undefined || value === null) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;
  const positive = num >= 0;
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, fontFamily: T.mono,
      color: positive ? T.green : T.red,
      display: 'inline-flex', alignItems: 'center', gap: 2,
    }}>
      {positive ? '↑' : '↓'}{Math.abs(num)}{suffix}
    </span>
  );
}

// ── Collapsible Section ──────────────────────────────────────────────────────

function Collapsible({ title, count, children, defaultOpen = false }: {
  title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem', width: '100%',
        padding: '0.5rem 0', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: T.font, fontSize: '0.72rem', fontWeight: 600,
        color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
        {count !== undefined && (
          <span style={{
            fontSize: '0.6rem', fontFamily: T.mono, background: T.orangeLight,
            color: T.orange, padding: '0.1rem 0.35rem', borderRadius: T.radiusPill,
            fontWeight: 700, lineHeight: 1,
          }}>{count}</span>
        )}
      </button>
      {open && <div style={{ paddingBottom: '0.375rem' }}>{children}</div>}
    </div>
  );
}

// ── A2UI Widget Card Shell ───────────────────────────────────────────────────

function WidgetCard({ icon, title, subtitle, badge, children, actions }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: T.radius,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
      animation: 'cbCardIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
      width: '100%',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.625rem 0.75rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--background)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '0.375rem', flexShrink: 0,
            background: T.orangeLight, border: `1px solid ${T.orangeBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.orange,
          }}>{icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.78rem', fontWeight: 700, fontFamily: T.font,
              color: 'var(--foreground)', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: T.mono, marginTop: 1 }}>{subtitle}</div>
            )}
          </div>
        </div>
        {badge}
      </div>
      {/* Card content */}
      <div style={{ padding: '0.625rem 0.75rem' }}>{children}</div>
      {/* Card actions footer */}
      {actions && (
        <div style={{
          display: 'flex', gap: '0.375rem', padding: '0.5rem 0.75rem',
          borderTop: '1px solid var(--border)', background: 'var(--background)',
          flexWrap: 'wrap',
        }}>{actions}</div>
      )}
    </div>
  );
}

// ── Action Button (for card footers) ─────────────────────────────────────────

export function ActionBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.65rem', fontWeight: 600, fontFamily: T.font,
      padding: '0.25rem 0.5rem', borderRadius: T.radiusSm,
      background: T.orangeLight, color: T.orange,
      border: `1px solid ${T.orangeBorder}`,
      cursor: 'pointer', transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = T.orange; e.currentTarget.style.color = 'white'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = T.orangeLight; e.currentTarget.style.color = T.orange; }}
    >
      {label}
      <ExternalLink size={9} />
    </button>
  );
}

// ── Inline markdown renderers ────────────────────────────────────────────────

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} style={{ fontWeight: 700, color: 'var(--foreground)' }}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} style={{
            background: T.orangeLight, color: T.orange,
            padding: '0.1em 0.35em', borderRadius: '0.25rem',
            fontFamily: T.mono, fontSize: '0.85em', fontWeight: 600,
          }}>{part.slice(1, -1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function MarkdownTable({ rows }: { rows: string[] }) {
  const parsed = rows.map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
  const header = parsed[0];
  const body = parsed.slice(2);
  return (
    <div style={{ overflowX: 'auto', margin: '0.5rem 0', borderRadius: T.radiusSm, border: '1px solid var(--border)' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.75rem', fontFamily: T.font }}>
        <thead>
          <tr style={{ background: 'var(--background)' }}>
            {header.map((h, i) => (
              <th key={i} style={{
                padding: '0.4rem 0.625rem', textAlign: 'left',
                borderBottom: '2px solid var(--border)',
                color: T.orange, fontWeight: 700, whiteSpace: 'nowrap',
                fontFamily: T.mono, fontSize: '0.65rem', textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}><InlineText text={h} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} style={{
              borderBottom: '1px solid var(--border)',
              background: i % 2 === 0 ? 'transparent' : 'var(--background)',
            }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '0.35rem 0.625rem', color: 'var(--foreground)', verticalAlign: 'top' }}>
                  <InlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('|')) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) { tableRows.push(lines[i]); i++; }
      if (tableRows.length >= 3) blocks.push(<MarkdownTable key={blocks.length} rows={tableRows} />);
      continue;
    }
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) { items.push(lines[i].replace(/^[-*]\s/, '')); i++; }
      blocks.push(
        <ul key={blocks.length} style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {items.map((item, j) => (
            <li key={j} style={{ color: 'var(--foreground)', lineHeight: 1.6, fontSize: '0.84rem' }}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }
    if (line.trim() === '') { blocks.push(<div key={blocks.length} style={{ height: '0.35rem' }} />); i++; continue; }
    blocks.push(<span key={blocks.length} style={{ display: 'block', lineHeight: 1.7 }}><InlineText text={line} /></span>);
    i++;
  }
  return <>{blocks}</>;
}

// ── A2UI Widget Renderers ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WidgetRenderer({ outputs, onSend }: { outputs: ToolOutput[]; onSend: (text: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', width: '100%' }}>
      {outputs.map((out, i) => {
        if (out.name === 'get_dashboard_stats') return <DashboardStatsWidget key={i} data={out.result} />;
        if (out.name === 'get_import_shipments') return <ShipmentsWidget key={i} data={out.result} />;
        if (out.name === 'get_stock_levels') return <StockLevelsWidget key={i} data={out.result} />;
        if (out.name === 'get_top_items') return <TopItemsWidget key={i} data={out.result} />;
        if (out.name === 'get_top_customers') return <TopCustomersWidget key={i} data={out.result} />;
        if (out.name === 'get_purchase_orders') return <PurchaseOrdersWidget key={i} data={out.result} />;
        if (out.name === 'get_sales_orders') return <SalesOrdersWidget key={i} data={out.result} />;
        if (out.name === 'get_warehouse_summary') return <WarehouseSummaryWidget key={i} data={out.result} />;
        return (
          <WidgetCard key={i} icon={<CircleDot size={14} />} title={out.label}>
            <pre style={{ margin: 0, fontSize: '0.68rem', overflowX: 'auto', color: 'var(--muted-foreground)', fontFamily: T.mono }}>
              {JSON.stringify(out.result, null, 2)}
            </pre>
          </WidgetCard>
        );
      })}
      {/* Contextual follow-up chips */}
      <FollowUpChips toolNames={outputs.map(o => o.name)} onSend={onSend} />
    </div>
  );
}

function FollowUpChips({ toolNames, onSend }: { toolNames: string[]; onSend: (text: string) => void }) {
  const chips = toolNames.flatMap(name => FOLLOWUP_CHIPS[name] || []).slice(0, 3);
  if (chips.length === 0) return null;
  return (
    <div style={{
      display: 'flex', gap: '0.375rem', flexWrap: 'wrap',
      animation: 'cbFadeUp 0.3s ease 0.2s both',
    }}>
      {chips.map((chip, i) => (
        <button key={i} onClick={() => onSend(chip.prompt)} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.7rem', fontWeight: 600, fontFamily: T.font,
          padding: '0.3rem 0.625rem', borderRadius: T.radiusPill,
          background: 'var(--background)', color: 'var(--foreground)',
          border: '1px solid var(--border)',
          cursor: 'pointer', transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.orange;
            e.currentTarget.style.background = T.orangeLight;
            e.currentTarget.style.color = T.orange;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'var(--background)';
            e.currentTarget.style.color = 'var(--foreground)';
          }}
        >
          <Sparkles size={10} strokeWidth={2} />
          {chip.label}
        </button>
      ))}
    </div>
  );
}

// ── Dashboard Stats Widget ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DashboardStatsWidget({ data }: { data: any }) {
  if (!data) return null;
  const stats = [
    {
      label: 'STOCK VALUE', value: `ETB ${(data.total_stock_value || 0).toLocaleString()}`,
      icon: <Package size={13} />, color: T.orange,
      sparkline: [65, 72, 58, 80, 75, 90, 85], delta: data.stock_change,
    },
    {
      label: 'PENDING POs', value: data.pending_po_count ?? 0,
      icon: <ShoppingCart size={13} />, color: T.amber,
      sparkline: [4, 6, 3, 8, 5, 7, 4], delta: undefined,
    },
    {
      label: 'ACTIVE SHIPMENTS', value: data.active_shipment_count ?? 0,
      icon: <Ship size={13} />, color: T.blue,
      sparkline: [2, 3, 2, 4, 3, 5, 3], delta: undefined,
    },
    {
      label: 'LOW STOCK', value: data.low_stock_count ?? 0,
      icon: <AlertTriangle size={13} />, color: data.low_stock_count > 0 ? T.red : T.green,
      sparkline: [8, 6, 9, 4, 7, 3, 5], delta: undefined,
    },
  ];
  return (
    <WidgetCard
      icon={<TrendingUp size={14} />}
      title="Business Overview"
      subtitle="Real-time KPIs"
      badge={<StatusBadge status="Live" />}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: '0.5rem 0.625rem',
            background: 'var(--background)',
            borderRadius: T.radiusSm,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <div style={{
                fontSize: '0.58rem', fontWeight: 700, fontFamily: T.mono,
                color: 'var(--muted-foreground)', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                {s.label}
              </div>
              <Sparkline values={s.sparkline} color={s.color} height={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
              <span style={{
                fontSize: '1.1rem', fontWeight: 800, fontFamily: T.font,
                color: s.color, letterSpacing: '-0.02em', lineHeight: 1,
              }}>{s.value}</span>
              <Delta value={s.delta} />
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

// ── Stock Levels Widget ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StockLevelsWidget({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0)
    return <EmptyWidget icon={<Package size={14} />} title="Stock Levels" message="No stock data available." />;

  const maxQty = Math.max(...data.map(d => d.actual_qty || 0), 1);
  const lowCount = data.filter(d => (d.actual_qty || 0) < (d.safety_stock || 10)).length;
  const summary = data.slice(0, 5);
  const rest = data.slice(5);

  return (
    <WidgetCard
      icon={<Package size={14} />}
      title="Stock Levels"
      subtitle={`${data.length} items`}
      badge={lowCount > 0 ? <StatusBadge status={`${lowCount} Low`} /> : <StatusBadge status="Healthy" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {summary.map((s, i) => {
          const isLow = (s.actual_qty || 0) < (s.safety_stock || 10);
          const pct = ((s.actual_qty || 0) / maxQty) * 100;
          return (
            <div key={i} style={{ animation: `cbFadeUp 0.2s ease ${i * 0.05}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: isLow ? T.red : T.green,
                    boxShadow: isLow ? `0 0 6px ${T.red}60` : 'none',
                  }} />
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 600, fontFamily: T.font,
                    color: 'var(--foreground)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
                  }} title={s.item_name}>{s.item_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {s.warehouse && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', fontFamily: T.mono }}>{s.warehouse}</span>
                  )}
                  <span style={{
                    fontSize: '0.8rem', fontWeight: 800, fontFamily: T.mono,
                    color: isLow ? T.red : 'var(--foreground)',
                  }}>{s.actual_qty ?? 0}</span>
                </div>
              </div>
              <ProgressBar value={pct} color={isLow ? T.red : T.orange} />
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <Collapsible title="More items" count={rest.length}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {rest.map((s, i) => {
              const isLow = (s.actual_qty || 0) < (s.safety_stock || 10);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.25rem 0', fontSize: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: isLow ? T.red : T.green, flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{s.item_name}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontFamily: T.mono, color: isLow ? T.red : 'var(--foreground)' }}>{s.actual_qty ?? 0}</span>
                </div>
              );
            })}
          </div>
        </Collapsible>
      )}
    </WidgetCard>
  );
}

// ── Shipments Widget ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ShipmentsWidget({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0)
    return <EmptyWidget icon={<Ship size={14} />} title="Shipments" message="No active shipments." />;

  return (
    <WidgetCard
      icon={<Ship size={14} />}
      title="Import Shipments"
      subtitle={`${data.length} tracked`}
      badge={<StatusBadge status="Tracking" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {data.slice(0, 3).map((s, i) => {
          const etaDate = s.eta ? new Date(s.eta) : null;
          const daysLeft = etaDate ? Math.max(0, Math.ceil((etaDate.getTime() - Date.now()) / 86400000)) : null;
          return (
            <div key={i} style={{
              padding: '0.625rem',
              background: 'var(--background)',
              borderRadius: T.radiusSm,
              border: '1px solid var(--border)',
              animation: `cbFadeUp 0.2s ease ${i * 0.08}s both`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: 700, fontFamily: T.font, color: 'var(--foreground)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180,
                  }}>{s.shipment_title || s.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', fontFamily: T.mono, marginTop: 2 }}>
                    {s.origin_country} → Addis Ababa
                  </div>
                </div>
                <StatusBadge status={s.status || 'In Transit'} />
              </div>
              {/* Timeline progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', margin: '0.5rem 0' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: T.green, border: `2px solid ${T.green}`,
                }} />
                <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: daysLeft !== null ? `${Math.max(10, 100 - daysLeft * 5)}%` : '50%',
                    background: `linear-gradient(90deg, ${T.green}, ${T.orange})`,
                    borderRadius: 2,
                  }} />
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--border)', border: '2px solid var(--border)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', fontFamily: T.mono }}>
                  ETA: {s.eta || 'TBD'}
                  {daysLeft !== null && (
                    <span style={{
                      marginLeft: '0.375rem', fontWeight: 700,
                      color: daysLeft <= 3 ? T.orange : 'var(--muted-foreground)',
                    }}>({daysLeft}d)</span>
                  )}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: T.mono, color: T.orange }}>
                  ETB {(s.total_landed_cost || 0).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {data.length > 3 && (
        <Collapsible title="More shipments" count={data.length - 3}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {data.slice(3).map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.75rem' }}>
                <span>{s.shipment_title || s.name}</span>
                <span style={{ fontWeight: 700, fontFamily: T.mono, color: T.orange }}>ETB {(s.total_landed_cost || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Collapsible>
      )}
    </WidgetCard>
  );
}

// ── Top Items Widget ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TopItemsWidget({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0)
    return <EmptyWidget icon={<TrendingUp size={14} />} title="Top Items" message="No sales data." />;

  const max = Math.max(...data.map(d => d.total_revenue || 0), 1);
  return (
    <WidgetCard
      icon={<TrendingUp size={14} />}
      title="Top Revenue Items"
      subtitle={`${data.length} items ranked`}
      badge={<StatusBadge status="Revenue" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.slice(0, 5).map((item, i) => {
          const pct = ((item.total_revenue || 0) / max) * 100;
          const rankColors = [T.orange, '#94a3b8', '#b45309'];
          return (
            <div key={i} style={{ animation: `cbFadeUp 0.2s ease ${i * 0.05}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < 3 ? rankColors[i] : 'var(--border)',
                    fontSize: '0.6rem', fontWeight: 800, fontFamily: T.mono,
                    color: i < 3 ? 'white' : 'var(--muted-foreground)',
                    lineHeight: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 600, fontFamily: T.font,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
                  }} title={item.item_name}>{item.item_name}</span>
                </div>
                <span style={{
                  fontSize: '0.78rem', fontWeight: 800, fontFamily: T.mono, color: T.orange,
                  flexShrink: 0,
                }}>ETB {(item.total_revenue || 0).toLocaleString()}</span>
              </div>
              <div style={{ marginLeft: 20 + 6, marginRight: 0 }}>
                <ProgressBar value={pct} color={i === 0 ? T.orange : `${T.orange}88`} />
              </div>
            </div>
          );
        })}
      </div>
      {data.length > 5 && (
        <Collapsible title="More items" count={data.length - 5}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {data.slice(5).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.72rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontFamily: T.mono, color: 'var(--muted-foreground)', width: 20, textAlign: 'center', fontSize: '0.65rem' }}>#{i + 6}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{item.item_name}</span>
                </span>
                <span style={{ fontWeight: 700, fontFamily: T.mono, color: T.orange }}>ETB {(item.total_revenue || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Collapsible>
      )}
    </WidgetCard>
  );
}

// ── Top Customers Widget ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TopCustomersWidget({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0)
    return <EmptyWidget icon={<Users size={14} />} title="Top Customers" message="No customer data." />;

  const max = Math.max(...data.map(d => d.total_revenue || 0), 1);
  return (
    <WidgetCard
      icon={<Users size={14} />}
      title="Top Customers"
      subtitle={`${data.length} by revenue`}
      badge={<StatusBadge status="Revenue" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.slice(0, 5).map((c, i) => {
          const pct = ((c.total_revenue || 0) / max) * 100;
          return (
            <div key={i} style={{ animation: `cbFadeUp 0.2s ease ${i * 0.05}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: `hsl(${(i * 60 + 25) % 360}, 60%, 50%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 700, color: 'white', fontFamily: T.font, flexShrink: 0,
                  }}>{(c.customer_name || '?')[0]}</div>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130,
                  }} title={c.customer_name}>{c.customer_name}</span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: T.mono, color: T.orange, flexShrink: 0 }}>
                  ETB {(c.total_revenue || 0).toLocaleString()}
                </span>
              </div>
              <div style={{ marginLeft: 28 }}>
                <ProgressBar value={pct} color={`hsl(${(i * 60 + 25) % 360}, 60%, 50%)`} />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

// ── Purchase Orders Widget ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PurchaseOrdersWidget({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0)
    return <EmptyWidget icon={<ShoppingCart size={14} />} title="Purchase Orders" message="No purchase orders found." />;

  const totalValue = data.reduce((sum, po) => sum + (po.grand_total || 0), 0);
  return (
    <WidgetCard
      icon={<ShoppingCart size={14} />}
      title="Purchase Orders"
      subtitle={`${data.length} orders · ETB ${totalValue.toLocaleString()}`}
      badge={<StatusBadge status={`${data.length} Total`} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {data.slice(0, 4).map((po, i) => (
          <div key={i} style={{
            padding: '0.5rem',
            background: 'var(--background)',
            borderRadius: T.radiusSm,
            border: '1px solid var(--border)',
            animation: `cbFadeUp 0.2s ease ${i * 0.05}s both`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 700, color: 'var(--foreground)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
                }}>{po.supplier_name}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', fontFamily: T.mono, marginTop: 2 }}>
                  {po.name} · {po.transaction_date}
                </div>
              </div>
              <StatusBadge status={po.status || 'Draft'} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              {po.per_received !== undefined && (
                <div style={{ flex: 1, marginRight: '0.75rem' }}>
                  <ProgressBar value={po.per_received || 0} label={`${po.per_received || 0}% received`} color={T.green} />
                </div>
              )}
              <span style={{
                fontSize: '0.85rem', fontWeight: 800, fontFamily: T.mono, color: T.orange,
                flexShrink: 0,
              }}>ETB {(po.grand_total || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
      {data.length > 4 && (
        <Collapsible title="More orders" count={data.length - 4}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {data.slice(4).map((po, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{po.supplier_name}</span>
                  <StatusBadge status={po.status || 'Draft'} />
                </div>
                <span style={{ fontWeight: 700, fontFamily: T.mono, color: T.orange }}>ETB {(po.grand_total || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Collapsible>
      )}
    </WidgetCard>
  );
}

// ── Sales Orders Widget ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SalesOrdersWidget({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0)
    return <EmptyWidget icon={<ShoppingCart size={14} />} title="Sales Orders" message="No sales orders found." />;

  const totalValue = data.reduce((sum, so) => sum + (so.grand_total || 0), 0);
  return (
    <WidgetCard
      icon={<ShoppingCart size={14} />}
      title="Sales Orders"
      subtitle={`${data.length} orders · ETB ${totalValue.toLocaleString()}`}
      badge={<StatusBadge status={`${data.length} Total`} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {data.slice(0, 4).map((so, i) => (
          <div key={i} style={{
            padding: '0.5rem',
            background: 'var(--background)',
            borderRadius: T.radiusSm,
            border: '1px solid var(--border)',
            animation: `cbFadeUp 0.2s ease ${i * 0.05}s both`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 700, color: 'var(--foreground)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
                }}>{so.customer_name}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', fontFamily: T.mono, marginTop: 2 }}>
                  {so.name} · {so.transaction_date}
                </div>
              </div>
              <StatusBadge status={so.status || 'Draft'} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              {so.per_delivered !== undefined && (
                <div style={{ flex: 1, marginRight: '0.75rem' }}>
                  <ProgressBar value={so.per_delivered || 0} label={`${so.per_delivered || 0}% delivered`} color={T.blue} />
                </div>
              )}
              <span style={{
                fontSize: '0.85rem', fontWeight: 800, fontFamily: T.mono, color: T.orange,
                flexShrink: 0,
              }}>ETB {(so.grand_total || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
      {data.length > 4 && (
        <Collapsible title="More orders" count={data.length - 4}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {data.slice(4).map((so, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{so.customer_name}</span>
                  <StatusBadge status={so.status || 'Draft'} />
                </div>
                <span style={{ fontWeight: 700, fontFamily: T.mono, color: T.orange }}>ETB {(so.grand_total || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Collapsible>
      )}
    </WidgetCard>
  );
}

// ── Warehouse Summary Widget ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WarehouseSummaryWidget({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0)
    return <EmptyWidget icon={<Warehouse size={14} />} title="Warehouses" message="No warehouse data." />;

  const maxValue = Math.max(...data.map(d => d.total_value || 0), 1);
  return (
    <WidgetCard
      icon={<Warehouse size={14} />}
      title="Warehouse Summary"
      subtitle={`${data.length} locations`}
    >
      <div style={{ display: 'grid', gridTemplateColumns: data.length <= 2 ? '1fr' : '1fr 1fr', gap: '0.375rem' }}>
        {data.map((w, i) => {
          const pct = ((w.total_value || 0) / maxValue) * 100;
          return (
            <div key={i} style={{
              padding: '0.5rem',
              background: 'var(--background)',
              borderRadius: T.radiusSm,
              border: '1px solid var(--border)',
              animation: `cbFadeUp 0.2s ease ${i * 0.06}s both`,
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                {w.warehouse_name || w.name}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', fontFamily: T.mono, marginBottom: '0.375rem' }}>
                {w.item_count ?? 0} items
              </div>
              <ProgressBar value={pct} color={T.orange} />
              <div style={{
                fontSize: '0.78rem', fontWeight: 800, fontFamily: T.mono,
                color: T.orange, marginTop: '0.375rem',
              }}>ETB {(w.total_value || 0).toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

// ── Empty Widget ─────────────────────────────────────────────────────────────

function EmptyWidget({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <WidgetCard icon={icon} title={title} badge={<StatusBadge status="Empty" />}>
      <div style={{
        textAlign: 'center', padding: '1rem 0',
        fontSize: '0.8rem', color: 'var(--muted-foreground)',
        fontStyle: 'italic',
      }}>{message}</div>
    </WidgetCard>
  );
}

// ── Animated Tool Execution Steps ────────────────────────────────────────────

function ToolSteps({ steps, currentLabel }: { steps: string[]; currentLabel: string | null }) {
  return (
    <div style={{
      padding: '0.625rem 0.875rem',
      background: 'var(--background)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: '0.62rem', fontWeight: 700, fontFamily: T.mono,
        color: 'var(--muted-foreground)', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: '0.5rem',
      }}>AGENT PIPELINE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {steps.map((step, i) => {
          const isCurrent = step === currentLabel;
          const isPast = steps.indexOf(currentLabel || '') > i;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              animation: `cbFadeUp 0.2s ease ${i * 0.08}s both`,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isPast ? T.green : isCurrent ? T.orange : 'var(--border)',
                transition: 'background 0.3s',
              }}>
                {isPast ? (
                  <Check size={10} color="white" strokeWidth={3} />
                ) : isCurrent ? (
                  <Loader2 size={10} color="white" strokeWidth={2.5} style={{ animation: 'cbSpin 1s linear infinite' }} />
                ) : (
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--muted-foreground)' }} />
                )}
              </div>
              <span style={{
                fontSize: '0.72rem', fontFamily: T.font, fontWeight: 600,
                color: isCurrent ? T.orange : isPast ? T.green : 'var(--muted-foreground)',
                transition: 'color 0.3s',
              }}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { onClose: () => void }

export default function ChatBot({ onClose }: Props) {
  const [messages, setMessages]     = useState<UIMessage[]>([]);
  const [history, setHistory]       = useState<ChatHistory>([]);
  const [input, setInput]           = useState('');
  const [busy, setBusy]             = useState(false);
  const [toolSteps, setToolSteps]   = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const msgCount  = useRef(0);

  useEffect(() => {
    const isNew = messages.length !== msgCount.current;
    msgCount.current = messages.length;
    if (isNew && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStep]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setInput('');
    setBusy(true);
    setToolSteps([]);
    setCurrentStep(null);

    const trimmed = text.trim();
    const userMsg: UIMessage = { role: 'user', text: trimmed, id: uid() };
    const newHistory: ChatHistory = [...history, { role: 'user', parts: [{ text: trimmed }] }];
    setMessages((m) => [...m, userMsg]);
    setHistory(newHistory);

    const assistantId = uid();
    setMessages((m) => [...m, { role: 'assistant', text: '', id: assistantId }]);

    try {
      const { text: responseText, updatedHistory, toolsUsed, toolOutputs } = await runChatTurn(
        newHistory,
        (label) => {
          setToolSteps(prev => prev.includes(label) ? prev : [...prev, label]);
          setCurrentStep(label);
        },
      );
      setCurrentStep(null);
      setToolSteps([]);
      setHistory(updatedHistory);

      let accumulated = '';
      if (responseText) {
        for await (const chunk of wordStream(responseText)) {
          accumulated += chunk;
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = { ...next[next.length - 1], text: accumulated, toolsUsed, toolOutputs };
            return next;
          });
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } else {
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { ...next[next.length - 1], text: accumulated, toolsUsed, toolOutputs };
          return next;
        });
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    } catch (err) {
      setCurrentStep(null);
      setToolSteps([]);
      const errText = err instanceof Error ? err.message : 'Something went wrong.';
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { ...next[next.length - 1], text: `Error: ${errText}` };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setHistory([]);
    setToolSteps([]);
    setCurrentStep(null);
    msgCount.current = 0;
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        animation: 'cbFadeIn 0.2s ease',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 'min(520px, 100vw)', height: '100vh',
        background: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.2)',
        animation: 'cbSlideIn 0.3s cubic-bezier(0.32,0.72,0,1)',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '0.875rem 1rem',
          flexShrink: 0,
          position: 'relative',
        }}>
          {/* Accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${T.orange}, ${T.orange}00 60%)`,
          }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              {/* Logo mark */}
              <div style={{
                width: 36, height: 36, borderRadius: T.radiusSm, flexShrink: 0,
                background: T.orangeLight, border: `1.5px solid ${T.orangeBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={18} color={T.orange} strokeWidth={2} />
              </div>
              <div>
                <div style={{
                  fontWeight: 800, fontSize: '0.9rem', fontFamily: T.font,
                  color: 'var(--foreground)', letterSpacing: '-0.02em',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                }}>
                  BuildSupply AI
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 700, fontFamily: T.mono,
                    background: T.orangeLight, color: T.orange,
                    padding: '0.1rem 0.35rem', borderRadius: T.radiusPill,
                    border: `1px solid ${T.orangeBorder}`,
                    letterSpacing: '0.04em',
                  }}>A2UI</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: 2,
                  fontSize: '0.65rem', fontFamily: T.mono, color: 'var(--muted-foreground)',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: T.green, display: 'inline-block',
                    boxShadow: `0 0 4px ${T.green}`,
                  }} />
                  Live · Gemini Flash
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {messages.length > 0 && (
                <button onClick={clearChat} title="Clear" style={iconBtn}>
                  <Trash2 size={14} color="var(--muted-foreground)" strokeWidth={1.75} />
                </button>
              )}
              <button onClick={onClose} style={iconBtn}>
                <X size={15} color="var(--muted-foreground)" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Processing bar */}
          {busy && (
            <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${T.orange}, transparent)`,
                animation: 'cbScan 1.2s ease-in-out infinite',
              }} />
            </div>
          )}
        </div>

        {/* ── Tool steps panel ── */}
        {toolSteps.length > 0 && (
          <ToolSteps steps={toolSteps} currentLabel={currentStep} />
        )}

        {/* ── Message area ── */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: 'auto',
          padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>

          {/* Empty state */}
          {isEmpty && (
            <div style={{ margin: 'auto 0', padding: '0 0.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: T.radius,
                  background: T.orangeLight, border: `2px solid ${T.orangeBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 0.875rem',
                  animation: 'cbFloat 3s ease-in-out infinite',
                }}>
                  <Sparkles size={24} color={T.orange} strokeWidth={1.75} />
                </div>
                <div style={{
                  fontFamily: T.font, fontWeight: 800, fontSize: '1rem',
                  color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: '0.25rem',
                }}>
                  Ask anything about your business
                </div>
                <div style={{
                  fontFamily: T.font, fontSize: '0.78rem',
                  color: 'var(--muted-foreground)', maxWidth: 260, margin: '0 auto',
                  lineHeight: 1.5,
                }}>
                  Live access to stock, sales, shipments, orders and more
                </div>
              </div>

              {/* Suggestion grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s.prompt} onClick={() => send(s.prompt)} style={{
                    textAlign: 'left',
                    padding: '0.625rem 0.75rem',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: T.radiusSm,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: T.font,
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = T.orange;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${T.orange}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: '0.25rem', color: T.orange }}>{s.icon}</div>
                    <div style={{
                      fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.3,
                    }}>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '0.5rem',
              alignItems: 'flex-start',
              animation: 'cbFadeUp 0.2s ease',
            }}>
              {/* Bot avatar */}
              {msg.role === 'assistant' && (
                <div style={{
                  width: 26, height: 26, flexShrink: 0, marginTop: 2,
                  borderRadius: T.radiusSm,
                  background: T.orangeLight, border: `1px solid ${T.orangeBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={12} color={T.orange} strokeWidth={2.5} />
                </div>
              )}

              <div style={{
                maxWidth: msg.toolOutputs?.length ? '92%' : '80%',
                display: 'flex', flexDirection: 'column', gap: '0.375rem',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                width: msg.toolOutputs?.length ? '100%' : 'auto',
              }}>
                {/* Tool chips */}
                {msg.toolsUsed?.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {msg.toolsUsed.map((t, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                        fontSize: '0.6rem', fontFamily: T.mono, fontWeight: 700,
                        background: T.greenBg, color: T.green,
                        padding: '0.15rem 0.45rem', borderRadius: T.radiusPill,
                        border: `1px solid ${T.greenBorder}`,
                        letterSpacing: '0.02em',
                      }}>
                        <Check size={8} strokeWidth={3} />
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Bubble */}
                {msg.role === 'user' ? (
                  <div style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: `${T.radius} ${T.radius} 0.25rem ${T.radius}`,
                    background: T.orange,
                    color: 'white',
                    fontSize: '0.84rem',
                    fontFamily: T.font,
                    fontWeight: 500,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: `0 2px 12px ${T.orange}40`,
                  }}>
                    {msg.text}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    maxWidth: '100%', alignItems: 'flex-start',
                    width: msg.toolOutputs?.length ? '100%' : 'auto',
                  }}>
                    {(msg.text || !msg.toolOutputs) && (
                      <div style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: `0.25rem ${T.radius} ${T.radius} ${T.radius}`,
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                        fontSize: '0.84rem',
                        fontFamily: T.font,
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {msg.text ? <FormattedText text={msg.text} /> : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                            <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                              {[0, 1, 2].map(i => (
                                <span key={i} style={{
                                  width: 5, height: 5, borderRadius: '50%',
                                  background: T.orange,
                                  animation: `cbDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                                  display: 'inline-block',
                                }} />
                              ))}
                            </span>
                            Generating response...
                          </span>
                        )}
                      </div>
                    )}
                    {msg.toolOutputs && msg.toolOutputs.length > 0 && (
                      <WidgetRenderer outputs={msg.toolOutputs} onSend={send} />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div style={{ height: 4, flexShrink: 0 }} />
        </div>

        {/* ── Input area ── */}
        <div style={{
          padding: '0.75rem 0.875rem 1rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--card)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
            background: 'var(--background)',
            border: '1.5px solid var(--border)',
            borderRadius: T.radius,
            padding: '0.5rem 0.5rem 0.5rem 0.875rem',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = T.orange;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${T.orange}18`;
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about stock, sales, shipments…"
              rows={1}
              disabled={busy}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none',
                background: 'transparent',
                fontFamily: T.font,
                fontSize: '0.84rem',
                color: 'var(--foreground)',
                lineHeight: 1.5,
                maxHeight: '120px',
                overflowY: 'auto',
                paddingTop: '0.25rem',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              style={{
                width: 34, height: 34, flexShrink: 0,
                background: busy || !input.trim() ? 'var(--secondary)' : T.orange,
                border: 'none', borderRadius: T.radiusSm,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                alignSelf: 'flex-end',
              }}
              onMouseEnter={(e) => { if (!busy && input.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {busy
                ? <Loader2 size={15} color="var(--muted-foreground)" strokeWidth={2} style={{ animation: 'cbSpin 1s linear infinite' }} />
                : <ArrowUp size={16} color={!input.trim() ? 'var(--muted-foreground)' : 'white'} strokeWidth={2.5} />
              }
            </button>
          </div>
          <div style={{
            textAlign: 'center', marginTop: '0.375rem',
            fontSize: '0.6rem', color: 'var(--muted-foreground)',
            fontFamily: T.mono, letterSpacing: '0.04em',
          }}>
            ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cbFadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cbSlideIn  { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes cbFadeUp   { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes cbSpin     { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes cbScan     { 0% { width: 0%; margin-left: 0 } 50% { width: 50%; margin-left: 25% } 100% { width: 0%; margin-left: 100% } }
        @keyframes cbFloat    { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        @keyframes cbPulse    { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes cbDot      { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4 } 40% { transform: scale(1); opacity: 1 } }
        @keyframes cbCardIn   { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </>
  );
}

const iconBtn: React.CSSProperties = {
  width: 30, height: 30,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: T.radiusSm,
  cursor: 'pointer',
  transition: 'all 0.15s',
};
