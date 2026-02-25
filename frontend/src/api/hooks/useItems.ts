import { useQuery } from '@tanstack/react-query';
import { getList, callMethod } from '../client';
import type { Item, StockLevel } from '../types';

export function useItems(itemGroup?: string) {
  return useQuery<Item[]>({
    queryKey: ['items', itemGroup],
    queryFn: () =>
      getList<Item>({
        doctype: 'Item',
        fields: ['name', 'item_code', 'item_name', 'item_group', 'stock_uom', 'standard_rate', 'safety_stock', 'image'],
        filters: itemGroup ? { item_group: itemGroup } : undefined,
        order_by: 'item_name asc',
        limit_page_length: 100,
      }),
  });
}

export function useStockLevels(warehouse?: string, itemGroup?: string) {
  return useQuery<StockLevel[]>({
    queryKey: ['stock-levels', warehouse, itemGroup],
    queryFn: () =>
      callMethod('buildsupply.api.inventory.get_stock_levels', {
        warehouse: warehouse || undefined,
        item_group: itemGroup || undefined,
      }),
  });
}

export function useItemGroups() {
  return useQuery({
    queryKey: ['item-groups'],
    queryFn: () =>
      getList<{ name: string; parent_item_group: string }>({
        doctype: 'Item Group',
        fields: ['name', 'parent_item_group'],
        filters: { is_group: 0 },
        order_by: 'name asc',
        limit_page_length: 50,
      }),
  });
}
