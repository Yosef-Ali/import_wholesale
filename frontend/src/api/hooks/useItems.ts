import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, callMethod, getDoc, createDoc, updateDoc, deleteDoc } from '../client';
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

export function useItemDetail(itemName: string | null) {
  return useQuery<Item & Record<string, unknown>>({
    queryKey: ['item-detail', itemName],
    queryFn: () => getDoc<Item & Record<string, unknown>>('Item', itemName!),
    enabled: !!itemName,
  });
}

export function useItemStock(itemCode: string | null) {
  return useQuery<StockLevel[]>({
    queryKey: ['item-stock', itemCode],
    // Backend only accepts warehouse/item_group — filter by item_code client-side
    queryFn: () =>
      callMethod<StockLevel[]>('buildsupply.api.inventory.get_stock_levels', {}).then(
        (rows) => rows.filter((r) => r.item_code === itemCode),
      ),
    enabled: !!itemCode,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Item>) => createDoc('Item', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Partial<Item> }) => updateDoc('Item', name, data),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item-detail', name] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteDoc('Item', name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
