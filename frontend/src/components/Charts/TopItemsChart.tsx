import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { MoreHorizontal, Info, TrendingUp } from 'lucide-react';
import { fmtETBPlain, fmtETBCompact } from '../../utils/format';

interface TopItem {
  item_code: string;
  item_name: string;
  total_qty: number;
  total_amount: number;
}

interface Props {
  data: TopItem[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 shadow-lg font-secondary min-w-[180px]">
      <p className="text-[0.6rem] font-primary font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2 truncate max-w-[160px]">
        {label}
      </p>
      <div className="flex justify-between items-center gap-4">
        <span className="text-xs text-[var(--muted-foreground)]">Revenue</span>
        <span className="text-xs font-semibold text-[var(--foreground)] font-mono">
          {fmtETBPlain(payload[0].value)}
        </span>
      </div>
    </div>
  );
}

export default function TopItemsChart({ data }: Props) {
  const totalRevenue = data.reduce((s, d) => s + (d.total_amount || 0), 0);

  const chartData = data.map((d, i) => ({
    ...d,
    displayName: d.item_name.length > 22 ? d.item_name.slice(0, 22) + '…' : d.item_name,
    rank: i + 1,
    pct: totalRevenue > 0 ? ((d.total_amount / totalRevenue) * 100).toFixed(0) : '0',
  }));

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] flex flex-col h-[420px]">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="font-primary text-[0.65rem] font-bold text-[var(--muted-foreground)] tracking-widest uppercase">
            Top Selling Items
          </span>
          <Info size={12} className="text-[var(--muted-foreground)]" />
        </div>
        <div className="flex items-center gap-3">
          {totalRevenue > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp size={11} className="text-[var(--primary)]" />
              <span className="font-secondary text-[0.7rem] text-[var(--primary)] font-medium">
                {fmtETBCompact(totalRevenue)}
              </span>
            </div>
          )}
          <MoreHorizontal size={16} className="text-[var(--muted-foreground)]" />
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-4 pb-4 pt-2">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="displayName"
                tick={{ fontFamily: 'var(--font-primary)', fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--border)', opacity: 0.4 }} />
              <Bar dataKey="total_amount" radius={[0, 4, 4, 0]} barSize={13}>
                <LabelList
                  dataKey="pct"
                  position="right"
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '9.5px',
                    fill: 'var(--muted-foreground)',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => `${v}%`}
                />
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill="var(--primary)"
                    fillOpacity={1 - (i / Math.max(data.length - 1, 1)) * 0.65}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-sm font-secondary text-[var(--muted-foreground)]">
            No sales data yet
          </div>
        )}
      </div>
    </div>
  );
}
