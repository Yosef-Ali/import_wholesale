import { useState } from 'react';
import { ShoppingCart, Loader2, X } from 'lucide-react';
import { useCreateSalesOrder } from '../../api/hooks/useOrders';
import { toast } from '../../stores/toastStore';
import { drawerInputClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';

interface Props { onClose: () => void }

export default function NewSalesOrderDrawer({ onClose }: Props) {
  const [form, setForm] = useState<Record<string, any>>({ status: 'Draft', grand_total: 0 });
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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-sm">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight">New Sales Order</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">Create a new customer order</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="new-so-form" onSubmit={handleSubmit} className="space-y-5">

            <div className="flex items-center gap-3 mb-2">
              <span className="w-[3px] h-4 rounded-full bg-[var(--primary)] shrink-0" />
              <span className="font-primary text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Order Details</span>
              <span className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Customer <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input required className={inputClass} placeholder="Customer name" value={form.customer || ''} onChange={e => setForm({ ...form, customer: e.target.value, customer_name: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Transaction Date</label>
                <input type="date" className={inputClass} value={form.transaction_date || ''} onChange={e => setForm({ ...form, transaction_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Delivery Date</label>
                <input type="date" className={inputClass} value={form.delivery_date || ''} onChange={e => setForm({ ...form, delivery_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Grand Total (ETB)</label>
                <input type="number" className={inputClass} value={form.grand_total || ''} onChange={e => setForm({ ...form, grand_total: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status || 'Draft'} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Draft">Draft</option>
                  <option value="To Deliver and Bill">To Deliver and Bill</option>
                  <option value="To Deliver">To Deliver</option>
                  <option value="To Bill">To Bill</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
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
            type="submit" form="new-so-form" disabled={createOrder.isPending}
            className="text-sm font-secondary font-semibold px-5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm disabled:opacity-60"
          >
            {createOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
            Create Sales Order
          </button>
        </div>

      </div>
    </>
  );
}
