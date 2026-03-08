import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MoreHorizontal, Info, Users } from 'lucide-react';
import { fmtETBPlain, fmtETBCompact } from '../../utils/format';

interface TopCustomer {
  customer: string;
  customer_name: string;
  invoice_count: number;
  total_revenue: number;
}

interface Props {
  data: TopCustomer[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 shadow-lg font-secondary min-w-[180px]">
      <p className="text-[0.6rem] font-primary font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2 truncate max-w-[160px]">
        {label}
      </p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex justify-between items-center gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs text-[var(--muted-foreground)]">{p.name}</span>
          </div>
          <span className="text-xs font-semibold text-[var(--foreground)] font-mono">
            {p.name === 'Revenue' ? fmtETBPlain(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TopCustomersChart({ data }: Props) {
  const totalRevenue = data.reduce((s, c) => s + (c.total_revenue || 0), 0);

  const chartData = data.map(c => ({
    ...c,
    displayName: c.customer_name.split(' ').slice(0, 2).join(' '),
  }));

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] flex flex-col h-[420px]">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="font-primary text-[0.65rem] font-bold text-[var(--muted-foreground)] tracking-widest uppercase">
            Top Customers by Revenue
          </span>
          <Info size={12} className="text-[var(--muted-foreground)]" />
        </div>
        <div className="flex items-center gap-3">
          {totalRevenue > 0 && (
            <div className="flex items-center gap-1">
              <Users size={11} className="text-[var(--primary)]" />
              <span className="font-secondary text-[0.7rem] text-[var(--primary)] font-medium">
                {fmtETBCompact(totalRevenue)}
              </span>
            </div>
          )}
          <MoreHorizontal size={16} className="text-[var(--muted-foreground)]" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-5 pt-3 pb-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
          <span className="font-primary text-[0.6rem] text-[var(--muted-foreground)] tracking-wide uppercase">Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-[1.5px] bg-[var(--foreground)] opacity-40" />
          <span className="font-primary text-[0.6rem] text-[var(--muted-foreground)] tracking-wide uppercase">Invoices</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-4 pb-4 pt-1">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
              barCategoryGap="22%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="displayName"
                tick={{ fontFamily: 'var(--font-primary)', fontSize: 9, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={38}
              />
              <YAxis
                yAxisId="revenue"
                tick={{ fontFamily: 'var(--font-primary)', fontSize: 9, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
              />
              <YAxis
                yAxisId="invoices"
                orientation="right"
                tick={{ fontFamily: 'var(--font-primary)', fontSize: 9, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
              <Bar
                yAxisId="revenue"
                dataKey="total_revenue"
                name="Revenue"
                fill="var(--primary)"
                radius={[3, 3, 0, 0]}
                barSize={22}
                opacity={0.9}
              />
              <Line
                yAxisId="invoices"
                dataKey="invoice_count"
                name="Invoices"
                stroke="var(--foreground)"
                strokeWidth={1.5}
                strokeOpacity={0.4}
                dot={{ fill: 'var(--foreground)', r: 3, strokeWidth: 0, fillOpacity: 0.5 }}
                activeDot={{ r: 4, fill: 'var(--foreground)', fillOpacity: 0.7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-sm font-secondary text-[var(--muted-foreground)]">
            No customer data yet
          </div>
        )}
      </div>
    </div>
  );
}
