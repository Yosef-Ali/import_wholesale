import { useCustomers } from '../../api/hooks/useCustomers';
import DataTable from '../../components/DataTable/DataTable';
import type { Customer } from '../../api/types';

const fmtETB = (v: number) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v);

export default function Customers() {
  const { data: customers, isLoading } = useCustomers();

  const columns = [
    { key: 'name'           as const, label: 'ID' },
    { key: 'customer_name'  as const, label: 'Customer Name' },
    { key: 'customer_group' as const, label: 'Group' },
    { key: 'territory'      as const, label: 'Territory' },
    {
      key: 'credit_limit' as const,
      label: 'Credit Limit (ETB)',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (v: any) =>
        typeof v === 'number' && v > 0 ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{fmtETB(v)}</span>
        ) : (
          <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>—</span>
        ),
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
        }}>Customers</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>
          Wholesale customers and contractors
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Loading…
        </div>
      ) : (
        <DataTable
          data={(customers || []) as (Customer & Record<string, unknown>)[]}
          columns={columns}
          onRowClick={(row) => window.open(`http://localhost:8081/app/customer/${row.name}`, '_blank')}
          emptyMessage="No customers yet. Add customers in ERPNext."
        />
      )}
    </div>
  );
}
