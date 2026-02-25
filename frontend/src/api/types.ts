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

export interface ImportShipment {
  name: string;
  shipment_title: string;
  purchase_order: string;
  supplier: string;
  supplier_name: string;
  status: string;
  shipping_method: string;
  container_number: string;
  order_date: string;
  eta: string;
  arrival_date: string;
  origin_country: string;
  destination_warehouse: string;
  total_landed_cost: number;
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
