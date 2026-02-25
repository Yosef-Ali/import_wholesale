import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;   // dot color + icon tint
  alert?: boolean;   // red alert state
  subtitle?: string;
  delay?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  accent = 'var(--accent)',
  alert,
  subtitle,
  delay = '0s',
}: Props) {
  const color = alert ? '#DC2626' : accent;

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: delay,
        background: 'var(--card)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border)',
        padding: '1.375rem 1.5rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'box-shadow 0.18s, transform 0.18s',
        cursor: 'default',
        boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgb(0 0 0 / 0.08)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgb(0 0 0 / 0.04)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Header row: label + icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {/* Colored indicator dot */}
          <div style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            marginTop: '1px',
          }} />
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}>
            {title}
          </span>
        </div>

        {/* Icon chip */}
        <div style={{
          width: '1.875rem',
          height: '1.875rem',
          borderRadius: '0.4rem',
          background: `${color}12`,
          border: `1px solid ${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={13} color={color} strokeWidth={2} />
        </div>
      </div>

      {/* Value + subtitle */}
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '2.2rem',
          fontWeight: 500,
          color: 'var(--ink)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: alert ? '#DC2626' : 'var(--muted)',
            marginTop: '0.4rem',
            letterSpacing: '0.01em',
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
