import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, getDoc, createDoc, updateDoc, deleteDoc } from '../client';
import type { Customer } from '../types';

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () =>
      getList<Customer>({
        doctype: 'Customer',
        fields: ['name', 'customer_name', 'customer_group', 'territory', 'credit_limit', 'customer_type', 'disabled'],
        order_by: 'customer_name asc',
        limit_page_length: 100,
      }),
  });
}

export function useCustomer(name: string | null) {
  return useQuery<Customer>({
    queryKey: ['customer', name],
    queryFn: () => getDoc<Customer>('Customer', name!),
    enabled: !!name,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Customer>) => createDoc('Customer', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Partial<Customer> }) =>
      updateDoc('Customer', name, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.name] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteDoc('Customer', name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
