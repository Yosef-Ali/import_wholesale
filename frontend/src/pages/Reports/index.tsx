import { callMethod } from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#E8521A', '#2563EB', '#059669', '#7C3AED', '#DC2626', '#0891B2', '#D97706', '#DB2777', '#4F46E5', '#0D9488'];

interface TopItem     { item_code: string; item_name: string; total_qty: number; total_amount: number }
interface TopCustomer { customer: string; customer_name: string; invoice_count: number; total_revenue: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#09090B',
      border: '1px solid #27272A',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.875rem',
      fontFamily: 'var(--font-mono)',
    }}>
      {label && (
        <div style={{ fontSize: '0.6rem', color: '#52525B', marginBottom: '0.15rem' }}>{label}</div>
      )}
      <div style={{ fontSize: '0.84rem', color: '#FAFAFA' }}>
        {formatter ? formatter(payload[0].value) : payload[0].value}
      </div>
    </div>
  );
}

export default function Reports() {
  const { data: topItems } = useQuery<TopItem[]>({
    queryKey: ['top-items'],
    queryFn: () => callMethod('buildsupply.api.reports.get_top_items', { limit: 10, period: 'year' }),
  });

  const { data: topCustomers } = useQuery<TopCustomer[]>({
    queryKey: ['top-customers'],
    queryFn: () => callMethod('buildsupply.api.reports.get_top_customers', { limit: 10 }),
  });

  const fmtETB = (v: number) =>
    `ETB ${new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(v)}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPieLabel = ({ name, percent }: any) =>
    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`;

  const card = {
    background: 'var(--card)',
    borderRadius: '0.75rem',
    border: '1px solid var(--border)',
    padding: '1.5rem',
    boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
  };

  const sectionTitle = {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic' as const,
    fontVariationSettings: '"opsz" 20, "wght" 600',
    fontSize: '1.05rem',
    color: 'var(--ink)',
    letterSpacing: '-0.02em',
    margin: '0 0 1.25rem',
  };

  const empty = {
    height: '260px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--muted)',
  };

  return (
    <div style={{ maxWidth: '1160px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontVariationSettings: '"opsz" 36, "wght" 700',
          fontSize: '1.875rem',
          color: 'var(--ink)',
          letterSpacing: '-0.03em',
          margin: '0 0 0.2rem',
          lineHeight: 1.1,
        }}>Reports</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>
          Business analytics and insights
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        {/* Top Items */}
        <div style={card}>
          <h2 style={sectionTitle}>Top Selling Items</h2>
          {topItems && topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: '#A8A29E' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <YAxis
                  type="category"
                  dataKey="item_name"
                  tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: '#A8A29E' }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip content={<ChartTip formatter={(v: number) => fmtETB(v)} />} cursor={{ fill: 'rgb(232 82 26 / 0.04)' }} />
                <Bar dataKey="total_amount" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={empty}>No sales data yet</div>
          )}
        </div>

        {/* Top Customers */}
        <div style={card}>
          <h2 style={sectionTitle}>Top Customers by Revenue</h2>
          {topCustomers && topCustomers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topCustomers}
                  dataKey="total_revenue"
                  nameKey="customer_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={renderPieLabel}
                  labelLine={{ stroke: 'var(--border)' }}
                >
                  {topCustomers.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip formatter={(v: number) => fmtETB(v)} />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={empty}>No customer data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
