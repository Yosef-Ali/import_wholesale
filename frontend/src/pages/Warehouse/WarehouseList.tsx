import { useWarehouses, useWarehouseSummary } from '../../api/hooks/useWarehouse';
import { Warehouse as WarehouseIcon, Package, DollarSign } from 'lucide-react';

interface WarehouseSummary {
  warehouse: string;
  item_count: number;
  total_qty: number;
  total_value: number;
}

function fmtCompact(v: number) {
  if (v >= 1_000_000) return `ETB ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `ETB ${(v / 1_000).toFixed(0)}K`;
  return `ETB ${new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(v)}`;
}

export default function WarehouseList() {
  const { data: warehouses, isLoading: whLoading } = useWarehouses();
  const { data: summary } = useWarehouseSummary() as { data: WarehouseSummary[] | undefined };

  const getSummary = (name: string) => summary?.find((s) => s.warehouse === name);

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
        }}>Warehouse</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>
          Stock locations and inventory overview
        </p>
      </div>

      {whLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Loading warehouses…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
          {(warehouses || []).map((wh) => {
            const s = getSummary(wh.name);
            return (
              <div
                key={wh.name}
                style={{
                  background: 'var(--card)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  padding: '1.375rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.18s, transform 0.18s',
                  boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
                }}
                onClick={() => window.open(`http://localhost:8081/app/warehouse/${encodeURIComponent(wh.name)}`, '_blank')}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgb(0 0 0 / 0.08)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgb(0 0 0 / 0.04)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Warehouse name row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.125rem' }}>
                  <div style={{
                    width: '2.25rem', height: '2.25rem',
                    borderRadius: '0.5rem',
                    background: 'rgb(232 82 26 / 0.08)',
                    border: '1px solid rgb(232 82 26 / 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <WarehouseIcon size={16} color="var(--accent)" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: 'var(--ink)',
                      lineHeight: 1.3,
                    }}>{wh.warehouse_name}</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem',
                      color: 'var(--muted)',
                      marginTop: '0.1rem',
                    }}>{wh.name}</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={13} color="var(--muted)" strokeWidth={1.75} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Items</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: '1rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{s?.item_count ?? 0}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={13} color="var(--muted)" strokeWidth={1.75} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Value</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: '0.85rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                        {s?.total_value ? fmtCompact(s.total_value) : 'ETB 0'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!warehouses?.length && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--muted)',
              background: 'var(--card)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
            }}>
              No warehouses yet. Set up warehouses in ERPNext.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
