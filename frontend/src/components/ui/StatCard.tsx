import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: string;
  alert?: boolean;
  subtitle?: string;
  change?: string;
  delay?: string;
  bars?: number[];
}

const DEFAULT_BARS = [12, 20, 28, 16];

export default function StatCard({
  title,
  value,
  subtitle,
  change,
  delay = '0s',
  bars = DEFAULT_BARS,
}: Props) {
  return (
    <div
      className="anim-fade-up bg-[var(--card)] rounded-lg border border-[var(--border)] p-5 flex flex-col gap-3"
      style={{ animationDelay: delay }}
    >
      {/* Top: label + mini bars */}
      <div className="flex items-center justify-between">
        <span className="font-primary text-[0.6875rem] font-medium text-[var(--muted-foreground)] tracking-widest uppercase">
          {title}
        </span>
        <div className="flex items-end gap-[3px] h-8">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-sm bg-[var(--primary)]"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      {/* Subtitle label (optional) */}
      {subtitle && (
        <span className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)] -mt-1">
          {subtitle}
        </span>
      )}

      {/* Value */}
      <span className="font-secondary text-[1.75rem] font-bold text-[var(--foreground)] tracking-tight leading-none">
        {value}
      </span>

      {/* Bottom: dot + change */}
      <div className="flex items-center justify-between">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)]" />
        {change && (
          <span className="font-secondary text-xs text-[var(--primary)]">
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
