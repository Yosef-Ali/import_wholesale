/**
 * Frappe REST API client for BuildSupply Pro
 */
const BASE = '/api';

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
}

export async function getDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string
): Promise<T> {
  const res = await fetch(
    `${BASE}/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error(`Failed to fetch ${doctype}/${name}`);
  const json: FrappeResponse<T> = await res.json();
  return json.data;
}

export async function createDoc<T = Record<string, unknown>>(
  doctype: string,
  data: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${BASE}/resource/${encodeURIComponent(doctype)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': await getCsrfToken() },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to create ${doctype}`);
  const json: FrappeResponse<T> = await res.json();
  return json.data;
}

export async function updateDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string,
  data: Record<string, unknown>
): Promise<T> {
  const res = await fetch(
    `${BASE}/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': await getCsrfToken() },
      body: JSON.stringify(data),
      credentials: 'include',
    }
  );
  if (!res.ok) throw new Error(`Failed to update ${doctype}/${name}`);
  const json: FrappeResponse<T> = await res.json();
  return json.data;
}

export async function deleteDoc(doctype: string, name: string) {
  const res = await fetch(
    `${BASE}/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    {
      method: 'DELETE',
      headers: { 'X-Frappe-CSRF-Token': await getCsrfToken() },
      credentials: 'include',
    }
  );
  if (!res.ok) throw new Error(`Failed to delete ${doctype}/${name}`);
}

// ── Call whitelisted method ──────────────────────────────────────────

export async function callMethod<T = unknown>(
  method: string,
  args?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${BASE}/method/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': await getCsrfToken() },
    body: JSON.stringify(args || {}),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Method ${method} failed`);
  const json = await res.json();
  return json.message;
}

// ── CSRF token ───────────────────────────────────────────────────────

let _csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  const res = await fetch(`${BASE}/method/frappe.auth.get_csrf_token`, {
    credentials: 'include',
  });
  const json = await res.json();
  _csrfToken = json.message;
  return _csrfToken!;
}

export function clearCsrfToken() {
  _csrfToken = null;
}

// ── Count helper ─────────────────────────────────────────────────────

export async function getCount(
  doctype: string,
  filters?: Record<string, unknown> | unknown[][]
): Promise<number> {
  const qs = new URLSearchParams();
  qs.set('doctype', doctype);
  if (filters) qs.set('filters', JSON.stringify(filters));
  const res = await fetch(`${BASE}/method/frappe.client.get_count?${qs}`, {
    credentials: 'include',
  });
  const json = await res.json();
  return json.message;
}
