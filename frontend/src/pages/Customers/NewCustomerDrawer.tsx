import { useState } from 'react';
import { Users, Loader2, X } from 'lucide-react';
import { useCreateCustomer } from '../../api/hooks/useCustomers';
import { toast } from '../../stores/toastStore';
import { drawerInputClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';

interface Props { onClose: () => void }

export default function NewCustomerDrawer({ onClose }: Props) {
  const [form, setForm] = useState<Record<string, any>>({
    customer_type: 'Company',
    customer_group: 'Commercial',
    territory: 'Ethiopia',
    disabled: 0,
  });
  const createCustomer = useCreateCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_group) {
      toast.error('Customer Name and Group are required');
      return;
    }
    try {
      await createCustomer.mutateAsync(form);
      toast.success('Customer created successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create customer');
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
              <Users size={20} />
            </div>
            <div>
              <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight">New Customer</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">Register a new client or contractor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="new-customer-form" onSubmit={handleSubmit} className="space-y-5">

            <div className="flex items-center gap-3 mb-2">
              <span className="w-[3px] h-4 rounded-full bg-[var(--primary)] shrink-0" />
              <span className="font-primary text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Customer Details</span>
              <span className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Customer Name <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input required className={inputClass} placeholder="e.g. Sunshine Construction PLC" value={form.customer_name || ''} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Customer Group <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <select required className={inputClass} value={form.customer_group || ''} onChange={e => setForm({ ...form, customer_group: e.target.value })}>
                  <option value="Commercial">Commercial</option>
                  <option value="Government">Government</option>
                  <option value="Individual">Individual</option>
                  <option value="Non Profit">Non Profit</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Territory</label>
                <input className={inputClass} placeholder="e.g. Ethiopia" value={form.territory || ''} onChange={e => setForm({ ...form, territory: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Credit Limit (ETB)</label>
                <input type="number" className={inputClass} placeholder="e.g. 5000000" value={form.credit_limit || ''} onChange={e => setForm({ ...form, credit_limit: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Customer Type</label>
                <select className={inputClass} value={form.customer_type || ''} onChange={e => setForm({ ...form, customer_type: e.target.value })}>
                  <option value="Company">Company</option>
                  <option value="Individual">Individual</option>
                </select>
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
            type="submit" form="new-customer-form" disabled={createCustomer.isPending}
            className="text-sm font-secondary font-semibold px-5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm disabled:opacity-60"
          >
            {createCustomer.isPending ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            Create Customer
          </button>
        </div>

      </div>
    </>
  );
}
