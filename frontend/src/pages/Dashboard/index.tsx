import { useMemo } from 'react';
import { Calendar, Download } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import SalesTrendChart from '../../components/Charts/SalesTrendChart';
import RevenueBreakdown from '../../components/Charts/RevenueBreakdown';
import TransactionsTable from '../../components/ui/TransactionsTable';
import { useDashboardStats, useSalesTrend } from '../../api/hooks/useDashboard';
import { useAuthStore } from '../../stores/authStore';
import { fmtETBCompact } from '../../utils/format';
import PageSkeleton from '../../components/ui/PageSkeleton';

const TREND_FALLBACK = [
  { month: 'January',   total: 35000 },
  { month: 'February',  total: 28000 },
  { month: 'March',     total: 42000 },
  { month: 'April',     total: 31000 },
  { month: 'May',       total: 25000 },
  { month: 'June',      total: 56000 },
  { month: 'July',      total: 38000 },
  { month: 'August',    total: 33000 },
  { month: 'September', total: 29000 },
  { month: 'October',   total: 36000 },
  { month: 'November',  total: 27000 },
  { month: 'December',  total: 40000 },
];

const TODAY = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: trend } = useSalesTrend();
  const { user } = useAuthStore();

  const displayName = useMemo(() => {
    if (!user) return 'there';
    // strip email domain if present (e.g. "admin@site.com" → "Admin")
    const name = user.includes('@') ? user.split('@')[0] : user;
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [user]);

  const totalRevenue = fmtETBCompact(stats?.monthly_sales ?? 0);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-0">

      {/* Welcome Row */}
      <div className="flex items-center justify-between px-6 pt-6">
        <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">
          Welcome back, {displayName}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--secondary)] rounded-full px-3 py-2">
            <span className="font-secondary text-sm text-[var(--foreground)]">Daily</span>
          </div>
          <div className="flex items-center gap-2 bg-[var(--secondary)] rounded-full px-3 py-2">
            <Calendar size={14} className="text-[var(--muted-foreground)]" />
            <span className="font-secondary text-sm text-[var(--foreground)]">{TODAY}</span>
          </div>
          <button className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Grid - 4 columns */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <StatCard
          title="Monthly Sales"
          value={fmtETBCompact(stats?.monthly_sales ?? 0)}
          change="This month's revenue"
          delay="0.04s"
          bars={[12, 20, 28, 16]}
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pending_purchase_orders ?? 0}
          subtitle="Purchase Orders"
          change="Awaiting receipt"
          delay="0.08s"
          bars={[12, 20, 28, 16]}
        />
        <StatCard
          title="Active Shipments"
          value={stats?.active_shipments ?? 0}
          subtitle="In transit"
          change="En route to warehouse"
          delay="0.12s"
          bars={[12, 20, 28, 16]}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats?.low_stock_items ?? 0}
          subtitle="Items"
          change="Below safety stock"
          delay="0.16s"
          bars={[12, 20, 28, 16]}
        />
      </div>

      {/* Charts Row */}
      <div className="flex gap-4 px-6">
        <div className="flex-1">
          <SalesTrendChart
            data={trend?.length ? trend : TREND_FALLBACK}
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
