import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, getDoc, createDoc, updateDoc, deleteDoc } from '../client';

export interface User {
  name: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  enabled: number;
  mobile_no?: string;
  gender?: string;
  language?: string;
  roles?: { role: string }[];
}

export const APP_ROLES = [
  { name: 'BuildSupply Admin',  description: 'Full access to everything' },
  { name: 'Import Manager',     description: 'Create & manage shipments and POs' },
  { name: 'Warehouse Manager',  description: 'Inventory and warehouse access' },
  { name: 'Sales Manager',      description: 'Customers, sales orders, reports' },
  { name: 'Sales Rep',          description: 'View customers and sales orders' },
  { name: 'Accountant',         description: 'Dashboard, reports, view shipments' },
] as const;

export type AppRole = (typeof APP_ROLES)[number]['name'];

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () =>
      getList<User>({
        doctype: 'User',
        fields: ['name', 'full_name', 'first_name', 'last_name', 'user_type', 'enabled', 'mobile_no'],
        order_by: 'full_name asc',
        limit_page_length: 200,
        filters: [['User', 'name', 'not in', ['Administrator', 'Guest']]],
      }),
  });
}

export function useUser(name: string | null) {
  return useQuery<User>({
    queryKey: ['user', name],
    queryFn: () => getDoc<User>('User', name!),
    enabled: !!name,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createDoc<User>('User', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      updateDoc<User>('User', name, data),
    onSuccess: (_d, { name }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', name] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteDoc('User', name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
