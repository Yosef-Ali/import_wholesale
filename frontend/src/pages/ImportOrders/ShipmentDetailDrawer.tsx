import { useState, useEffect } from 'react';
import { Anchor, ExternalLink, Loader2, Edit2, Check, X } from 'lucide-react';
import { useImportShipment, useUpdateShipment } from '../../api/hooks/useOrders';
import { toast } from '../../stores/toastStore';
import { fmtETB } from '../../utils/format';

interface Props {
  editName: string;
  onClose: () => void;
}

const STATUSES = [
  'Ordered', 'In Production', 'Shipped', 'In Transit', 'At Port',
  'Customs Clearance', 'Arrived – Pending Clearance', 'Cleared',
  'In Warehouse', 'Completed', 'Cancelled',
];

const SHIPPING_METHODS = [
  'Sea Freight (FCL)', 'Sea Freight (LCL)', 'Air Freight', 'Land Transport', 'Multimodal',
];

function Stat({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
      <span className="font-secondary text-[0.65rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-[var(--foreground)] ${mono ? 'font-mono' : 'font-primary font-medium'}`}>{value || '—'}</span>
    </div>
  );
}

export default function ShipmentDetailDrawer({ editName, onClose }: Props) {
  const { data: item, isLoading } = useImportShipment(editName);
  const updateShipment = useUpdateShipment();
  
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'cost'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (item && isEditing) {
      setForm({ ...item } as Record<string, any>);
    }
  }, [item, isEditing]);

  const handleSave = async () => {
    try {
      await updateShipment.mutateAsync({ name: editName, data: form });
      toast.success('Shipment updated successfully');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update shipment');
    }
  };

  const inputClass = "w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded font-secondary text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors";

  return (
    <>
      <div className="fixed inset-0 bg-[#00000040] backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed top-2 right-2 bottom-2 w-[550px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Anchor size={20} />
            </div>
            <div>
              <h2 className="font-primary text-lg font-bold text-[var(--foreground)] leading-tight">{editName}</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)]">{item?.shipment_title || 'Import Shipment'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-md transition-colors"
              >
                <Edit2 size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
                <button 
                  onClick={handleSave}
                  disabled={updateShipment.isPending}
                  className="px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-md hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  {updateShipment.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-4 border-b border-[var(--border)] shrink-0 bg-[var(--background)]/30">
          <button onClick={() => setActiveTab('details')} className={`px-4 py-3 text-xs font-secondary font-semibold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'details' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>Details</button>
          <button onClick={() => setActiveTab('timeline')} className={`px-4 py-3 text-xs font-secondary font-semibold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>Dates</button>
          <button onClick={() => setActiveTab('cost')} className={`px-4 py-3 text-xs font-secondary font-semibold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'cost' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>Costing</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]"><Loader2 size={24} className="animate-spin" /></div>
          ) : !item ? (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)] font-secondary text-sm">Shipment not found</div>
          ) : (
            <div className="space-y-6">
              
              {activeTab === 'details' && (
                <div className="grid grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div className="col-span-2"><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Title</span><input className={inputClass} value={form.shipment_title || ''} onChange={e => setForm({...form, shipment_title: e.target.value})} /></div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Purchase Order</span><input className={inputClass} value={form.purchase_order || ''} onChange={e => setForm({...form, purchase_order: e.target.value})} /></div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Supplier</span><input className={inputClass} value={form.supplier || ''} onChange={e => setForm({...form, supplier: e.target.value})} /></div>
                      <div>
                        <span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Status</span>
                        <select className={inputClass} value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Shipping Method</span>
                        <select className={inputClass} value={form.shipping_method || ''} onChange={e => setForm({...form, shipping_method: e.target.value})}>
                          {SHIPPING_METHODS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Container Number</span><input className={inputClass} value={form.container_number || ''} onChange={e => setForm({...form, container_number: e.target.value})} /></div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Dest. Warehouse</span><input className={inputClass} value={form.destination_warehouse || ''} onChange={e => setForm({...form, destination_warehouse: e.target.value})} /></div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2"><Stat label="Shipment Title" value={item.shipment_title} /></div>
                      <Stat label="Purchase Order" value={item.purchase_order} />
                      <Stat label="Supplier" value={item.supplier_name || item.supplier} />
                      <Stat label="Status" value={item.status} />
                      <Stat label="Shipping Method" value={item.shipping_method} />
                      <Stat label="Container Number" value={item.container_number} />
                      <Stat label="Dest. Warehouse" value={item.destination_warehouse} />
                    </>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                 <div className="grid grid-cols-2 gap-4">
                 {isEditing ? (
                   <>
                     <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Order Date</span><input type="date" className={inputClass} value={form.order_date || ''} onChange={e => setForm({...form, order_date: e.target.value})} /></div>
                     <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Ship Date</span><input type="date" className={inputClass} value={form.ship_date || ''} onChange={e => setForm({...form, ship_date: e.target.value})} /></div>
                     <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">ETA</span><input type="date" className={inputClass} value={form.eta || ''} onChange={e => setForm({...form, eta: e.target.value})} /></div>
                     <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Arrival Date</span><input type="date" className={inputClass} value={form.arrival_date || ''} onChange={e => setForm({...form, arrival_date: e.target.value})} /></div>
                     <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Clearance Date</span><input type="date" className={inputClass} value={form.clearance_date || ''} onChange={e => setForm({...form, clearance_date: e.target.value})} /></div>
                     <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Warehouse Date</span><input type="date" className={inputClass} value={form.warehouse_date || ''} onChange={e => setForm({...form, warehouse_date: e.target.value})} /></div>
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
                 )}
               </div>
              )}

              {activeTab === 'cost' && (
                <div className="grid grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">FOB Cost</span><input type="number" className={inputClass} value={form.fob_cost || 0} onChange={e => setForm({...form, fob_cost: parseFloat(e.target.value)})} /></div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Freight Cost</span><input type="number" className={inputClass} value={form.freight_cost || 0} onChange={e => setForm({...form, freight_cost: parseFloat(e.target.value)})} /></div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Insurance Cost</span><input type="number" className={inputClass} value={form.insurance_cost || 0} onChange={e => setForm({...form, insurance_cost: parseFloat(e.target.value)})} /></div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Customs Duty</span><input type="number" className={inputClass} value={form.customs_duty || 0} onChange={e => setForm({...form, customs_duty: parseFloat(e.target.value)})} /></div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Sur Tax</span><input type="number" className={inputClass} value={form.sur_tax || 0} onChange={e => setForm({...form, sur_tax: parseFloat(e.target.value)})} /></div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">VAT</span><input type="number" className={inputClass} value={form.vat || 0} onChange={e => setForm({...form, vat: parseFloat(e.target.value)})} /></div>
                      <div><span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Other Charges</span><input type="number" className={inputClass} value={form.other_charges || 0} onChange={e => setForm({...form, other_charges: parseFloat(e.target.value)})} /></div>
                    </>
                  ) : (
                    <>
                      <Stat label="Total Landed Cost" mono value={fmtETB(item.total_landed_cost || 0)} />
                      <div className="col-span-2 h-px bg-[var(--border)] my-2" />
                      <Stat label="FOB Cost" mono value={fmtETB(item.fob_cost || 0)} />
                      <Stat label="Freight Cost" mono value={fmtETB(item.freight_cost || 0)} />
                      <Stat label="Insurance Cost" mono value={fmtETB(item.insurance_cost || 0)} />
                      <Stat label="Customs Duty" mono value={fmtETB(item.customs_duty || 0)} />
                      <Stat label="Sur Tax" mono value={fmtETB(item.sur_tax || 0)} />
                      <Stat label="VAT" mono value={fmtETB(item.vat || 0)} />
                      <Stat label="Other Charges" mono value={fmtETB(item.other_charges || 0)} />
                    </>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--background)]/50">
          <span className="font-secondary text-[13px] text-[var(--muted-foreground)]">
            {item ? `Modified ${(item as any).modified?.split(' ')[0] ?? '—'}` : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-[13px] font-secondary font-medium px-4 py-1.5 rounded-md bg-[#333333] text-white border border-transparent cursor-pointer hover:bg-[#404040] transition-colors"
            >
              Close
            </button>
            <a
              href={`http://localhost:8081/app/import-shipment/${editName}`}
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
