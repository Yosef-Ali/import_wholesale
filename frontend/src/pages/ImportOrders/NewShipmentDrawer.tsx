import { useState } from 'react';
import { Anchor, Loader2, ExternalLink } from 'lucide-react';
import { useCreateShipment } from '../../api/hooks/useOrders';
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-secondary text-[0.65rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-secondary text-xs font-semibold text-[var(--foreground)] mb-1.5">
      {children}
    </label>
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

  const inputClass = "w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md font-secondary text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--muted-foreground)]";

  return (
    <>
      <div className="fixed inset-0 bg-[#00000040] backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div 
        className="fixed top-2 right-2 bottom-2 w-[500px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Anchor size={20} />
            </div>
            <div>
              <h2 className="font-primary text-lg font-bold text-[var(--foreground)] leading-tight">New Import Shipment</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)]">Create a new container or air freight record</p>
            </div>
          </div>
          <button 
            onClick={handleCreate}
            disabled={createShipment.isPending}
            className="text-[13px] font-secondary font-medium px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createShipment.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Shipment'}
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="space-y-8">
            
            {/* General Settings */}
            <section>
              <SectionLabel>General Information</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FieldLabel>Shipment Title</FieldLabel>
                  <input type="text" className={inputClass} value={form.shipment_title} onChange={e => setForm({ ...form, shipment_title: e.target.value })} placeholder="e.g., 20FT Container - Electronics" />
                </div>
                <div>
                  <FieldLabel>Purchase Order <span className="text-red-500">*</span></FieldLabel>
                  <input type="text" className={inputClass} value={form.purchase_order} onChange={e => setForm({ ...form, purchase_order: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Supplier <span className="text-red-500">*</span></FieldLabel>
                  <input type="text" className={inputClass} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Shipping Method</FieldLabel>
                  <select className={inputClass} value={form.shipping_method} onChange={e => setForm({ ...form, shipping_method: e.target.value })}>
                    <option value="">Select Method...</option>
                    {SHIPPING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Container / Master BL Number</FieldLabel>
                  <input type="text" className={inputClass} value={form.container_number} onChange={e => setForm({ ...form, container_number: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Destination Warehouse</FieldLabel>
                  <input type="text" className={inputClass} value={form.destination_warehouse} onChange={e => setForm({ ...form, destination_warehouse: e.target.value })} placeholder="e.g., Kality Main" />
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section>
              <SectionLabel>Timeline Dates</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Order Date</FieldLabel>
                  <input type="date" className={inputClass} value={form.order_date as string} onChange={e => setForm({ ...form, order_date: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Ship Date</FieldLabel>
                  <input type="date" className={inputClass} value={form.ship_date as string} onChange={e => setForm({ ...form, ship_date: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>ETA (Port)</FieldLabel>
                  <input type="date" className={inputClass} value={form.eta as string} onChange={e => setForm({ ...form, eta: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Arrival Date</FieldLabel>
                  <input type="date" className={inputClass} value={form.arrival_date as string} onChange={e => setForm({ ...form, arrival_date: e.target.value })} />
                </div>
              </div>
            </section>

            {/* Costing */}
            <section>
              <SectionLabel>Landed Cost Breakup (ETB)</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>FOB Cost</FieldLabel>
                  <input type="number" className={inputClass} value={form.fob_cost} onChange={e => setForm({ ...form, fob_cost: parseFloat(e.target.value) || '' })} placeholder="0.00" />
                </div>
                <div>
                  <FieldLabel>Freight Cost</FieldLabel>
                  <input type="number" className={inputClass} value={form.freight_cost} onChange={e => setForm({ ...form, freight_cost: parseFloat(e.target.value) || '' })} placeholder="0.00" />
                </div>
                <div>
                  <FieldLabel>Customs Duty</FieldLabel>
                  <input type="number" className={inputClass} value={form.customs_duty} onChange={e => setForm({ ...form, customs_duty: parseFloat(e.target.value) || '' })} placeholder="0.00" />
                </div>
                <div>
                  <FieldLabel>Other Charges</FieldLabel>
                  <input type="number" className={inputClass} value={form.other_charges} onChange={e => setForm({ ...form, other_charges: parseFloat(e.target.value) || '' })} placeholder="0.00" />
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--background)]/50">
          <span className="font-secondary text-[13px] text-[var(--muted-foreground)]">
            Create a new import shipment record
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-[13px] font-secondary font-medium px-4 py-1.5 rounded-md bg-[#333333] text-white border border-transparent cursor-pointer hover:bg-[#404040] transition-colors"
            >
              Close
            </button>
            <a
              href="http://localhost:8081/app/import-shipment/new-import-shipment-1"
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-secondary font-semibold px-4 py-1.5 rounded-md bg-[#ff8a00] text-black cursor-pointer hover:bg-[#e67a00] transition-colors no-underline flex items-center gap-1.5"
            >
              <ExternalLink size={14} className="opacity-80" />
              Open in ERPNext
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
