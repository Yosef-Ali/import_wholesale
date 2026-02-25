import {
  DollarSign, Package, Ship, TrendingUp, AlertTriangle, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import StatCard from '../../components/ui/StatCard';
import { useDashboardStats, useSalesTrend } from '../../api/hooks/useDashboard';

function formatETB(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(val);
}

const STAGES = [
  { label: 'Ordered',   color: '#3F3F46' },
  { label: 'In Transit', color: 'var(--accent)' },
  { label: 'At Port',   color: '#3F3F46' },
  { label: 'Customs',   color: '#3F3F46' },
  { label: 'Warehouse', color: '#3F3F46' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#09090B',
      border: '1px solid #27272A',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.875rem',
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ fontSize: '0.6rem', color: '#52525B', marginBottom: '0.15rem', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#FAFAFA', letterSpacing: '-0.01em' }}>
        ETB {formatETB(payload[0].value)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: trend } = useSalesTrend();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>
          Loading…
        </span>
      </div>
    );
  }

  const hasAlert = (stats?.low_stock_items ?? 0) > 0 || (stats?.overdue_purchase_orders ?? 0) > 0;
  const activeShipments = stats?.active_shipments ?? 0;

  return (
    <div style={{ maxWidth: '1160px' }}>

      {/* ── Page header ── */}
      <div className="anim-fade-up" style={{ marginBottom: '2rem', animationDelay: '0s' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontVariationSettings: '"opsz" 36, "wght" 700',
            fontSize: '1.875rem',
            color: 'var(--ink)',
            letterSpacing: '-0.03em',
            margin: 0,
            lineHeight: 1.1,
          }}>
            Dashboard
          </h1>
          {hasAlert && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              background: 'rgb(220 38 38 / 0.08)',
              color: '#DC2626',
              padding: '0.2rem 0.5rem',
              borderRadius: '100px',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}>
              Action Required
            </span>
          )}
        </div>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--muted)',
          margin: 0,
          letterSpacing: '0.02em',
        }}>
          BuildSupply Pro — Operations Overview
        </p>
      </div>

      {/* ── KPI Grid (3 + 3) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}>
        <StatCard
          title="Stock Value"
          value={`ETB ${formatETB(stats?.stock_value ?? 0)}`}
          icon={DollarSign}
          accent="var(--accent)"
          delay="0.04s"
        />
        <StatCard
          title="Monthly Sales"
          value={`ETB ${formatETB(stats?.monthly_sales ?? 0)}`}
          icon={TrendingUp}
          accent="#2563EB"
          delay="0.08s"
        />
        <StatCard
          title="Active Shipments"
          value={stats?.active_shipments ?? 0}
          icon={Ship}
          accent="#059669"
          delay="0.12s"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pending_purchase_orders ?? 0}
          icon={Package}
          accent="#7C3AED"
          delay="0.16s"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.low_stock_items ?? 0}
          icon={AlertTriangle}
          alert={(stats?.low_stock_items ?? 0) > 0}
          subtitle={(stats?.low_stock_items ?? 0) > 0 ? 'Requires restocking' : 'All healthy'}
          delay="0.20s"
        />
        <StatCard
          title="Overdue Orders"
          value={stats?.overdue_purchase_orders ?? 0}
          icon={Clock}
          alert={(stats?.overdue_purchase_orders ?? 0) > 0}
          subtitle={(stats?.overdue_purchase_orders ?? 0) > 0 ? 'Past expected date' : 'On schedule'}
          delay="0.24s"
        />
      </div>

      {/* ── Chart + Pipeline ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '0.75rem', alignItems: 'start' }}>

        {/* Sales trend chart */}
        <div
          className="anim-fade-up"
          style={{
            animationDelay: '0.30s',
            background: 'var(--card)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontVariationSettings: '"opsz" 20, "wght" 600',
              fontSize: '1.05rem',
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>Sales Trend</h2>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--muted)',
              letterSpacing: '0.04em',
            }}>Last 6 months</span>
          </div>

          {trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#E8521A" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#E8521A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: '#A8A29E' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: '#A8A29E' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#E8521A"
                  strokeWidth={1.5}
                  fill="url(#areaFill)"
                  dot={{ fill: '#E8521A', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#E8521A', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#C4C0BB',
            }}>
              No sales data yet
            </div>
          )}
        </div>

        {/* Import Pipeline */}
        <div
          className="anim-fade-up"
          style={{
            animationDelay: '0.36s',
            background: 'var(--sidebar)',
            borderRadius: '0.75rem',
            border: '1px solid var(--sidebar-border)',
            padding: '1.25rem',
          }}
        >
          <h2 style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#D4D4D8',
            margin: '0 0 1.125rem 0',
            letterSpacing: '0.01em',
          }}>
            Import Pipeline
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {STAGES.map((stage, i) => {
              const isActive  = i === 1 && activeShipments > 0;
              const isDone    = i === 0 && activeShipments > 0;
              const dotColor  = isActive ? 'var(--accent)' : isDone ? '#2563EB' : '#3F3F46';
              const labelColor = isActive ? '#FAFAFA' : isDone ? '#60A5FA' : '#52525B';
              const isLast = i === STAGES.length - 1;

              return (
                <div key={stage.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    width: '12px', flexShrink: 0, paddingTop: '1px',
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: dotColor,
                      boxShadow: isActive ? '0 0 8px rgb(232 82 26 / 0.5)' : 'none',
                      flexShrink: 0,
                    }} />
                    {!isLast && (
                      <div style={{
                        width: '1px', height: '20px',
                        background: isDone || isActive ? '#1D4ED8' : '#1C1C1E',
                        marginTop: '2px',
                      }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: isLast ? 0 : '0.1rem', paddingTop: '0px' }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: labelColor,
                      fontWeight: isActive ? 500 : 400,
                      letterSpacing: '0.01em',
                    }}>
                      {stage.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: '1.25rem',
            paddingTop: '0.875rem',
            borderTop: '1px solid var(--sidebar-border)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: '#3F3F46',
            letterSpacing: '0.04em',
          }}>
            {activeShipments > 0
              ? `${activeShipments} active shipment${activeShipments !== 1 ? 's' : ''}`
              : 'No active shipments'}
          </div>
        </div>

      </div>
    </div>
  );
}
