import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { usePurchaseOrders, useImportShipments } from '../../api/hooks/useOrders';
import DataTable from '../../components/DataTable/DataTable';
import ShipmentForm from './ShipmentForm';
import type { PurchaseOrder, ImportShipment } from '../../api/types';

const poStatusStyle: Record<string, { bg: string; color: string }> = {
  'To Receive and Bill': { bg: 'rgb(234 179 8 / 0.1)',  color: '#B45309' },
  'To Receive':          { bg: 'rgb(59 130 246 / 0.1)',  color: '#1D4ED8' },
  'To Bill':             { bg: 'rgb(139 92 246 / 0.1)',  color: '#6D28D9' },
  Completed:             { bg: 'rgb(22 163 74 / 0.1)',   color: '#15803D' },
  Cancelled:             { bg: 'rgb(220 38 38 / 0.1)',   color: '#B91C1C' },
};

const shipStatusStyle: Record<string, { bg: string; color: string }> = {
  Ordered:                  { bg: 'rgb(113 113 122 / 0.1)', color: '#52525B' },
  'In Transit':             { bg: 'rgb(59 130 246 / 0.1)',  color: '#1D4ED8' },
  'At Port':                { bg: 'rgb(234 179 8 / 0.1)',   color: '#B45309' },
  'Customs Clearance':      { bg: 'rgb(232 82 26 / 0.1)',   color: '#C2410C' },
  'In Warehouse':           { bg: 'rgb(22 163 74 / 0.1)',   color: '#15803D' },
  Completed:                { bg: 'rgb(16 185 129 / 0.1)',  color: '#065F46' },
};

function Badge({ status, map }: { status: string; map: Record<string, { bg: string; color: string }> }) {
  const s = map[status] || { bg: 'rgb(113 113 122 / 0.1)', color: '#52525B' };
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

type FormState =
  | { open: false }
  | { open: true; editName: string | null; defaultPO?: string };

export default function PurchaseOrderList() {
  const { data: orders,    isLoading: ordersLoading    } = usePurchaseOrders();
  const { data: shipments, isLoading: shipmentsLoading } = useImportShipments();
  const [form, setForm] = useState<FormState>({ open: false });

  const poColumns = [
    { key: 'name'             as const, label: 'PO #' },
    { key: 'supplier_name'    as const, label: 'Supplier' },
    { key: 'transaction_date' as const, label: 'Date' },
    {
      key: 'grand_total' as const,
      label: 'Total (ETB)',
      render: (v: PurchaseOrder[keyof PurchaseOrder]) =>
        typeof v === 'number' ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{fmtETB(v)}</span>
        ) : '-',
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (v: PurchaseOrder[keyof PurchaseOrder]) =>
        <Badge status={String(v)} map={poStatusStyle} />,
    },
  ];

  const shipmentColumns = [
    { key: 'name'              as const, label: 'Shipment #' },
    { key: 'shipment_title'    as const, label: 'Title' },
    { key: 'origin_country'    as const, label: 'Origin' },
    { key: 'eta'               as const, label: 'ETA' },
    {
      key: 'total_landed_cost' as const,
      label: 'Landed Cost',
      render: (v: ImportShipment[keyof ImportShipment]) =>
        typeof v === 'number' ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{fmtETB(v)}</span>
        ) : '-',
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (v: ImportShipment[keyof ImportShipment]) =>
        <Badge status={String(v)} map={shipStatusStyle} />,
    },
    {
      key: 'name' as const,
      label: '',
      render: (_v: ImportShipment[keyof ImportShipment], row: ImportShipment) => (
        <button
          onClick={(e) => { e.stopPropagation(); setForm({ open: true, editName: row.name }); }}
          style={{
            padding: '0.3rem',
            borderRadius: '0.35rem',
            border: 'none',
            background: 'transparent',
            color: 'var(--muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.12s, background 0.12s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.background = 'rgb(232 82 26 / 0.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <Pencil size={13} strokeWidth={1.75} />
        </button>
      ),
    },
  ];

  const sectionHead = {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic' as const,
    fontVariationSettings: '"opsz" 20, "wght" 600',
    fontSize: '1.05rem',
    color: 'var(--ink)',
    letterSpacing: '-0.02em',
    margin: 0,
  };

  return (
    <div style={{ maxWidth: '1160px' }}>
      {/* Page header */}
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
        }}>Import Orders</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>
          Purchase orders and shipment tracking
        </p>
      </div>

      {/* Purchase Orders */}
      <h2 style={{ ...sectionHead, marginBottom: '0.875rem' }}>Purchase Orders</h2>
      {ordersLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Loading…
        </div>
      ) : (
        <DataTable
          data={(orders || []) as (PurchaseOrder & Record<string, unknown>)[]}
          columns={poColumns}
          onRowClick={(row) => window.open(`http://localhost:8081/app/purchase-order/${row.name}`, '_blank')}
          emptyMessage="No purchase orders yet."
        />
      )}

      {/* Shipments */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2rem 0 0.875rem' }}>
        <h2 style={sectionHead}>Import Shipments</h2>
        <button
          onClick={() => setForm({ open: true, editName: null })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.45rem 0.875rem',
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.8rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'background 0.15s, transform 0.1s',
            boxShadow: '0 2px 8px rgb(232 82 26 / 0.25)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          }}
        >
          <Plus size={14} strokeWidth={2.5} />
          New Shipment
        </button>
      </div>

      {shipmentsLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Loading…
        </div>
      ) : (
        <DataTable
          data={(shipments || []) as (ImportShipment & Record<string, unknown>)[]}
          columns={shipmentColumns}
          onRowClick={(row) => setForm({ open: true, editName: row.name as string })}
          emptyMessage="No import shipments yet."
        />
      )}

      {form.open && (
        <ShipmentForm
          editName={form.editName}
          defaultPO={'defaultPO' in form ? form.defaultPO : undefined}
          onClose={() => setForm({ open: false })}
        />
      )}
    </div>
  );
}
