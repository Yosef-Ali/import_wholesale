import { useQuery } from '@tanstack/react-query';
import { getList, callMethod } from '../client';
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
