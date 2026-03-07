import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MoreHorizontal, Info } from 'lucide-react';
import { fmtETBPlain } from '../../utils/format';

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
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 font-secondary shadow-md">
      <div className="text-xs text-[var(--muted-foreground)] mb-1">{label}</div>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
        <span className="font-semibold text-[var(--foreground)] font-mono">
          {fmtETBPlain(payload[0].value)}
        </span>
      </div>
    </div>
  );
}

export default function TopItemsChart({ data }: Props) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-primary text-xs font-medium text-[var(--muted-foreground)] tracking-widest uppercase">
            Top Selling Items
          </span>
          <Info size={14} className="text-[var(--muted-foreground)]" />
        </div>
        <MoreHorizontal size={18} className="text-[var(--muted-foreground)]" />
      </div>

      {/* Chart */}
      <div className="flex-1 px-5 pb-4">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontFamily: 'var(--font-primary)', fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
              />
              <YAxis
                type="category"
                dataKey="item_name"
                tick={{ fontFamily: 'var(--font-primary)', fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
              <Bar dataKey="total_amount" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={12} />
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
