import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getList } from '../../api/client';
import { useImportShipment, useCreateShipment, useUpdateShipment } from '../../api/hooks/useOrders';
import { toast } from '../../stores/toastStore';

const STATUSES = [
  'Ordered', 'In Production', 'Shipped', 'In Transit', 'At Port',
  'Customs Clearance', 'Arrived – Pending Clearance', 'Cleared',
  'In Warehouse', 'Completed', 'Cancelled',
];
const SHIPPING_METHODS = [
  'Sea Freight (FCL)', 'Sea Freight (LCL)', 'Air Freight', 'Land Transport', 'Multimodal',
];

interface Props {
  editName?: string | null;
  defaultPO?: string;
  onClose: () => void;
}

type FormData = Record<string, string | number>;

const EMPTY: FormData = {
  shipment_title: '', purchase_order: '', supplier: '',
  status: 'Ordered', shipping_method: '', container_number: '',
  order_date: new Date().toISOString().slice(0, 10),
  ship_date: '', eta: '', arrival_date: '', clearance_date: '', warehouse_date: '',
  origin_country: '', origin_port: '', destination_port: 'Djibouti Port', destination_warehouse: '',
  fob_cost: '', freight_cost: '', insurance_cost: '',
  customs_duty: '', sur_tax: '', vat: '', other_charges: '',
  notes: '',
};

function computeLanded(f: FormData): number {
  return ['fob_cost','freight_cost','insurance_cost','customs_duty','sur_tax','vat','other_charges']
    .reduce((sum, k) => sum + (Number(f[k]) || 0), 0);
}

