import { useState, useEffect } from 'react';
import { Anchor, ExternalLink, Loader2, Edit2, Check, X } from 'lucide-react';
import { useImportShipment, useUpdateShipment } from '../../api/hooks/useOrders';
import { toast } from '../../stores/toastStore';
import { fmtETB } from '../../utils/format';
import { drawerEditClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';
import { Stat } from '../../components/ui/Badge';

interface Props { editName: string; onClose: () => void }

const STATUSES = [
  'Ordered', 'In Production', 'Shipped', 'In Transit', 'At Port',
  'Customs Clearance', 'Arrived – Pending Clearance', 'Cleared',
  'In Warehouse', 'Completed', 'Cancelled',
];

const SHIPPING_METHODS = [
  'Sea Freight (FCL)', 'Sea Freight (LCL)', 'Air Freight', 'Land Transport', 'Multimodal',
];

type Tab = 'details' | 'timeline' | 'cost';

export default function ShipmentDetailDrawer({ editName, onClose }: Props) {
  const { data: item, isLoading } = useImportShipment(editName);
  const updateShipment = useUpdateShipment();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (item) setForm({ ...item } as Record<string, any>);
  }, [item]);

  const handleSave = async () => {
    try {
      await updateShipment.mutateAsync({ name: editName, data: form });
      toast.success('Shipment updated successfully');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update shipment');
    }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'timeline', label: 'Dates' },
    { id: 'cost', label: 'Costing' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-sm shrink-0">
              <Anchor size={20} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-5 w-40 bg-[var(--secondary)] rounded animate-pulse mb-1" />
              ) : (
                <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight truncate">{editName}</h2>
              )}
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">
                {item?.shipment_title || 'Import Shipment'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors" title="Edit"><Edit2 size={15} /></button>
                <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors ml-1"><X size={16} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors"><X size={16} /></button>
                <button onClick={handleSave} disabled={updateShipment.isPending} className="px-4 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                  {updateShipment.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-6 border-b border-[var(--border)] shrink-0">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-3 text-xs font-secondary font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-16 bg-[var(--secondary)] rounded-xl animate-pulse ${i === 0 ? 'col-span-2' : ''}`} />
              ))}
            </div>
          ) : !item ? (
            <div className="flex items-center justify-center h-full text-sm font-secondary text-[var(--muted-foreground)]">Shipment not found</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">

              {activeTab === 'details' && (
                isEditing ? (
                  <>
                    <div className="col-span-2">
                      <span className={labelClass}>Shipment Title</span>
                      <input className={inputClass} value={form.shipment_title || ''} onChange={e => setForm({ ...form, shipment_title: e.target.value })} />
                    </div>
                    <div>
                      <span className={labelClass}>Purchase Order</span>
                      <input className={inputClass} value={form.purchase_order || ''} onChange={e => setForm({ ...form, purchase_order: e.target.value })} />
                    </div>
                    <div>
                      <span className={labelClass}>Supplier</span>
                      <input className={inputClass} value={form.supplier || ''} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                    </div>
                    <div>
                      <span className={labelClass}>Status</span>
                      <select className={inputClass} value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className={labelClass}>Shipping Method</span>
                      <select className={inputClass} value={form.shipping_method || ''} onChange={e => setForm({ ...form, shipping_method: e.target.value })}>
                        {SHIPPING_METHODS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className={labelClass}>Container / BL Number</span>
                      <input className={inputClass} value={form.container_number || ''} onChange={e => setForm({ ...form, container_number: e.target.value })} />
                    </div>
                    <div>
                      <span className={labelClass}>Destination Warehouse</span>
                      <input className={inputClass} value={form.destination_warehouse || ''} onChange={e => setForm({ ...form, destination_warehouse: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2"><Stat label="Shipment Title" value={item.shipment_title} /></div>
                    <Stat label="Purchase Order" value={item.purchase_order} />
                    <Stat label="Supplier" value={item.supplier_name || item.supplier} />
                    <Stat label="Status" value={item.status} />
                    <Stat label="Shipping Method" value={item.shipping_method} />
                    <Stat label="Container / BL Number" value={item.container_number} />
                    <Stat label="Destination Warehouse" value={item.destination_warehouse} />
                  </>
                )
              )}

              {activeTab === 'timeline' && (
                isEditing ? (
                  <>
                    <div>
                      <span className={labelClass}>Order Date</span>
                      <input type="date" className={inputClass} value={form.order_date || ''} onChange={e => setForm({ ...form, order_date: e.target.value })} />
                    </div>
                    <div>
                      <span className={labelClass}>Ship Date</span>
                      <input type="date" className={inputClass} value={form.ship_date || ''} onChange={e => setForm({ ...form, ship_date: e.target.value })} />
                    </div>
                    <div>
                      <span className={labelClass}>ETA (Port)</span>
                      <input type="date" className={inputClass} value={form.eta || ''} onChange={e => setForm({ ...form, eta: e.target.value })} />
                    </div>
                    <div>
                      <span className={labelClass}>Arrival Date</span>
                      <input type="date" className={inputClass} value={form.arrival_date || ''} onChange={e => setForm({ ...form, arrival_date: e.target.value })} />
                    </div>
                    <div>
                      <span className={labelClass}>Clearance Date</span>
                      <input type="date" className={inputClass} value={form.clearance_date || ''} onChange={e => setForm({ ...form, clearance_date: e.target.value })} />
                    </div>
                    <div>
                      <span className={labelClass}>Warehouse Date</span>
                      <input type="date" className={inputClass} value={form.warehouse_date || ''} onChange={e => setForm({ ...form, warehouse_date: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <>
                    <Stat label="Order Date" value={item.order_date} />
                    <Stat label="Ship Date" value={item.ship_date} />
                    <Stat label="ETA (Port)" value={item.eta} />
                    <Stat label="Arrival Date" value={item.arrival_date} />
                    <Stat label="Clearance Date" value={item.clearance_date} />
                    <Stat label="Warehouse Date" value={item.warehouse_date} />
                  </>
                )
              )}

              {activeTab === 'cost' && (
                isEditing ? (
                  <>
                    <div>
                      <span className={labelClass}>FOB Cost (ETB)</span>
                      <input type="number" className={inputClass} value={form.fob_cost || 0} onChange={e => setForm({ ...form, fob_cost: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <span className={labelClass}>Freight Cost (ETB)</span>
                      <input type="number" className={inputClass} value={form.freight_cost || 0} onChange={e => setForm({ ...form, freight_cost: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <span className={labelClass}>Insurance Cost (ETB)</span>
                      <input type="number" className={inputClass} value={form.insurance_cost || 0} onChange={e => setForm({ ...form, insurance_cost: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <span className={labelClass}>Customs Duty (ETB)</span>
                      <input type="number" className={inputClass} value={form.customs_duty || 0} onChange={e => setForm({ ...form, customs_duty: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <span className={labelClass}>Sur Tax (ETB)</span>
                      <input type="number" className={inputClass} value={form.sur_tax || 0} onChange={e => setForm({ ...form, sur_tax: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <span className={labelClass}>VAT (ETB)</span>
                      <input type="number" className={inputClass} value={form.vat || 0} onChange={e => setForm({ ...form, vat: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <span className={labelClass}>Other Charges (ETB)</span>
                      <input type="number" className={inputClass} value={form.other_charges || 0} onChange={e => setForm({ ...form, other_charges: parseFloat(e.target.value) })} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2"><Stat label="Total Landed Cost (ETB)" mono value={fmtETB(item.total_landed_cost || 0)} /></div>
                    <div className="col-span-2 h-px bg-[var(--border)]" />
                    <Stat label="FOB Cost" mono value={fmtETB(item.fob_cost || 0)} />
                    <Stat label="Freight Cost" mono value={fmtETB(item.freight_cost || 0)} />
                    <Stat label="Insurance Cost" mono value={fmtETB(item.insurance_cost || 0)} />
                    <Stat label="Customs Duty" mono value={fmtETB(item.customs_duty || 0)} />
                    <Stat label="Sur Tax" mono value={fmtETB(item.sur_tax || 0)} />
                    <Stat label="VAT" mono value={fmtETB(item.vat || 0)} />
                    <Stat label="Other Charges" mono value={fmtETB(item.other_charges || 0)} />
                  </>
                )
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/40">
          <span className="font-secondary text-xs text-[var(--muted-foreground)]">
            {item ? `Modified ${(item as any).modified?.split(' ')[0] ?? '—'}` : ''}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm font-secondary font-medium px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] cursor-pointer hover:bg-[var(--border)] transition-colors">
              Close
            </button>
            <a
              href={`${window.location.origin}/app/import-shipment/${editName}`}
              target="_blank" rel="noreferrer"
              className="text-sm font-secondary font-semibold px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer hover:opacity-90 transition-opacity no-underline flex items-center gap-1.5"
            >
              <ExternalLink size={13} className="opacity-80" /> Open in ERPNext
            </a>
          </div>
        </div>

      </div>
    </>
  );
}
