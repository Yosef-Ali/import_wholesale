import { useSuppliers } from '../../api/hooks/useSuppliers';
import DataTable from '../../components/DataTable/DataTable';
import type { Supplier } from '../../api/types';

export default function Suppliers() {
  const { data: suppliers, isLoading } = useSuppliers();

  const columns = [
    { key: 'name'          as const, label: 'ID' },
    { key: 'supplier_name' as const, label: 'Supplier Name' },
    { key: 'supplier_group' as const, label: 'Group' },
    { key: 'country'       as const, label: 'Country' },
    { key: 'supplier_type' as const, label: 'Type' },
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
        }}>Suppliers</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>
          International material suppliers
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Loading…
        </div>
      ) : (
        <DataTable
          data={(suppliers || []) as (Supplier & Record<string, unknown>)[]}
          columns={columns}
          onRowClick={(row) => window.open(`http://localhost:8081/app/supplier/${row.name}`, '_blank')}
          emptyMessage="No suppliers yet. Add suppliers in ERPNext."
        />
      )}
    </div>
  );
}