/* ── Shared input style ── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  border: '1.5px solid var(--border)',
  borderRadius: '0.45rem',
  background: 'var(--card)',
  color: 'var(--ink)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.62rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.09em',
      color: 'var(--muted)',
      marginBottom: '0.875rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block',
      fontFamily: 'var(--font-body)',
      fontSize: '0.68rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: 'var(--muted)',
      marginBottom: '0.3rem',
    }}>
      {children}
    </label>
  );
}

export default function ShipmentForm({ editName, defaultPO, onClose }: Props) {
  const isEdit = !!editName;
  const [form, setForm] = useState<FormData>({ ...EMPTY, purchase_order: defaultPO || '' });

  const { data: existing, isLoading: loadingDoc } = useImportShipment(editName ?? null);

  useEffect(() => {
    if (existing) {
      const mapped: FormData = {};
      const raw = existing as unknown as Record<string, unknown>;
      Object.keys(EMPTY).forEach((k) => { mapped[k] = (raw[k] ?? '') as string; });
      setForm(mapped);
    }
  }, [existing]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => getList<{ name: string; supplier_name: string }>({
      doctype: 'Supplier', fields: ['name', 'supplier_name'], limit_page_length: 100,
    }),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => getList<{ name: string; warehouse_name: string }>({
      doctype: 'Warehouse', fields: ['name', 'warehouse_name'],
      filters: [['is_group', '=', 0]],
      limit_page_length: 50,
    }),
  });

  const create = useCreateShipment();
  const update = useUpdateShipment();
  const saving = create.isPending || update.isPending;

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    Object.entries(form).forEach(([k, v]) => { if (v !== '') payload[k] = v; });
    try {
      if (isEdit) {
        await update.mutateAsync({ name: editName!, data: payload });
        toast.success('Shipment updated successfully');
      } else {
        await create.mutateAsync(payload);
        toast.success('Shipment created successfully');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save shipment');
    }
  }

  const landed = computeLanded(form);

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--accent)';
    e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgb(0 0 0 / 0.35)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '44rem',
        background: 'var(--bg)',
        boxShadow: '-8px 0 40px rgb(0 0 0 / 0.12)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.125rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontVariationSettings: '"opsz" 24, "wght" 600',
            fontSize: '1.2rem',
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            {isEdit ? 'Edit Shipment' : 'New Import Shipment'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.3rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.12s, background 0.12s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
              (e.currentTarget as HTMLElement).style.background = 'rgb(0 0 0 / 0.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        {loadingDoc ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)',
          }}>
            <Loader2 size={22} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Shipment Details */}
              <section>
                <SectionTitle>Shipment Details</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldLabel>Shipment Title *</FieldLabel>
                    <input style={inputStyle} required value={form.shipment_title as string}
                      onChange={(e) => set('shipment_title', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div>
                    <FieldLabel>Supplier *</FieldLabel>
                    <select style={inputStyle} required value={form.supplier as string}
                      onChange={(e) => set('supplier', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput}>
                      <option value="">Select supplier…</option>
                      {suppliers.map((s) => (
                        <option key={s.name} value={s.name}>{s.supplier_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Purchase Order</FieldLabel>
                    <input style={inputStyle} placeholder="PO-XXXX" value={form.purchase_order as string}
                      onChange={(e) => set('purchase_order', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div>
                    <FieldLabel>Status *</FieldLabel>
                    <select style={inputStyle} required value={form.status as string}
                      onChange={(e) => set('status', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Shipping Method</FieldLabel>
                    <select style={inputStyle} value={form.shipping_method as string}
                      onChange={(e) => set('shipping_method', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput}>
                      <option value="">Select…</option>
                      {SHIPPING_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldLabel>Container / AWB Number</FieldLabel>
                    <input style={inputStyle} value={form.container_number as string}
                      onChange={(e) => set('container_number', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput} />
                  </div>
                </div>
              </section>

              {/* Dates */}
              <section>
                <SectionTitle>Dates &amp; Tracking</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  {[
                    { key: 'order_date',     label: 'Order Date *',           required: true },
                    { key: 'ship_date',      label: 'Ship Date' },
                    { key: 'eta',            label: 'ETA' },
                    { key: 'arrival_date',   label: 'Actual Arrival' },
                    { key: 'clearance_date', label: 'Customs Clearance' },
                    { key: 'warehouse_date', label: 'Received in Warehouse' },
                  ].map(({ key, label, required }) => (
                    <div key={key}>
                      <FieldLabel>{label}</FieldLabel>
                      <input type="date" style={inputStyle} required={required}
                        value={form[key] as string}
                        onChange={(e) => set(key, e.target.value)}
                        onFocus={focusInput} onBlur={blurInput} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Origin & Destination */}
              <section>
                <SectionTitle>Origin &amp; Destination</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <FieldLabel>Origin Country</FieldLabel>
                    <input style={inputStyle} value={form.origin_country as string}
                      onChange={(e) => set('origin_country', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div>
                    <FieldLabel>Origin Port / City</FieldLabel>
                    <input style={inputStyle} value={form.origin_port as string}
                      onChange={(e) => set('origin_port', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div>
                    <FieldLabel>Destination Port</FieldLabel>
                    <input style={inputStyle} value={form.destination_port as string}
                      onChange={(e) => set('destination_port', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div>
                    <FieldLabel>Destination Warehouse</FieldLabel>
                    <select style={inputStyle} value={form.destination_warehouse as string}
                      onChange={(e) => set('destination_warehouse', e.target.value)}
                      onFocus={focusInput} onBlur={blurInput}>
                      <option value="">Select warehouse…</option>
                      {warehouses.map((w) => (
                        <option key={w.name} value={w.name}>{w.warehouse_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Costs */}
              <section>
                <SectionTitle>Cost Breakdown (ETB)</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  {[
                    { key: 'fob_cost',       label: 'FOB Cost' },
                    { key: 'freight_cost',   label: 'Freight Cost' },
                    { key: 'insurance_cost', label: 'Insurance' },
                    { key: 'customs_duty',   label: 'Customs Duty' },
                    { key: 'sur_tax',        label: 'Surtax' },
                    { key: 'vat',            label: 'VAT (15%)' },
                    { key: 'other_charges',  label: 'Other Charges' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <FieldLabel>{label}</FieldLabel>
                      <input type="number" min="0" step="0.01" style={inputStyle}
                        value={form[key] as string}
                        onChange={(e) => set(key, e.target.value)}
                        onFocus={focusInput} onBlur={blurInput} />
                    </div>
                  ))}

                  {/* Total */}
                  <div style={{
                    gridColumn: '1 / -1',
                    background: 'var(--sidebar)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.84rem', color: '#A1A1AA' }}>
                      Total Landed Cost
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.15rem',
                      fontWeight: 500,
                      color: '#FAFAFA',
                      letterSpacing: '-0.02em',
                    }}>
                      ETB {new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(landed)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section>
                <SectionTitle>Notes</SectionTitle>
                <textarea
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                  value={form.notes as string}
                  onChange={(e) => set('notes', e.target.value)}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </section>

              {/* Footer buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '0.55rem 1rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    fontSize: '0.84rem',
                    border: '1.5px solid var(--border)',
                    borderRadius: '0.45rem',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.55rem 1.25rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    background: saving ? 'var(--accent-dim)' : 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.45rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    transition: 'background 0.15s',
                    boxShadow: '0 2px 8px rgb(232 82 26 / 0.25)',
                  }}
                >
                  {saving && <Loader2 size={14} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />}
                  {isEdit ? 'Save Changes' : 'Create Shipment'}
                </button>
              </div>

            </div>
          </form>
        )}
      </div>
    </div>
  );
}
