/**
 * Frappe REST API client for BuildSupply Pro
 */
const BASE = '/api';
// Active in local dev OR when VITE_MOCK_MODE=true (e.g. Vercel demo without backend)
const DEV_BYPASS = import.meta.env.VITE_MOCK_MODE === 'true';

interface FrappeListParams {
  doctype: string;
  fields?: string[];
  filters?: Record<string, unknown> | unknown[][];
  order_by?: string;
  limit_page_length?: number;
  limit_start?: number;
}

interface FrappeResponse<T> {
  data: T;
  message?: string;
}

// ── Auth ──────────────────────────────────────────────────────────────

export async function login(usr: string, pwd: string) {
  const res = await fetch(`${BASE}/method/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `usr=${encodeURIComponent(usr)}&pwd=${encodeURIComponent(pwd)}`,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function logout() {
  await fetch(`${BASE}/method/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getLoggedUser(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/method/frappe.auth.get_logged_user`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.message;
  } catch {
    return null;
  }
}

// ── Generic CRUD ──────────────────────────────────────────────────────

export async function getList<T = Record<string, unknown>>(
  params: FrappeListParams
): Promise<T[]> {
  try {
    const qs = new URLSearchParams();
    qs.set('fields', JSON.stringify(params.fields || ['*']));
    if (params.filters) qs.set('filters', JSON.stringify(params.filters));
    if (params.order_by) qs.set('order_by', params.order_by);
    if (params.limit_page_length) qs.set('limit_page_length', String(params.limit_page_length));
    if (params.limit_start) qs.set('limit_start', String(params.limit_start));

    const res = await fetch(
      `${BASE}/resource/${encodeURIComponent(params.doctype)}?${qs}`,
      { credentials: 'include' }
    );
    if (!res.ok) throw new Error(`Failed to fetch ${params.doctype}`);
    const json: FrappeResponse<T[]> = await res.json();
    return json.data;
  } catch (err) {
    if (DEV_BYPASS) {
      console.warn(`[DEV] getList(${params.doctype}) failed, returning mock data`);
      return getDevMockList(params.doctype) as T[];
    }
    throw err;
  }
}

export async function getDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string
): Promise<T> {
  try {
    const res = await fetch(
      `${BASE}/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
      { credentials: 'include' }
    );
    if (!res.ok) throw new Error(`Failed to fetch ${doctype}/${name}`);
    const json: FrappeResponse<T> = await res.json();
    return json.data;
  } catch (err) {
    if (DEV_BYPASS) {
      console.warn(`[DEV] getDoc(${doctype}, ${name}) failed, returning mock data`);
      const list = getDevMockList(doctype) || [];
      const found = list.find((item: any) => item.name === name);
      if (found) return found as T;
      throw new Error(`Mock document ${name} not found in ${doctype}`);
    }
    throw err;
  }
}

