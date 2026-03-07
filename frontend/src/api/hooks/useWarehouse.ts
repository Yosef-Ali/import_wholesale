import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, getDoc, createDoc, updateDoc, deleteDoc, callMethod } from '../client';
import type { Warehouse } from '../types';

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () =>
      getList<Warehouse>({
        doctype: 'Warehouse',
        fields: ['name', 'warehouse_name', 'warehouse_type', 'is_group', 'company'],
        filters: { is_group: 0 },
        order_by: 'name asc',
        limit_page_length: 50,
      }),
  });
}

export function useWarehouseSummary() {
  return useQuery({
    queryKey: ['warehouse-summary'],
    queryFn: () => callMethod('buildsupply.api.inventory.get_warehouse_summary'),
  });
}

// ── WAREHOUSE CRUD HOOKS ──────────────────────────────────────────────

export function useWarehouse(name: string | null) {
  return useQuery<Warehouse>({
    queryKey: ['warehouse', name],
    queryFn: () => getDoc<Warehouse>('Warehouse', name!),
    enabled: !!name,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      createDoc<Warehouse>('Warehouse', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      updateDoc<Warehouse>('Warehouse', name, data),
    onSuccess: (_d, { name }) => {
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      qc.invalidateQueries({ queryKey: ['warehouse', name] });
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteDoc('Warehouse', name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}
