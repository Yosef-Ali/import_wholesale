import { useState } from 'react';
import { Truck, Loader2, Plus, X } from 'lucide-react';
import { useCreateSupplier } from '../../api/hooks/useSuppliers';
import { toast } from '../../stores/toastStore';

interface Props {
  onClose: () => void;
}

export default function NewSupplierDrawer({ onClose }: Props) {
  const [form, setForm] = useState<Record<string, any>>({
    supplier_type: 'Company',
    supplier_group: ''
  });
  
  const createSupplier = useCreateSupplier();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_name || !form.supplier_group) {
      toast.error('Supplier Name and Group are required');
      return;
    }
    
    try {
      await createSupplier.mutateAsync(form);
      toast.success('Supplier created successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create supplier');
    }
  };

  const inputClass = "w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md font-secondary text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors";

  return (
    <>
      <div className="fixed inset-0 bg-[#00000040] backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed top-2 right-2 bottom-2 w-[550px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="font-primary text-lg font-bold text-[var(--foreground)] leading-tight">New Supplier</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)]">Register a new material provider</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <form id="new-supplier-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-secondary text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] border-b border-[var(--border)] pb-2">Supplier Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Supplier Name <span className="text-red-500">*</span></label>
                  <input required className={inputClass} placeholder="e.g. Shanghai Steel Co." value={form.supplier_name || ''} onChange={e => setForm({...form, supplier_name: e.target.value})} />
                </div>
                
                <div className="col-span-1">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Supplier Group <span className="text-red-500">*</span></label>
                  <select required className={inputClass} value={form.supplier_group || ''} onChange={e => setForm({...form, supplier_group: e.target.value})}>
                    <option value="">(Select Group)</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Local">Local</option>
                    <option value="Services">Services</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Country</label>
                  <input className={inputClass} placeholder="e.g. China" value={form.country || ''} onChange={e => setForm({...form, country: e.target.value})} />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Supplier Type</label>
                  <select className={inputClass} value={form.supplier_type || ''} onChange={e => setForm({...form, supplier_type: e.target.value})}>
                    <option value="Company">Company</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] flex items-center justify-end bg-[var(--background)]/50 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-secondary font-medium px-4 py-1.5 rounded-md bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-supplier-form"
            disabled={createSupplier.isPending}
            className="text-[13px] font-secondary font-semibold px-4 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
          >
            {createSupplier.isPending ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />} 
            Create Supplier
          </button>
        </div>
      </div>
    </>
  );
}
