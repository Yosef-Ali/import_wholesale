import { useState } from 'react';
import { Anchor, Loader2, X, ExternalLink } from 'lucide-react';
import { useCreateShipment } from '../../api/hooks/useOrders';
import { toast } from '../../stores/toastStore';
import { drawerInputClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';

const STATUSES = [
  'Ordered', 'In Production', 'Shipped', 'In Transit', 'At Port',
  'Customs Clearance', 'Arrived – Pending Clearance', 'Cleared',
  'In Warehouse', 'Completed', 'Cancelled',
];

const SHIPPING_METHODS = [
  'Sea Freight (FCL)', 'Sea Freight (LCL)', 'Air Freight', 'Land Transport', 'Multimodal',
];

interface Props { onClose: () => void }

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

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="w-[3px] h-4 rounded-full bg-[var(--primary)] shrink-0" />
      <span className="font-primary text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{children}</span>
      <span className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

export default function NewShipmentDrawer({ onClose }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const createShipment = useCreateShipment();

  const handleCreate = async () => {
    try {
      if (!form.purchase_order && !form.supplier) {
        toast.error('Purchase Order or Supplier is required');
        return;
      }
      await createShipment.mutateAsync(form);
      toast.success('Shipment created successfully');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create shipment');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-sm">
              <Anchor size={20} />
            </div>
            <div>
              <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight">New Import Shipment</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">Create a container or air freight record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">

            <SectionDivider>General Information</SectionDivider>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Shipment Title</label>
                <input type="text" className={inputClass} value={form.shipment_title} onChange={e => setForm({ ...form, shipment_title: e.target.value })} placeholder="e.g. 20FT Container – Electronics" />
              </div>
              <div>
                <label className={labelClass}>Purchase Order <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input type="text" className={inputClass} value={form.purchase_order} onChange={e => setForm({ ...form, purchase_order: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Supplier <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input type="text" className={inputClass} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Shipping Method</label>
                <select className={inputClass} value={form.shipping_method} onChange={e => setForm({ ...form, shipping_method: e.target.value })}>
                  <option value="">Select Method…</option>
                  {SHIPPING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Container / BL Number</label>
                <input type="text" className={inputClass} value={form.container_number} onChange={e => setForm({ ...form, container_number: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Destination Warehouse</label>
                <input type="text" className={inputClass} value={form.destination_warehouse} onChange={e => setForm({ ...form, destination_warehouse: e.target.value })} placeholder="e.g. Kality Main" />
              </div>
            </div>

            <SectionDivider>Timeline Dates</SectionDivider>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Order Date</label>
                <input type="date" className={inputClass} value={form.order_date as string} onChange={e => setForm({ ...form, order_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Ship Date</label>
                <input type="date" className={inputClass} value={form.ship_date as string} onChange={e => setForm({ ...form, ship_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>ETA (Port)</label>
                <input type="date" className={inputClass} value={form.eta as string} onChange={e => setForm({ ...form, eta: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Arrival Date</label>
                <input type="date" className={inputClass} value={form.arrival_date as string} onChange={e => setForm({ ...form, arrival_date: e.target.value })} />
              </div>
            </div>

            <SectionDivider>Landed Cost Breakup (ETB)</SectionDivider>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>FOB Cost</label>
                <input type="number" className={inputClass} value={form.fob_cost} onChange={e => setForm({ ...form, fob_cost: parseFloat(e.target.value) || '' })} placeholder="0.00" />
              </div>
              <div>
                <label className={labelClass}>Freight Cost</label>
                <input type="number" className={inputClass} value={form.freight_cost} onChange={e => setForm({ ...form, freight_cost: parseFloat(e.target.value) || '' })} placeholder="0.00" />
              </div>
              <div>
                <label className={labelClass}>Customs Duty</label>
                <input type="number" className={inputClass} value={form.customs_duty} onChange={e => setForm({ ...form, customs_duty: parseFloat(e.target.value) || '' })} placeholder="0.00" />
              </div>
              <div>
                <label className={labelClass}>Other Charges</label>
                <input type="number" className={inputClass} value={form.other_charges} onChange={e => setForm({ ...form, other_charges: parseFloat(e.target.value) || '' })} placeholder="0.00" />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/40">
          <a
            href={`${window.location.origin}/app/import-shipment/new-import-shipment-1`}
            target="_blank" rel="noreferrer"
            className="text-sm font-secondary text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1.5 transition-colors no-underline"
          >
            <ExternalLink size={13} /> Open in ERPNext
          </a>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm font-secondary font-medium px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] cursor-pointer hover:bg-[var(--border)] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate} disabled={createShipment.isPending}
              className="text-sm font-secondary font-semibold px-5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              {createShipment.isPending ? <Loader2 size={14} className="animate-spin" /> : <Anchor size={14} />}
              Save Shipment
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
