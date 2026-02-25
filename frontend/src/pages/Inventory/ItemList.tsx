import { useState } from 'react';
import { useItems, useItemGroups } from '../../api/hooks/useItems';
import DataTable from '../../components/DataTable/DataTable';
import type { Item } from '../../api/types';

const fmtETB = (v: number) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(v);

export default function ItemList() {
  const [group, setGroup] = useState('');
  const { data: items, isLoading } = useItems(group || undefined);
  const { data: groups } = useItemGroups();

  const columns = [
    { key: 'item_code' as const, label: 'Code' },
    { key: 'item_name' as const, label: 'Item Name' },
    { key: 'item_group' as const, label: 'Group' },
    { key: 'stock_uom' as const, label: 'UOM' },
    {
      key: 'standard_rate' as const,
      label: 'Rate (ETB)',
      render: (v: Item[keyof Item]) =>
        typeof v === 'number' ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{fmtETB(v)}</span>
        ) : '-',
    },
  ];

  return (
    <div style={{ maxWidth: '1160px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontVariationSettings: '"opsz" 36, "wght" 700',
            fontSize: '1.875rem',
            color: 'var(--ink)',
            letterSpacing: '-0.03em',
            margin: '0 0 0.2rem',
            lineHeight: 1.1,
          }}>Inventory</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>
            Construction materials catalog
          </p>
        </div>

        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.84rem',
            border: '1.5px solid var(--border)',
            borderRadius: '0.5rem',
            background: 'var(--card)',
            color: 'var(--ink)',
            outline: 'none',
            cursor: 'pointer',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
        >
          <option value="">All Groups</option>
          {groups?.map((g) => (
            <option key={g.name} value={g.name}>{g.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Loading items…
        </div>
      ) : (
        <DataTable
          data={(items || []) as (Item & Record<string, unknown>)[]}
          columns={columns}
          onRowClick={(row) => window.open(`http://localhost:8081/app/item/${row.name}`, '_blank')}
          emptyMessage="No items found. Add construction materials in ERPNext."
        />
      )}
    </div>
  );
}