export async function createDoc<T = Record<string, unknown>>(
  doctype: string,
  data: Partial<T>
): Promise<T> {
  try {
    const res = await fetch(`${BASE}/resource/${encodeURIComponent(doctype)}`, {
      method: 'POST',
      headers: await writeHeaders('application/json'),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to create ${doctype}`);
    const json: FrappeResponse<T> = await res.json();
    return json.data;
  } catch (err) {
    if (DEV_BYPASS) {
      console.warn(`[DEV] createDoc(${doctype}) failed, modifying inMemoryStore`);
      const store = getDevMockList(doctype);
      const newDoc = { name: `MOCK-${Date.now()}`, ...data };
      store.push(newDoc);
      return newDoc as unknown as T;
    }
    throw err;
  }
}

export async function updateDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string,
  data: Record<string, unknown>
): Promise<T> {
  try {
    const res = await fetch(
      `${BASE}/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
      {
        method: 'PUT',
        headers: await writeHeaders('application/json'),
        body: JSON.stringify(data),
        credentials: 'include',
      }
    );
    if (!res.ok) throw new Error(`Failed to update ${doctype}/${name}`);
    const json: FrappeResponse<T> = await res.json();
    return json.data;
  } catch (err) {
    if (DEV_BYPASS) {
      console.warn(`[DEV] updateDoc(${doctype}, ${name}) failed, modifying inMemoryStore`);
      const store = getDevMockList(doctype);
      const idx = store.findIndex(i => i.name === name);
      if (idx !== -1) {
        store[idx] = { ...store[idx], ...data };
        return store[idx] as unknown as T;
      }
      return { name, ...data } as unknown as T;
    }
    throw err;
  }
}

export async function deleteDoc(doctype: string, name: string) {
  try {
    const res = await fetch(
      `${BASE}/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
      {
        method: 'DELETE',
        headers: await writeHeaders(),
        credentials: 'include',
      }
    );
    if (!res.ok) throw new Error(`Failed to delete ${doctype}/${name}`);
  } catch (err) {
    if (DEV_BYPASS) {
      console.warn(`[DEV] deleteDoc(${doctype}, ${name}) failed, modifying inMemoryStore`);
      const store = getDevMockList(doctype);
      const idx = store.findIndex(i => i.name === name);
      if (idx !== -1) store.splice(idx, 1);
      return;
    }
    throw err;
  }
}

// ── Call whitelisted method ──────────────────────────────────────────

export async function callMethod<T = unknown>(
  method: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    const res = await fetch(`${BASE}/method/${method}`, {
      method: 'POST',
      headers: await writeHeaders('application/json'),
      body: JSON.stringify(args || {}),
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Method ${method} failed`);
    const json = await res.json();
    return json.message;
  } catch (err) {
    if (DEV_BYPASS) {
      console.warn(`[DEV] callMethod(${method}) failed, returning mock data`);
      return getDevMockData(method, args) as T;
    }
    throw err;
  }
}

// ── File Upload ──────────────────────────────────────────────────────

export async function uploadFile(
  file: File,
  doctype: string,
  docname: string,
  fieldname: string = 'image'
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doctype', doctype);
    formData.append('docname', docname);
    formData.append('fieldname', fieldname);
    formData.append('is_private', '0');

    const csrfToken = await getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) headers['X-Frappe-CSRF-Token'] = csrfToken;

    const res = await fetch(`${BASE}/method/upload_file`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) throw new Error('File upload failed');
    const json = await res.json();
    return json.message.file_url;
  } catch (err) {
    if (DEV_BYPASS) {
      console.warn('[DEV] uploadFile failed, returning fake URL');
      return URL.createObjectURL(file);
    }
    throw err;
  }
}

// ── CSRF token ───────────────────────────────────────────────────────

let _csrfToken: string | null = null;
let _csrfFetched = false;

