import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MoreHorizontal, Info } from 'lucide-react';
import { fmtETBPlain } from '../../utils/format';

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

export default function TopCustomersChart({ data }: Props) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-primary text-xs font-medium text-[var(--muted-foreground)] tracking-widest uppercase">
            Top Customers by Revenue
          </span>
          <Info size={14} className="text-[var(--muted-foreground)]" />
        </div>
        <MoreHorizontal size={18} className="text-[var(--muted-foreground)]" />
      </div>

      {/* Chart */}
      <div className="flex-1 px-5 pb-4">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 0, left: -16, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="customer_name"
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
              <Bar dataKey="total_revenue" fill="var(--primary)" radius={[2, 2, 0, 0]} barSize={32} />
            </BarChart>
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
