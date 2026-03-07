import { MoreHorizontal, Info, Calendar, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  totalRevenue: string;
}

const BARS = [60, 80, 50, 100, 70, 120, 90, 110, 65, 85, 55, 95, 75, 45, 105, 68, 88, 72, 58, 42];

export default function RevenueBreakdown({ totalRevenue }: Props) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col h-[420px] w-[340px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-primary text-xs font-medium text-[var(--muted-foreground)] tracking-widest uppercase">
            Revenue Breakdown
          </span>
          <Info size={14} className="text-[var(--muted-foreground)]" />
        </div>
        <MoreHorizontal size={18} className="text-[var(--muted-foreground)]" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 px-5">
        <span className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)]">Revenue by Category</span>
        <div className="flex items-center justify-between">
          <span className="font-secondary text-[1.75rem] font-bold text-[var(--foreground)]">{totalRevenue}</span>
          <div className="flex items-center gap-1.5 border border-[var(--border)] rounded-full px-2.5 py-1.5">
            <Calendar size={12} className="text-[var(--muted-foreground)]" />
            <span className="font-secondary text-[0.65rem] text-[var(--foreground)]">Jan 1 - Aug 30</span>
          </div>
        </div>
      </div>

      {/* AI Insight Button */}
      <div className="mx-5 mt-4 flex items-center gap-2 bg-[var(--secondary)] border border-[var(--border)] rounded-full px-4 py-2.5">
        <Sparkles size={16} className="text-[var(--primary)] shrink-0" />
        <span className="font-secondary text-[0.8125rem] text-[var(--foreground)] flex-1">Get AI insight for better analysis</span>
        <ArrowRight size={14} className="text-[var(--muted-foreground)] shrink-0" />
      </div>

      {/* Bar Chart */}
      <div className="flex-1 flex items-end gap-1 px-5 pb-0 mt-4">
        {BARS.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-[var(--primary)] rounded-t-sm"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* X-axis Labels */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="font-primary text-[0.5625rem] text-[var(--muted-foreground)]">1 JAN</span>
        <span className="font-primary text-[0.5625rem] text-[var(--muted-foreground)]">30 JAN 2025</span>
      </div>
    </div>
  );
}