async function getCsrfToken(): Promise<string> {
  if (_csrfFetched) return _csrfToken ?? '';
  _csrfFetched = true;
  try {
    const res = await fetch(`${BASE}/method/frappe.auth.get_csrf_token`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('CSRF endpoint unavailable');
    const json = await res.json();
    _csrfToken = json.message || null;
  } catch {
    // Frappe v16+ may not expose this endpoint; CSRF is optional with cookie auth
    _csrfToken = null;
  }
  return _csrfToken ?? '';
}

/** Build headers for write operations (POST/PUT/DELETE) with optional CSRF */
async function writeHeaders(contentType?: string): Promise<Record<string, string>> {
  const h: Record<string, string> = {};
  if (contentType) h['Content-Type'] = contentType;
  const csrf = await getCsrfToken();
  if (csrf) h['X-Frappe-CSRF-Token'] = csrf;
  return h;
}

export function clearCsrfToken() {
  _csrfToken = null;
  _csrfFetched = false;
}

// ── Count helper ─────────────────────────────────────────────────────

export async function getCount(
  doctype: string,
  filters?: Record<string, unknown> | unknown[][]
): Promise<number> {
  try {
    const qs = new URLSearchParams();
    qs.set('doctype', doctype);
    if (filters) qs.set('filters', JSON.stringify(filters));
    const res = await fetch(`${BASE}/method/frappe.client.get_count?${qs}`, {
      credentials: 'include',
    });
    const json = await res.json();
    return json.message;
  } catch {
    if (DEV_BYPASS) return 0;
    throw new Error(`Count failed for ${doctype}`);
  }
}

// ── Dev mock data (only used when backend is down in dev mode) ───────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDevMockData(method: string, _args?: Record<string, unknown>): any {
  if (method.includes('dashboard_stats')) {
    return {
      total_stock_value: 18_450_000,
      pending_po_count: 12,
      active_shipment_count: 4,
      monthly_sales: 3_250_000,
      low_stock_count: 7,
      overdue_po_count: 2,
      stock_change: 8.3,
    };
  }
  if (method.includes('get_stock_levels')) {
    return [
      { item_name: 'Deformed Rebar 16mm', item_code: 'STL-RB-16', actual_qty: 2400, safety_stock: 500, warehouse: 'Main Store', stock_value: 2_880_000 },
      { item_name: 'Portland Cement 50kg', item_code: 'CMT-PC-50', actual_qty: 180, safety_stock: 200, warehouse: 'Main Store', stock_value: 324_000 },
      { item_name: 'Ceramic Floor Tile 40x40', item_code: 'TIL-CF-40', actual_qty: 3200, safety_stock: 500, warehouse: 'Tile Warehouse', stock_value: 1_280_000 },
      { item_name: 'Exterior Wall Paint 20L', item_code: 'PNT-EW-20', actual_qty: 45, safety_stock: 50, warehouse: 'Main Store', stock_value: 270_000 },
      { item_name: 'PVC Pipe 4" x 6m', item_code: 'PIP-PV-4', actual_qty: 890, safety_stock: 200, warehouse: 'Pipe Yard', stock_value: 534_000 },
      { item_name: 'Corrugated Iron Sheet', item_code: 'STL-CI-28', actual_qty: 1500, safety_stock: 300, warehouse: 'Main Store', stock_value: 1_050_000 },
      { item_name: 'Welding Electrode 3.2mm', item_code: 'STL-WE-32', actual_qty: 8, safety_stock: 20, warehouse: 'Main Store', stock_value: 24_000 },
    ];
  }
  if (method.includes('warehouse_summary')) {
    return [
      { warehouse_name: 'Main Store', name: 'Main Store', item_count: 48, total_value: 8_450_000 },
      { warehouse_name: 'Tile Warehouse', name: 'Tile Warehouse', item_count: 22, total_value: 4_200_000 },
      { warehouse_name: 'Pipe Yard', name: 'Pipe Yard', item_count: 15, total_value: 2_800_000 },
      { warehouse_name: 'Paint Storage', name: 'Paint Storage', item_count: 18, total_value: 3_000_000 },
    ];
  }
  if (method.includes('top_items')) {
    return [
      { item_name: 'Deformed Rebar 16mm', item_code: 'STL-RB-16', total_revenue: 4_500_000 },
      { item_name: 'Portland Cement 50kg', item_code: 'CMT-PC-50', total_revenue: 3_200_000 },
      { item_name: 'Corrugated Iron Sheet', item_code: 'STL-CI-28', total_revenue: 2_800_000 },
      { item_name: 'Ceramic Floor Tile 40x40', item_code: 'TIL-CF-40', total_revenue: 2_100_000 },
      { item_name: 'PVC Pipe 4" x 6m', item_code: 'PIP-PV-4', total_revenue: 1_600_000 },
      { item_name: 'Exterior Wall Paint 20L', item_code: 'PNT-EW-20', total_revenue: 980_000 },
    ];
  }
  if (method.includes('sales_trend')) {
    return [
      { month: 'Oct', revenue: 2_100_000 },
      { month: 'Nov', revenue: 2_450_000 },
      { month: 'Dec', revenue: 1_900_000 },
      { month: 'Jan', revenue: 2_800_000 },
      { month: 'Feb', revenue: 3_100_000 },
      { month: 'Mar', revenue: 3_250_000 },
    ];
  }
  if (method.includes('top_customers')) {
    return [
      { customer_name: 'Sunshine Construction', total_revenue: 5_200_000 },
      { customer_name: 'Nile Building PLC', total_revenue: 3_800_000 },
      { customer_name: 'Abyssinia Developers', total_revenue: 2_900_000 },
      { customer_name: 'Meskel Construction', total_revenue: 2_100_000 },
      { customer_name: 'Addis Real Estate', total_revenue: 1_450_000 },
    ];
  }
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inMemoryStore: Record<string, any[]> = {};

function getDevMockList(doctype: string): any[] {
  if (inMemoryStore[doctype]) return inMemoryStore[doctype];

  if (doctype === 'Purchase Order') {
    inMemoryStore[doctype] = [
      { name: 'PUR-ORD-2026-001', supplier_name: 'Shanghai Steel Co.', transaction_date: '2026-02-15', grand_total: 3_200_000, status: 'To Receive and Bill', schedule_date: '2026-03-20', per_received: 0 },
      { name: 'PUR-ORD-2026-002', supplier_name: 'Istanbul Cement Ltd.', transaction_date: '2026-02-20', grand_total: 1_800_000, status: 'To Receive and Bill', schedule_date: '2026-03-15', per_received: 30 },
      { name: 'PUR-ORD-2026-003', supplier_name: 'Dubai Tiles Trading', transaction_date: '2026-01-28', grand_total: 2_400_000, status: 'Completed', schedule_date: '2026-02-28', per_received: 100 },
      { name: 'PUR-ORD-2026-004', supplier_name: 'Guangzhou Paint Factory', transaction_date: '2026-03-01', grand_total: 950_000, status: 'Draft', schedule_date: '2026-04-10', per_received: 0 },
      { name: 'PUR-ORD-2026-005', supplier_name: 'Ankara Pipe Industries', transaction_date: '2026-02-10', grand_total: 1_350_000, status: 'Overdue', schedule_date: '2026-02-25', per_received: 0 },
    ];
    return inMemoryStore[doctype];
  }
  if (doctype === 'Sales Order') {
    inMemoryStore[doctype] = [
      { name: 'SAL-ORD-2026-001', customer_name: 'Sunshine Construction', transaction_date: '2026-03-01', grand_total: 1_450_000, status: 'To Deliver and Bill', delivery_date: '2026-03-10', per_delivered: 60 },
      { name: 'SAL-ORD-2026-002', customer_name: 'Nile Building PLC', transaction_date: '2026-02-28', grand_total: 2_100_000, status: 'To Deliver and Bill', delivery_date: '2026-03-08', per_delivered: 0 },
      { name: 'SAL-ORD-2026-003', customer_name: 'Abyssinia Developers', transaction_date: '2026-02-25', grand_total: 890_000, status: 'Completed', delivery_date: '2026-03-01', per_delivered: 100 },
      { name: 'SAL-ORD-2026-004', customer_name: 'Meskel Construction', transaction_date: '2026-03-05', grand_total: 1_680_000, status: 'Draft', delivery_date: '2026-03-15', per_delivered: 0 },
    ];
    return inMemoryStore[doctype];
  }
  if (doctype === 'Sales Invoice') {
    inMemoryStore[doctype] = [
      { name: 'SINV-2026-001', customer_name: 'Sunshine Construction', posting_date: '2026-03-05', due_date: '2026-04-05', grand_total: 1_200_000, outstanding_amount: 1_200_000, status: 'Unpaid' },
      { name: 'SINV-2026-002', customer_name: 'Nile Building PLC', posting_date: '2026-02-20', due_date: '2026-03-20', grand_total: 850_000, outstanding_amount: 0, status: 'Paid' },
      { name: 'SINV-2026-003', customer_name: 'Abyssinia Developers', posting_date: '2026-01-15', due_date: '2026-02-15', grand_total: 450_000, outstanding_amount: 450_000, status: 'Overdue' },
      { name: 'SINV-2026-004', customer_name: 'Meskel Construction', posting_date: '2026-03-07', due_date: '2026-03-07', grand_total: 2_100_000, outstanding_amount: 1_000_000, status: 'Partly Paid' },
    ];
    return inMemoryStore[doctype];
  }
  if (doctype === 'Import Shipment') {
    inMemoryStore[doctype] = [
      { name: 'SHP-2026-001', shipment_title: 'Steel Rebar Shipment', origin_country: 'China', eta: '2026-03-18', status: 'In Transit', total_landed_cost: 4_200_000 },
      { name: 'SHP-2026-002', shipment_title: 'Cement Bulk Order', origin_country: 'Turkey', eta: '2026-03-12', status: 'In Transit', total_landed_cost: 2_800_000 },
      { name: 'SHP-2026-003', shipment_title: 'Tile Collection Q1', origin_country: 'UAE', eta: '2026-03-25', status: 'Ordered', total_landed_cost: 1_600_000 },
      { name: 'SHP-2026-004', shipment_title: 'Paint & Accessories', origin_country: 'China', eta: '2026-04-05', status: 'Ordered', total_landed_cost: 950_000 },
    ];
    return inMemoryStore[doctype];
  }
  if (doctype === 'Item') {
    inMemoryStore[doctype] = [
      { name: 'STL-RB-16', item_code: 'STL-RB-16', item_name: 'Deformed Rebar 16mm', item_group: 'Steel', stock_uom: 'Nos', standard_rate: 1200, safety_stock: 500, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400' },
      { name: 'STL-CI-28', item_code: 'STL-CI-28', item_name: 'Corrugated Iron Sheet', item_group: 'Steel', stock_uom: 'Sheet', standard_rate: 700, safety_stock: 300, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400' },
      { name: 'STL-WE-32', item_code: 'STL-WE-32', item_name: 'Welding Electrode 3.2mm', item_group: 'Steel', stock_uom: 'Kg', standard_rate: 3000, safety_stock: 20, image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400' },
      { name: 'STL-AP-4', item_code: 'STL-AP-4', item_name: 'Angle Iron 4" x 6m', item_group: 'Steel', stock_uom: 'Length', standard_rate: 1800, safety_stock: 100, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400' },
      { name: 'CMT-PC-50', item_code: 'CMT-PC-50', item_name: 'Portland Cement 50kg', item_group: 'Cement', stock_uom: 'Bag', standard_rate: 1800, safety_stock: 200, image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400' },
      { name: 'CMT-SC-25', item_code: 'CMT-SC-25', item_name: 'Waterproof Screed 25kg', item_group: 'Cement', stock_uom: 'Bag', standard_rate: 950, safety_stock: 150, image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400' },
      { name: 'TIL-CF-40', item_code: 'TIL-CF-40', item_name: 'Ceramic Floor Tile 40x40', item_group: 'Tiles', stock_uom: 'Sqm', standard_rate: 400, safety_stock: 500, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400' },
      { name: 'PNT-EW-20', item_code: 'PNT-EW-20', item_name: 'Exterior Wall Paint 20L', item_group: 'Paint', stock_uom: 'Can', standard_rate: 6000, safety_stock: 50, image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400' },
      { name: 'PIP-PV-4', item_code: 'PIP-PV-4', item_name: 'PVC Pipe 4" x 6m', item_group: 'Hardware', stock_uom: 'Length', standard_rate: 600, safety_stock: 200, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400' },
      { name: 'HW-BB-M16', item_code: 'HW-BB-M16', item_name: 'Anchor Bolt M16 x 150mm', item_group: 'Hardware', stock_uom: 'Nos', standard_rate: 85, safety_stock: 1000, image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400' },

    ];
    return inMemoryStore[doctype];
  }
  if (doctype === 'Item Group') {
    inMemoryStore[doctype] = [
      { name: 'Steel' }, { name: 'Cement' }, { name: 'Tiles' }, { name: 'Paint' }, { name: 'Hardware' },
    ];
    return inMemoryStore[doctype];
  }
  if (doctype === 'User') {
    inMemoryStore[doctype] = [
      { name: 'abebe.girma@buildsupply.local', full_name: 'Abebe Girma', first_name: 'Abebe', last_name: 'Girma', user_type: 'System User', enabled: 1, mobile_no: '+251911000001', roles: [{ role: 'Import Manager' }] },
      { name: 'sara.tekeste@buildsupply.local', full_name: 'Sara Tekeste', first_name: 'Sara', last_name: 'Tekeste', user_type: 'System User', enabled: 1, mobile_no: '+251911000002', roles: [{ role: 'Sales Manager' }] },
      { name: 'daniel.hailu@buildsupply.local', full_name: 'Daniel Hailu', first_name: 'Daniel', last_name: 'Hailu', user_type: 'System User', enabled: 1, mobile_no: '+251911000003', roles: [{ role: 'Warehouse Manager' }] },
      { name: 'mekdes.alemu@buildsupply.local', full_name: 'Mekdes Alemu', first_name: 'Mekdes', last_name: 'Alemu', user_type: 'System User', enabled: 1, mobile_no: '+251911000004', roles: [{ role: 'Accountant' }] },
      { name: 'yonas.bekele@buildsupply.local', full_name: 'Yonas Bekele', first_name: 'Yonas', last_name: 'Bekele', user_type: 'System User', enabled: 1, mobile_no: '+251911000005', roles: [{ role: 'Sales Rep' }] },
    ];
    return inMemoryStore[doctype];
  }
  if (doctype === 'Customer') {
    inMemoryStore[doctype] = [
      { name: 'Sunshine Construction', customer_name: 'Sunshine Construction', customer_group: 'Commercial', territory: 'Ethiopia', credit_limit: 15_000_000, customer_type: 'Company', disabled: 0 },
      { name: 'Nile Building PLC', customer_name: 'Nile Building PLC', customer_group: 'Government', territory: 'Ethiopia', credit_limit: 25_000_000, customer_type: 'Company', disabled: 0 },
      { name: 'Abyssinia Developers', customer_name: 'Abyssinia Developers', customer_group: 'Commercial', territory: 'Ethiopia', credit_limit: 5_000_000, customer_type: 'Company', disabled: 0 },
      { name: 'Meskel Construction', customer_name: 'Meskel Construction', customer_group: 'Commercial', territory: 'Ethiopia', credit_limit: 10_000_000, customer_type: 'Company', disabled: 0 },
    ];
    return inMemoryStore[doctype];
  }
  if (doctype === 'Supplier') {
    inMemoryStore[doctype] = [
      { name: 'SUP-001', supplier_name: 'Shanghai Steel Co.', supplier_group: 'Raw Material', country: 'China', supplier_type: 'Company' },
      { name: 'SUP-002', supplier_name: 'Istanbul Cement Ltd.', supplier_group: 'Raw Material', country: 'Turkey', supplier_type: 'Company' },
      { name: 'SUP-003', supplier_name: 'Dubai Tiles Trading', supplier_group: 'Distributor', country: 'UAE', supplier_type: 'Company' },
      { name: 'SUP-004', supplier_name: 'Guangzhou Paint Factory', supplier_group: 'Hardware', country: 'China', supplier_type: 'Company' },
      { name: 'SUP-005', supplier_name: 'Ankara Pipe Industries', supplier_group: 'Hardware', country: 'Turkey', supplier_type: 'Company' },
    ];
    return inMemoryStore[doctype];
  }
  if (doctype === 'Warehouse') {
    inMemoryStore[doctype] = [
      { name: 'Main Store', warehouse_name: 'Main Store', warehouse_type: 'Transit', is_group: 0, company: 'Import Wholesale PLC' },
      { name: 'Tile Warehouse', warehouse_name: 'Tile Warehouse', warehouse_type: 'Store', is_group: 0, company: 'Import Wholesale PLC' },
      { name: 'Pipe Yard', warehouse_name: 'Pipe Yard', warehouse_type: 'Store', is_group: 0, company: 'Import Wholesale PLC' },
      { name: 'Paint Storage', warehouse_name: 'Paint Storage', warehouse_type: 'Transit', is_group: 0, company: 'Import Wholesale PLC' },
    ];
    return inMemoryStore[doctype];
  }
  return [];
}
