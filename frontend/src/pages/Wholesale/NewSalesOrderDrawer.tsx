import { useState } from 'react';
import { ShoppingCart, Loader2, Plus, X } from 'lucide-react';
import { useCreateSalesOrder } from '../../api/hooks/useOrders';
import { toast } from '../../stores/toastStore';

interface Props {
  onClose: () => void;
}

export default function NewSalesOrderDrawer({ onClose }: Props) {
  const [form, setForm] = useState<Record<string, any>>({
    status: 'Draft',
    grand_total: 0
  });
  
  const createOrder = useCreateSalesOrder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer) {
      toast.error('Customer is required');
      return;
    }
    
    try {
      await createOrder.mutateAsync({
        ...form,
        transaction_date: form.transaction_date || new Date().toISOString().split('T')[0],
      });
      toast.success('Sales Order created successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create Sales Order');
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
              <h2 className="font-primary text-lg font-bold text-[var(--foreground)] leading-tight">New Sales Order</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)]">Create a new customer order</p>
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
          <form id="new-so-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-secondary text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] border-b border-[var(--border)] pb-2">Order Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Customer <span className="text-red-500">*</span></label>
                  <input required className={inputClass} placeholder="Select Customer" value={form.customer || ''} onChange={e => setForm({...form, customer: e.target.value, customer_name: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Transaction Date</label>
                  <input type="date" className={inputClass} value={form.transaction_date || ''} onChange={e => setForm({...form, transaction_date: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Delivery Date</label>
                  <input type="date" className={inputClass} value={form.delivery_date || ''} onChange={e => setForm({...form, delivery_date: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Grand Total (ETB)</label>
                  <input type="number" className={inputClass} value={form.grand_total || 0} onChange={e => setForm({...form, grand_total: parseFloat(e.target.value)})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Status</label>
                  <select className={inputClass} value={form.status || 'Draft'} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="Draft">Draft</option>
                    <option value="To Deliver and Bill">To Deliver and Bill</option>
                    <option value="To Deliver">To Deliver</option>
                    <option value="To Bill">To Bill</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
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
            form="new-so-form"
            disabled={createOrder.isPending}
            className="text-[13px] font-secondary font-semibold px-4 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
          >
            {createOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />} 
            Create Sales Order
          </button>
        </div>
      </div>
    </>
  );
}
