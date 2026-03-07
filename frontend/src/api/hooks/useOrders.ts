import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, getDoc, createDoc, updateDoc, deleteDoc } from '../client';
import type { PurchaseOrder, SalesOrder, ImportShipment, SalesInvoice } from '../types';

export function usePurchaseOrders(status?: string) {
  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', status],
    queryFn: () =>
      getList<PurchaseOrder>({
        doctype: 'Purchase Order',
        fields: ['name', 'supplier', 'supplier_name', 'transaction_date', 'schedule_date', 'grand_total', 'status', 'per_received'],
        filters: status ? { status } : { docstatus: 1 },
        order_by: 'transaction_date desc',
        limit_page_length: 50,
      }),
  });
}

export function useSalesOrders(status?: string) {
  return useQuery<SalesOrder[]>({
    queryKey: ['sales-orders', status],
    queryFn: () =>
      getList<SalesOrder>({
        doctype: 'Sales Order',
        fields: ['name', 'customer', 'customer_name', 'transaction_date', 'delivery_date', 'grand_total', 'status', 'per_delivered'],
        filters: status ? { status } : { docstatus: 1 },
        order_by: 'transaction_date desc',
        limit_page_length: 50,
      }),
  });
}

export function useSalesInvoices(status?: string) {
  return useQuery<SalesInvoice[]>({
    queryKey: ['sales-invoices', status],
    queryFn: () =>
      getList<SalesInvoice>({
        doctype: 'Sales Invoice',
        fields: ['name', 'customer', 'customer_name', 'posting_date', 'due_date', 'grand_total', 'outstanding_amount', 'status'],
        filters: status ? { status } : { docstatus: 1 },
        order_by: 'posting_date desc',
        limit_page_length: 50,
      }),
  });
}

export function useImportShipments(status?: string) {
  return useQuery<ImportShipment[]>({
    queryKey: ['import-shipments', status],
    queryFn: () =>
      getList<ImportShipment>({
        doctype: 'Import Shipment',
        fields: ['name', 'shipment_title', 'purchase_order', 'supplier', 'supplier_name', 'status', 'shipping_method', 'container_number', 'order_date', 'eta', 'arrival_date', 'origin_country', 'destination_warehouse', 'total_landed_cost'],
        filters: status ? { status } : {},
        order_by: 'order_date desc',
        limit_page_length: 50,
      }),
  });
}

export function useImportShipment(name: string | null) {
  return useQuery<ImportShipment>({
    queryKey: ['import-shipment', name],
    queryFn: () => getDoc<ImportShipment>('Import Shipment', name!),
    enabled: !!name,
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      createDoc<ImportShipment>('Import Shipment', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['import-shipments'] }),
  });
}

export function useUpdateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      updateDoc<ImportShipment>('Import Shipment', name, data),
    onSuccess: (_d, { name }) => {
      qc.invalidateQueries({ queryKey: ['import-shipments'] });
      qc.invalidateQueries({ queryKey: ['import-shipment', name] });
    },
  });
}

// ── WHOLESALE CRUD HOOKS ──────────────────────────────────────────────

export function useSalesOrder(name: string | null) {
  return useQuery<SalesOrder>({
    queryKey: ['sales-order', name],
    queryFn: () => getDoc<SalesOrder>('Sales Order', name!),
    enabled: !!name,
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      createDoc<SalesOrder>('Sales Order', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-orders'] }),
  });
}

export function useUpdateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      updateDoc<SalesOrder>('Sales Order', name, data),
    onSuccess: (_d, { name }) => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.invalidateQueries({ queryKey: ['sales-order', name] });
    },
  });
}

export function useDeleteSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteDoc('Sales Order', name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-orders'] }),
  });
}

export function useSalesInvoice(name: string | null) {
  return useQuery<SalesInvoice>({
    queryKey: ['sales-invoice', name],
    queryFn: () => getDoc<SalesInvoice>('Sales Invoice', name!),
    enabled: !!name,
  });
}

export function useCreateSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      createDoc<SalesInvoice>('Sales Invoice', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-invoices'] }),
  });
}

export function useUpdateSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      updateDoc<SalesInvoice>('Sales Invoice', name, data),
    onSuccess: (_d, { name }) => {
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
      qc.invalidateQueries({ queryKey: ['sales-invoice', name] });
    },
  });
}

export function useDeleteSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteDoc('Sales Invoice', name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-invoices'] }),
  });
}
