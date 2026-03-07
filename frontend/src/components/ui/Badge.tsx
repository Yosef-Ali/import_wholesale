interface BadgeStyle { bg: string; color: string }

const STATUS_MAP: Record<string, BadgeStyle> = {
  // Purchase Order
  'To Receive and Bill': { bg: 'rgb(217 119 6 / 0.1)',  color: '#B45309' },
  'To Receive':          { bg: 'rgb(37 99 235 / 0.1)',   color: '#1D4ED8' },
  'To Bill':             { bg: 'rgb(124 58 237 / 0.1)',  color: '#6D28D9' },
  // Sales Order
  'To Deliver and Bill': { bg: 'rgb(217 119 6 / 0.1)',  color: '#B45309' },
  'To Deliver':          { bg: 'rgb(37 99 235 / 0.1)',   color: '#1D4ED8' },
  // Shipment
  'Ordered':             { bg: 'rgb(107 114 128 / 0.1)', color: '#4B5563' },
  'In Production':       { bg: 'rgb(107 114 128 / 0.1)', color: '#4B5563' },
  'Shipped':             { bg: 'rgb(37 99 235 / 0.1)',   color: '#1D4ED8' },
  'In Transit':          { bg: 'rgb(37 99 235 / 0.1)',   color: '#1D4ED8' },
  'At Port':             { bg: 'rgb(217 119 6 / 0.1)',   color: '#B45309' },
  'Customs Clearance':   { bg: 'rgb(234 88 12 / 0.1)',   color: '#C2410C' },
  'Arrived – Pending Clearance': { bg: 'rgb(217 119 6 / 0.1)', color: '#B45309' },
  'Cleared':             { bg: 'rgb(5 150 105 / 0.1)',   color: '#047857' },
  'In Warehouse':        { bg: 'rgb(5 150 105 / 0.1)',   color: '#047857' },
  // Common
  'Completed':           { bg: 'rgb(5 150 105 / 0.1)',   color: '#047857' },
  'Cancelled':           { bg: 'rgb(220 38 38 / 0.1)',   color: '#B91C1C' },
  'Draft':               { bg: 'rgb(107 114 128 / 0.1)', color: '#4B5563' },
  'Open':                { bg: 'rgb(37 99 235 / 0.1)',   color: '#1D4ED8' },
};

const DEFAULT: BadgeStyle = { bg: 'rgb(107 114 128 / 0.1)', color: '#4B5563' };

interface Props {
  status: string;
  /** Optional override map for custom statuses */
  map?: Record<string, BadgeStyle>;
}

export default function Badge({ status, map }: Props) {
  const s = (map && map[status]) || STATUS_MAP[status] || DEFAULT;
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '100px',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.72rem',
      fontWeight: 500,
      background: s.bg,
      color: s.color,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}
