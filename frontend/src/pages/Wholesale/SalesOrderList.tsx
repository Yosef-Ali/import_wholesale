import { useSalesOrders } from '../../api/hooks/useOrders';
import DataTable from '../../components/DataTable/DataTable';
import type { SalesOrder } from '../../api/types';

const statusStyle: Record<string, { bg: string; color: string }> = {
  'To Deliver and Bill': { bg: 'rgb(234 179 8 / 0.1)',  color: '#B45309' },
  'To Deliver':          { bg: 'rgb(59 130 246 / 0.1)',  color: '#1D4ED8' },
  'To Bill':             { bg: 'rgb(139 92 246 / 0.1)',  color: '#6D28D9' },
  Completed:             { bg: 'rgb(22 163 74 / 0.1)',   color: '#15803D' },
  Cancelled:             { bg: 'rgb(220 38 38 / 0.1)',   color: '#B91C1C' },
};

function Badge({ status }: { status: string }) {
  const s = statusStyle[status] || { bg: 'rgb(113 113 122 / 0.1)', color: '#52525B' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.55rem',
      borderRadius: '100px',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.65rem',
      fontWeight: 500,
      background: s.bg,
      color: s.color,
      letterSpacing: '0.02em',
    }}>
      {status}
    </span>
  );
}

const fmtETB = (v: number) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v);

export default function SalesOrderList() {
  const { data: orders, isLoading } = useSalesOrders();

  const columns = [
    { key: 'name'             as const, label: 'SO #' },
    { key: 'customer_name'    as const, label: 'Customer' },
    { key: 'transaction_date' as const, label: 'Date' },
    { key: 'delivery_date'    as const, label: 'Delivery' },
    {
      key: 'grand_total' as const,
      label: 'Total (ETB)',
      render: (v: SalesOrder[keyof SalesOrder]) =>
        typeof v === 'number' ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{fmtETB(v)}</span>
        ) : '-',
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (v: SalesOrder[keyof SalesOrder]) => <Badge status={String(v)} />,
    },
  ];

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
        }}>Wholesale Sales</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>
          Sales orders and customer orders
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Loading…
        </div>
      ) : (
        <DataTable
          data={(orders || []) as (SalesOrder & Record<string, unknown>)[]}
          columns={columns}
          onRowClick={(row) => window.open(`http://localhost:8081/app/sales-order/${row.name}`, '_blank')}
          emptyMessage="No sales orders yet. Create orders from ERPNext."
        />
      )}
    </div>
  );
}
