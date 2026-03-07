import { Calendar, Download } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import SalesTrendChart from '../../components/Charts/SalesTrendChart';
import RevenueBreakdown from '../../components/Charts/RevenueBreakdown';
import TransactionsTable from '../../components/ui/TransactionsTable';
import { useDashboardStats, useSalesTrend } from '../../api/hooks/useDashboard';
import { fmtETBCompact } from '../../utils/format';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: trend } = useSalesTrend();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <span className="font-secondary text-sm text-[var(--muted-foreground)]">
          Loading…
        </span>
      </div>
    );
  }

  const totalRevenue = fmtETBCompact(stats?.monthly_sales ?? 20320);

  return (
    <div className="flex flex-col gap-0">

      {/* Welcome Row */}
      <div className="flex items-center justify-between px-6 pt-6">
        <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">
          Welcome back, Salung
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--secondary)] rounded-full px-3 py-2">
            <span className="font-secondary text-sm text-[var(--foreground)]">Daily</span>
          </div>
          <div className="flex items-center gap-2 bg-[var(--secondary)] rounded-full px-3 py-2">
            <Calendar size={14} className="text-[var(--muted-foreground)]" />
            <span className="font-secondary text-sm text-[var(--foreground)]">6 Nov 2025</span>
          </div>
          <button className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Grid - 4 columns */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <StatCard
          title="Total Revenue"
          value={fmtETBCompact(stats?.stock_value ?? 20320)}
          change="+0.94 last year"
          delay="0.04s"
          bars={[12, 20, 28, 16]}
        />
        <StatCard
          title="Total Orders"
          value={stats?.pending_purchase_orders ?? '10,320'}
          subtitle="Orders"
          change="+0.94 last year"
          delay="0.08s"
          bars={[12, 20, 28, 16]}
        />
        <StatCard
          title="New Customers"
          value={stats?.active_shipments ? `${stats.active_shipments.toLocaleString()}` : '4,305'}
          subtitle="New Users"
          change="+0.94 last year"
          delay="0.12s"
          bars={[12, 20, 28, 16]}
        />
        <StatCard
          title="Conversion Rate"
          value="3.9%"
          change="+0.94 last year"
          delay="0.16s"
          bars={[12, 20, 28, 16]}
        />
      </div>

      {/* Charts Row */}
      <div className="flex gap-4 px-6">
        <div className="flex-1">
          <SalesTrendChart
            data={trend && trend.length > 0 ? trend : [
              { month: 'January', total: 35000 },
              { month: 'February', total: 28000 },
              { month: 'March', total: 42000 },
              { month: 'April', total: 31000 },
              { month: 'May', total: 25000 },
              { month: 'June', total: 56000 },
              { month: 'July', total: 38000 },
              { month: 'August', total: 33000 },
              { month: 'September', total: 29000 },
              { month: 'October', total: 36000 },
              { month: 'November', total: 27000 },
              { month: 'December', total: 40000 },
            ]}
            totalRevenue={totalRevenue}
          />
        </div>
        <RevenueBreakdown totalRevenue={totalRevenue} />
      </div>

      {/* Transactions Table */}
      <div className="px-6 py-4">
        <TransactionsTable />
      </div>
    </div>
  );
}
