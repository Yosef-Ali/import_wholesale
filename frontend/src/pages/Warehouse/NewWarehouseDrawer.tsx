import { useState } from 'react';
import { Warehouse, Loader2, X } from 'lucide-react';
import { useCreateWarehouse } from '../../api/hooks/useWarehouse';
import { toast } from '../../stores/toastStore';
import { drawerInputClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';

interface Props { onClose: () => void }

export default function NewWarehouseDrawer({ onClose }: Props) {
  const [form, setForm] = useState<Record<string, any>>({ is_group: 0, company: 'Import Wholesale PLC' });
  const createWarehouse = useCreateWarehouse();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.warehouse_name) {
      toast.error('Warehouse Name is required');
      return;
    }
    try {
      await createWarehouse.mutateAsync(form);
      toast.success('Warehouse created successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create warehouse');
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
              <Warehouse size={20} />
            </div>
            <div>
              <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight">New Warehouse</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">Register a new storage location</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="new-wh-form" onSubmit={handleSubmit} className="space-y-5">

            <div className="flex items-center gap-3 mb-2">
              <span className="w-[3px] h-4 rounded-full bg-[var(--primary)] shrink-0" />
              <span className="font-primary text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Location Details</span>
              <span className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Warehouse Name <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input required className={inputClass} placeholder="e.g. South Branch Depot" value={form.warehouse_name || ''} onChange={e => setForm({ ...form, warehouse_name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Company <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input required className={inputClass} value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Warehouse Type</label>
                <select className={inputClass} value={form.warehouse_type || ''} onChange={e => setForm({ ...form, warehouse_type: e.target.value })}>
                  <option value="">(Select Type)</option>
                  <option value="Store">Store</option>
                  <option value="Transit">Transit</option>
                  <option value="Target">Target</option>
                  <option value="WIP">WIP</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.is_group === 1 ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)] bg-[var(--background)] group-hover:border-[var(--primary)]/50'}`}>
                    {form.is_group === 1 && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <input type="checkbox" className="sr-only" checked={form.is_group === 1} onChange={e => setForm({ ...form, is_group: e.target.checked ? 1 : 0 })} />
                  <span className="font-secondary text-sm text-[var(--foreground)]">Is Group (Folder)</span>
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 shrink-0 bg-[var(--background)]/40">
          <button type="button" onClick={onClose} className="text-sm font-secondary font-medium px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] cursor-pointer hover:bg-[var(--border)] transition-colors">
            Cancel
          </button>
          <button
            type="submit" form="new-wh-form" disabled={createWarehouse.isPending}
            className="text-sm font-secondary font-semibold px-5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm disabled:opacity-60"
          >
            {createWarehouse.isPending ? <Loader2 size={14} className="animate-spin" /> : <Warehouse size={14} />}
            Create Warehouse
          </button>
        </div>

      </div>
    </>
  );
}
