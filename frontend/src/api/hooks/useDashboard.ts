import { useQuery } from '@tanstack/react-query';
import { callMethod } from '../client';
import type { DashboardStats, SalesTrend } from '../types';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => callMethod('buildsupply.api.dashboard.get_dashboard_stats'),
    refetchInterval: 30000,
  });
}

export function useSalesTrend() {
  return useQuery<SalesTrend[]>({
    queryKey: ['sales-trend'],
    queryFn: () => callMethod('buildsupply.api.dashboard.get_sales_trend'),
  });
}
