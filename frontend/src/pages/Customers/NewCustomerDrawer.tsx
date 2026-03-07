import { useState } from 'react';
import { Users, Loader2, Plus, X } from 'lucide-react';
import { useCreateCustomer } from '../../api/hooks/useCustomers';
import { toast } from '../../stores/toastStore';

interface Props {
  onClose: () => void;
}

export default function NewCustomerDrawer({ onClose }: Props) {
  const [form, setForm] = useState<Record<string, any>>({
    customer_type: 'Company',
    customer_group: 'Commercial',
    territory: 'Ethiopia',
    disabled: 0
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
              <h2 className="font-primary text-lg font-bold text-[var(--foreground)] leading-tight">New Customer</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)]">Register a new client or contractor</p>
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
          <form id="new-customer-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-secondary text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] border-b border-[var(--border)] pb-2">Customer Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Customer Name <span className="text-red-500">*</span></label>
                  <input required className={inputClass} placeholder="e.g. Sunshine Construction PLC" value={form.customer_name || ''} onChange={e => setForm({...form, customer_name: e.target.value})} />
                </div>
                
                <div className="col-span-1">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Customer Group <span className="text-red-500">*</span></label>
                  <select required className={inputClass} value={form.customer_group || ''} onChange={e => setForm({...form, customer_group: e.target.value})}>
                    <option value="Commercial">Commercial</option>
                    <option value="Government">Government</option>
                    <option value="Individual">Individual</option>
                    <option value="Non Profit">Non Profit</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Territory</label>
                  <input className={inputClass} placeholder="e.g. Ethiopia" value={form.territory || ''} onChange={e => setForm({...form, territory: e.target.value})} />
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Credit Limit (ETB)</label>
                  <input type="number" className={inputClass} placeholder="e.g. 5000000" value={form.credit_limit || 0} onChange={e => setForm({...form, credit_limit: parseFloat(e.target.value)})} />
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Customer Type</label>
                  <select className={inputClass} value={form.customer_type || ''} onChange={e => setForm({...form, customer_type: e.target.value})}>
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
            form="new-customer-form"
            disabled={createCustomer.isPending}
            className="text-[13px] font-secondary font-semibold px-4 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
          >
            {createCustomer.isPending ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />} 
            Create Customer
          </button>
        </div>
      </div>
    </>
  );
}
