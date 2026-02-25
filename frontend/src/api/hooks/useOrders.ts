import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, getDoc, createDoc, updateDoc } from '../client';
import type { PurchaseOrder, SalesOrder, ImportShipment } from '../types';

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
