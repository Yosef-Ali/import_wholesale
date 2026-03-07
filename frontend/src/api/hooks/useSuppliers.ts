import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, getDoc, createDoc, updateDoc, deleteDoc } from '../client';
import type { Supplier } from '../types';

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () =>
      getList<Supplier>({
        doctype: 'Supplier',
        fields: ['name', 'supplier_name', 'supplier_group', 'country', 'supplier_type'],
        order_by: 'supplier_name asc',
        limit_page_length: 100,
      }),
  });
}

// ── SUPPLIER CRUD HOOKS ──────────────────────────────────────────────

export function useSupplier(name: string | null) {
  return useQuery<Supplier>({
    queryKey: ['supplier', name],
    queryFn: () => getDoc<Supplier>('Supplier', name!),
    enabled: !!name,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      createDoc<Supplier>('Supplier', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      updateDoc<Supplier>('Supplier', name, data),
    onSuccess: (_d, { name }) => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['supplier', name] });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteDoc('Supplier', name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}
