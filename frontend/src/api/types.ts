export interface Item {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  safety_stock: number;
  description?: string;
  image?: string;
}

export interface Supplier {
  name: string;
  supplier_name: string;
  supplier_group: string;
  country: string;
  supplier_type: string;
}

export interface Customer {
  name: string;
  customer_name: string;
  customer_group: string;
  territory: string;
  credit_limit: number;
  customer_type?: string;
  disabled?: number;
}

export interface PurchaseOrder {
  name: string;
  supplier: string;
  supplier_name: string;
  transaction_date: string;
  schedule_date: string;
  grand_total: number;
  status: string;
  per_received: number;
}

export interface SalesOrder {
  name: string;
  customer: string;
  customer_name: string;
  transaction_date: string;
  delivery_date: string;
  grand_total: number;
  status: string;
  per_delivered: number;
}

export interface SalesInvoice {
  name: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  outstanding_amount: number;
  status: string;
}

export interface ImportShipment {
  name: string;
  shipment_title?: string;
  purchase_order?: string;
  supplier?: string;
  supplier_name?: string;
  status?: string;
  shipping_method?: string;
  container_number?: string;
  order_date?: string;
  ship_date?: string;
  eta?: string;
  arrival_date?: string;
  clearance_date?: string;
  warehouse_date?: string;
  origin_country?: string;
  destination_warehouse?: string;
  total_landed_cost?: number;
  fob_cost?: number;
  freight_cost?: number;
  insurance_cost?: number;
  customs_duty?: number;
  sur_tax?: number;
  vat?: number;
  other_charges?: number;
  // Customs declaration header
  tax_payer?: string;
  tin_number?: string;
  declaration_number?: string;
  item_description?: string;
  bank_permit_number?: string;
  commercial_invoice_no?: string;
  bl_number?: string;
  fcy_rate?: number;
  invoice_value_fcy?: number;
  dvp_value?: number;
  // Cost-sheet totals & GL distribution
  customs_total?: number;
  etb_total?: number;
  vat_rebate?: number;
  withholding_payable?: number;
  purchase_total?: number;
  supplier_payable?: number;
  git_amount?: number;
  cvd_amount?: number;
  // Linkage
  purchase_receipt?: string;
  landed_cost_voucher?: string;
  alloc_method?: string;
  // Child tables
  charges?: ImportChargeLine[];
  item_allocation?: ImportItemAllocation[];
}

export interface ImportChargeLine {
  name?: string;
  sn?: number;
  description?: string;
  charge_group?: string;
  customs_amount?: number;
  etb_amount?: number;
  is_fob?: number;
  capitalize?: number;
  recoverable?: number;
  distribute?: number;
  lcv_account?: string;
}

export interface ImportItemAllocation {
  name?: string;
  item_code?: string;
  description?: string;
  qty?: number;
  weight_basis?: number;
  landed_unit_cost?: number;
  landed_total?: number;
}

export interface Warehouse {
  name: string;
  warehouse_name: string;
  warehouse_type: string;
  is_group: number;
  company: string;
}

export interface StockLevel {
  item_code: string;
  item_name: string;
  item_group: string;
  warehouse: string;
  actual_qty: number;
  projected_qty: number;
  reserved_qty: number;
  stock_value: number;
  safety_stock: number;
  is_low_stock: number;
}

export interface DashboardStats {
  stock_value: number;
  pending_purchase_orders: number;
  active_shipments: number;
  monthly_sales: number;
  low_stock_items: number;
  overdue_purchase_orders: number;
}

export interface SalesTrend {
  month: string;
  total: number;
}
