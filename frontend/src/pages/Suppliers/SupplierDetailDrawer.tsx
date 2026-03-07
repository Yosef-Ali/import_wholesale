import { useState, useEffect } from 'react';
import { useSupplier, useUpdateSupplier, useDeleteSupplier } from '../../api/hooks/useSuppliers';
import { Truck, X, Edit2, Trash2, Printer, Loader2, MapPin, Check, ExternalLink } from 'lucide-react';
import { toast } from '../../stores/toastStore';

interface Props {
  editName: string;
  onClose: () => void;
}

function Stat({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
      <span className="font-secondary text-[0.65rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-[var(--foreground)] ${mono ? 'font-mono' : 'font-primary font-medium'}`}>{value || '—'}</span>
    </div>
  );
}

export default function SupplierDetailDrawer({ editName, onClose }: Props) {
  const { data: supplier, isLoading } = useSupplier(editName);
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (supplier && !isEditing) {
      setForm(supplier);
    }
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
    if (!confirm(`Are you sure you want to delete supplier ${editName}?`)) return;
    try {
      await deleteSupplier.mutateAsync(editName);
      toast.success('Supplier deleted');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete supplier');
    }
  };

  const handlePrint = () => {
    window.open(`http://localhost:8081/printview?doctype=Supplier&name=${editName}&format=Standard`, '_blank');
  };

  if (isLoading || !supplier) {
    return (
      <div className="fixed inset-0 bg-[#00000040] backdrop-blur-sm z-50 flex justify-end">
        <div className="w-[500px] h-full bg-[var(--card)] flex items-center justify-center">
          <Loader2 className="animate-spin text-[var(--muted-foreground)]" size={24} />
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded font-secondary text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors";
  
  return (
    <>
      <div className="fixed inset-0 bg-[#00000040] backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed top-2 right-2 bottom-2 w-[550px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-primary text-lg font-bold text-[var(--foreground)] leading-tight">{supplier.supplier_name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${
                  supplier.supplier_group === 'Raw Material' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                  supplier.supplier_group === 'Hardware' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                  'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                }`}>
                  {supplier.supplier_group || 'Unknown'}
                </span>
              </div>
              <p className="font-secondary text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {supplier.country || 'No Country Specified'} &middot; {editName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 text-[var(--muted-foreground)] hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors inline-block"
                  title="Print PDF"
                >
                  <Printer size={16} />
                </button>
              </>
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
                  disabled={updateSupplier.isPending}
                  className="px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-md hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
                >
                  {updateSupplier.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-4 border-b border-[var(--border)] shrink-0 bg-[var(--background)]/30">
          <button className={`px-4 py-3 text-xs font-secondary font-semibold uppercase tracking-wider border-b-2 transition-colors border-[var(--primary)] text-[var(--primary)]`}>Details</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="col-span-2">
                    <span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Supplier Name</span>
                    <input className={inputClass} value={form.supplier_name || ''} onChange={e => setForm({...form, supplier_name: e.target.value})} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Supplier Group</span>
                    <select className={inputClass} value={form.supplier_group || ''} onChange={e => setForm({...form, supplier_group: e.target.value})}>
                      <option value="">(Select)</option>
                      <option value="Raw Material">Raw Material</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Local">Local</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Country</span>
                    <input className={inputClass} value={form.country || ''} onChange={e => setForm({...form, country: e.target.value})} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Supplier Type</span>
                    <select className={inputClass} value={form.supplier_type || ''} onChange={e => setForm({...form, supplier_type: e.target.value})}>
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--background)]/50">
          <span className="font-secondary text-[13px] text-[var(--muted-foreground)]">
            {supplier ? `Modified ${(supplier as any).modified?.split(' ')[0] ?? '—'}` : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-[13px] font-secondary font-medium px-4 py-1.5 rounded-md bg-[#333333] text-white border border-transparent cursor-pointer hover:bg-[#404040] transition-colors"
            >
              Close
            </button>
            <a
              href={`http://localhost:8081/app/supplier/${editName}`}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-secondary font-semibold px-4 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer hover:opacity-90 transition-opacity no-underline flex items-center gap-1.5"
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
