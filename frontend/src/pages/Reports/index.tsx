import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { callMethod } from '../../api/client';
import { Download, Calendar } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import TopItemsChart from '../../components/Charts/TopItemsChart';
import TopCustomersChart from '../../components/Charts/TopCustomersChart';
import { fmtETBCompact } from '../../utils/format';
import { useDashboardStats } from '../../api/hooks/useDashboard';

interface TopItem     { item_code: string; item_name: string; total_qty: number; total_amount: number }
interface TopCustomer { customer: string; customer_name: string; invoice_count: number; total_revenue: number }

export default function Reports() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('year');
  const { data: stats } = useDashboardStats();

  const { data: topItems = [], isLoading: itemsLoading } = useQuery<TopItem[]>({
    queryKey: ['top-items', period],
    queryFn: () => callMethod('buildsupply.api.reports.get_top_items', { limit: 10, period }),
  });

  const { data: topCustomers = [], isLoading: customersLoading } = useQuery<TopCustomer[]>({
    queryKey: ['top-customers', period],
    queryFn: () => callMethod('buildsupply.api.reports.get_top_customers', { limit: 10 }),
  });

  const isLoading = itemsLoading || customersLoading;

  const totalRevenue = useMemo(
    () => topCustomers.reduce((s, c) => s + (c.total_revenue || 0), 0),
    [topCustomers],
  );
  const totalQty = useMemo(
    () => topItems.reduce((s, i) => s + (i.total_qty || 0), 0),
    [topItems],
  );
  const totalInvoices = useMemo(
    () => topCustomers.reduce((s, c) => s + (c.invoice_count || 0), 0),
    [topCustomers],
  );
  const avgOrderValue = useMemo(
    () => (totalInvoices > 0 ? totalRevenue / totalInvoices : 0),
    [totalRevenue, totalInvoices],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <span className="font-secondary text-sm text-[var(--muted-foreground)]">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">
            Reports & Analytics
          </h1>
          <p className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)] mt-1 mb-0">
            Business performance insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center bg-[var(--secondary)] rounded-full p-[3px]">
            {(['month', 'quarter', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`font-secondary text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer border-none capitalize ${
                  period === p
                    ? 'font-medium text-[var(--foreground)] bg-[var(--card)]'
                    : 'text-[var(--muted-foreground)] bg-transparent'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-[var(--secondary)] rounded-full px-3 py-2">
            <Calendar size={14} className="text-[var(--muted-foreground)]" />
            <span className="font-secondary text-sm text-[var(--foreground)]">2025</span>
          </div>
          <button className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <StatCard
          title="Total Revenue"
          value={fmtETBCompact(totalRevenue || (stats?.monthly_sales ?? 0))}
          change="+12.4% vs last period"
          delay="0.04s"
          bars={[12, 20, 28, 32]}
        />
        <StatCard
          title="Units Sold"
          value={totalQty > 0 ? totalQty.toLocaleString() : '—'}
          subtitle="Items"
          change="+8.2% vs last period"
          delay="0.08s"
          bars={[16, 24, 20, 28]}
        />
        <StatCard
          title="Active Customers"
          value={topCustomers.length > 0 ? topCustomers.length.toString() : '—'}
          subtitle="Customers"
          change="Top performers"
          delay="0.12s"
          bars={[20, 16, 24, 20]}
        />
        <StatCard
          title="Avg Order Value"
          value={avgOrderValue > 0 ? fmtETBCompact(avgOrderValue) : '—'}
          change="+5.1% vs last period"
          delay="0.16s"
          bars={[24, 20, 16, 28]}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="flex gap-4 px-6 pb-6">
        <div className="flex-1">
          <TopItemsChart data={topItems} />
        </div>
        <div className="flex-1">
          <TopCustomersChart data={topCustomers} />
        </div>
      </div>

    </div>
  );
}
