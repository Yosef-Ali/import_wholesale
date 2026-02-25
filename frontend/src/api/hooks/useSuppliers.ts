import { useQuery } from '@tanstack/react-query';
import { getList } from '../client';
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
