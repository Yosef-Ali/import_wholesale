import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MoreHorizontal, Info } from 'lucide-react';
import type { SalesTrend } from '../../api/types';

interface Props {
  data: SalesTrend[];
  totalRevenue: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 font-secondary shadow-md">
      <div className="text-xs text-[var(--muted-foreground)] mb-1">{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--muted-foreground)]">{p.name}:</span>
          <span className="font-semibold text-[var(--foreground)]">
            {p.value >= 1000 ? `${(p.value / 1000).toFixed(0)}k` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SalesTrendChart({ data, totalRevenue }: Props) {
  // Transform data to include "new" and "existing" split
  const chartData = data.map((d) => ({
    month: d.month.slice(0, 3).toUpperCase(),
    newUser: Math.round(d.total * 0.65),
    existingUser: Math.round(d.total * 0.35),
  }));

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-primary text-xs font-medium text-[var(--muted-foreground)] tracking-widest uppercase">
            Sales Trend
          </span>
          <Info size={14} className="text-[var(--muted-foreground)]" />
        </div>
        <MoreHorizontal size={18} className="text-[var(--muted-foreground)]" />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between px-5 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)]">Total Revenue :</span>
          <span className="font-secondary text-2xl font-bold text-[var(--foreground)]">{totalRevenue}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            <span className="font-primary text-[0.65rem] text-[var(--muted-foreground)] tracking-wide">NEW USER</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--muted-foreground)]" />
            <span className="font-primary text-[0.65rem] text-[var(--muted-foreground)] tracking-wide">EXISTING USER</span>
          </div>
        </div>

        <div className="flex items-center bg-[var(--secondary)] rounded-full p-[3px]">
          <span className="font-secondary text-xs text-[var(--muted-foreground)] px-3 py-1.5">Weekly</span>
          <span className="font-secondary text-xs font-medium text-[var(--foreground)] bg-[var(--card)] rounded-full px-3 py-1.5">Monthly</span>
          <span className="font-secondary text-xs text-[var(--muted-foreground)] px-3 py-1.5">Yearly</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-5 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 0, left: -16, bottom: 0 }} barGap={2} barCategoryGap="20%">
            <XAxis
              dataKey="month"
              tick={{ fontFamily: 'var(--font-primary)', fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: 'var(--font-primary)', fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
            />
            <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
            <Bar dataKey="newUser" name="New User" fill="var(--primary)" radius={[2, 2, 0, 0]} barSize={8} />
            <Bar dataKey="existingUser" name="Existing User" fill="var(--primary)" opacity={0.35} radius={[2, 2, 0, 0]} barSize={8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
