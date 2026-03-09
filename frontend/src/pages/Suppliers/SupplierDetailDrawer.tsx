import { useState, useEffect } from 'react';
import { useSupplier, useUpdateSupplier, useDeleteSupplier } from '../../api/hooks/useSuppliers';
import { Truck, X, Edit2, Trash2, Printer, Loader2, MapPin, Check, ExternalLink } from 'lucide-react';
import { toast } from '../../stores/toastStore';
import { erpnextUrl } from '../../utils/format';
import { drawerEditClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';
import { Stat } from '../../components/ui/Badge';

interface Props { editName: string; onClose: () => void }

export default function SupplierDetailDrawer({ editName, onClose }: Props) {
  const { data: supplier, isLoading } = useSupplier(editName);
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (supplier && !isEditing) setForm(supplier);
  }, [supplier, isEditing]);

  const handleSave = async () => {
    try {
      await updateSupplier.mutateAsync({ name: editName, data: form });
      toast.success('Supplier updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update supplier');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete supplier ${editName}?`)) return;
    try {
      await deleteSupplier.mutateAsync(editName);
      toast.success('Supplier deleted');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete supplier');
    }
  };

  const handlePrint = () => {
    window.open(erpnextUrl(`/printview?doctype=Supplier&name=${editName}&format=Standard`), '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-sm shrink-0">
              <Truck size={20} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-5 w-40 bg-[var(--secondary)] rounded animate-pulse mb-1" />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight truncate">{supplier?.supplier_name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider shrink-0 ${
                    supplier?.supplier_group === 'Raw Material' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                    supplier?.supplier_group === 'Hardware' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                    'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  }`}>{supplier?.supplier_group || 'Unknown'}</span>
                </div>
              )}
              <p className="font-secondary text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {supplier?.country || 'No country'} · {editName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors" title="Edit"><Edit2 size={15} /></button>
                <button onClick={handleDelete} className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                <button onClick={handlePrint} className="p-2 text-[var(--muted-foreground)] hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Print"><Printer size={15} /></button>
                <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors ml-1"><X size={16} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors"><X size={16} /></button>
                <button onClick={handleSave} disabled={updateSupplier.isPending} className="px-4 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                  {updateSupplier.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-16 bg-[var(--secondary)] rounded-xl animate-pulse ${i === 0 ? 'col-span-2' : ''}`} />
              ))}
            </div>
          ) : !supplier ? (
            <div className="flex items-center justify-center h-full text-sm font-secondary text-[var(--muted-foreground)]">Supplier not found</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="col-span-2">
                    <span className={labelClass}>Supplier Name</span>
                    <input className={inputClass} value={form.supplier_name || ''} onChange={e => setForm({ ...form, supplier_name: e.target.value })} />
                  </div>
                  <div>
                    <span className={labelClass}>Supplier Group</span>
                    <select className={inputClass} value={form.supplier_group || ''} onChange={e => setForm({ ...form, supplier_group: e.target.value })}>
                      <option value="">(Select)</option>
                      <option value="Raw Material">Raw Material</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Local">Local</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>
                  <div>
                    <span className={labelClass}>Country</span>
                    <input className={inputClass} value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} />
                  </div>
                  <div>
                    <span className={labelClass}>Supplier Type</span>
                    <select className={inputClass} value={form.supplier_type || ''} onChange={e => setForm({ ...form, supplier_type: e.target.value })}>
                      <option value="Company">Company</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2"><Stat label="Supplier Name" value={supplier.supplier_name} /></div>
                  <Stat label="Group" value={supplier.supplier_group} />
                  <Stat label="Country" value={supplier.country} />
                  <Stat label="Supplier Type" value={supplier.supplier_type} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/40">
          <span className="font-secondary text-xs text-[var(--muted-foreground)]">
            {supplier ? `Modified ${(supplier as any).modified?.split(' ')[0] ?? '—'}` : ''}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm font-secondary font-medium px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] cursor-pointer hover:bg-[var(--border)] transition-colors">
              Close
            </button>
            <a
              href={erpnextUrl(`/app/supplier/${editName}`)}
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
