import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: keyof T & string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data found',
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (!data.length) {
    return (
      <div style={{
        background: 'var(--card)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border)',
        padding: '3rem',
        textAlign: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
      }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--border-subtle)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '0.625rem 1rem',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp size={12} strokeWidth={2} />
                        : <ChevronDown size={12} strokeWidth={2} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) (e.currentTarget as HTMLElement).style.background = 'var(--border-subtle)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '0.75rem 1rem',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      color: 'var(--text)',
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
