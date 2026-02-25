import { useQuery } from '@tanstack/react-query';
import { getList } from '../client';
import type { Customer } from '../types';

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () =>
      getList<Customer>({
        doctype: 'Customer',
        fields: ['name', 'customer_name', 'customer_group', 'territory', 'credit_limit'],
        order_by: 'customer_name asc',
        limit_page_length: 100,
      }),
  });
}
