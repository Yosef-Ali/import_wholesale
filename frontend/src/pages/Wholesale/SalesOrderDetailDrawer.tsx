import { useState, useEffect } from 'react';
import { ShoppingCart, ExternalLink, Loader2, Edit2, Check, X, Printer, Trash2 } from 'lucide-react';
import { useSalesOrder, useUpdateSalesOrder, useDeleteSalesOrder } from '../../api/hooks/useOrders';
import { toast } from '../../stores/toastStore';
import { fmtETB, erpnextUrl } from '../../utils/format';
import { drawerEditClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';
import { Stat } from '../../components/ui/Badge';

interface Props { editName: string; onClose: () => void }

const STATUSES = ['Draft', 'To Deliver and Bill', 'To Deliver', 'To Bill', 'Completed', 'Closed'];

export default function SalesOrderDetailDrawer({ editName, onClose }: Props) {
  const { data: item, isLoading } = useSalesOrder(editName);
  const updateOrder = useUpdateSalesOrder();
  const deleteOrder = useDeleteSalesOrder();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (item) setForm({ ...item } as Record<string, any>);
  }, [item]);

  const handleSave = async () => {
    try {
      await updateOrder.mutateAsync({ name: editName, data: form });
      toast.success('Sales Order updated successfully');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update Sales Order');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete Sales Order ${editName}?`)) return;
    try {
      await deleteOrder.mutateAsync(editName);
      toast.success('Sales Order deleted');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete Sales Order');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-sm shrink-0">
              <ShoppingCart size={20} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-5 w-40 bg-[var(--secondary)] rounded animate-pulse mb-1" />
              ) : (
                <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight truncate">{editName}</h2>
              )}
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">
                {item?.customer_name || item?.customer || 'Sales Order'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors" title="Edit"><Edit2 size={15} /></button>
                <button onClick={handleDelete} className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                <a
                  href={erpnextUrl(`/api/method/frappe.utils.print_format.download_pdf?doctype=Sales%20Order&name=${editName}`)}
                  target="_blank" rel="noreferrer"
                  className="p-2 text-[var(--muted-foreground)] hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors inline-flex items-center" title="Print"
                ><Printer size={15} /></a>
                <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors ml-1"><X size={16} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors"><X size={16} /></button>
                <button onClick={handleSave} disabled={updateOrder.isPending} className="px-4 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                  {updateOrder.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                </button>
              </>
            )}
          </div>
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
            <div className="flex items-center justify-center h-full text-sm font-secondary text-[var(--muted-foreground)]">Order not found</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="col-span-2">
                    <span className={labelClass}>Customer</span>
                    <input className={inputClass} value={form.customer_name || form.customer || ''} onChange={e => setForm({ ...form, customer: e.target.value, customer_name: e.target.value })} />
                  </div>
                  <div>
                    <span className={labelClass}>Status</span>
                    <select className={inputClass} value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className={labelClass}>Grand Total</span>
                    <input type="number" className={inputClass} value={form.grand_total || 0} onChange={e => setForm({ ...form, grand_total: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <span className={labelClass}>Transaction Date</span>
                    <input type="date" className={inputClass} value={form.transaction_date || ''} onChange={e => setForm({ ...form, transaction_date: e.target.value })} />
                  </div>
                  <div>
                    <span className={labelClass}>Delivery Date</span>
                    <input type="date" className={inputClass} value={form.delivery_date || ''} onChange={e => setForm({ ...form, delivery_date: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2"><Stat label="Customer" value={item.customer_name || item.customer} /></div>
                  <Stat label="Status" value={item.status} />
                  <Stat label="Grand Total (ETB)" mono value={fmtETB(item.grand_total || 0)} />
                  <Stat label="Transaction Date" value={item.transaction_date} />
                  <Stat label="Delivery Date" value={item.delivery_date} />
                  <Stat label="Delivered (%)" value={`${item.per_delivered || 0}%`} />
                </>
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
              href={erpnextUrl(`/app/sales-order/${editName}`)}
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
