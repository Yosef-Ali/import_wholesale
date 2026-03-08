import { useState, useEffect } from 'react';
import { useCustomer, useUpdateCustomer, useDeleteCustomer } from '../../api/hooks/useCustomers';
import { Users, X, Edit2, Trash2, Printer, Loader2, MapPin, Check, ExternalLink } from 'lucide-react';
import { toast } from '../../stores/toastStore';
import { fmtETB } from '../../utils/format';
import { drawerEditClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';
import { Stat } from '../../components/ui/Badge';

interface Props { editName: string; onClose: () => void }

export default function CustomerDetailDrawer({ editName, onClose }: Props) {
  const { data: customer, isLoading } = useCustomer(editName);
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (customer && !isEditing) setForm(customer);
  }, [customer, isEditing]);

  const handleSave = async () => {
    try {
      await updateCustomer.mutateAsync({ name: editName, data: form });
      toast.success('Customer updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update customer');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete customer ${editName}?`)) return;
    try {
      await deleteCustomer.mutateAsync(editName);
      toast.success('Customer deleted');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete customer');
    }
  };

  const handlePrint = () => {
    window.open(`${window.location.origin}/printview?doctype=Customer&name=${editName}&format=Standard`, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-sm shrink-0">
              <Users size={20} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-5 w-40 bg-[var(--secondary)] rounded animate-pulse mb-1" />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight truncate">{customer?.customer_name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider shrink-0 ${
                    customer?.disabled ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  }`}>{customer?.disabled ? 'Disabled' : 'Active'}</span>
                </div>
              )}
              <p className="font-secondary text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {customer?.territory || 'No territory'} · {editName}
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
                <button onClick={handleSave} disabled={updateCustomer.isPending} className="px-4 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                  {updateCustomer.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-16 bg-[var(--secondary)] rounded-xl animate-pulse ${i === 0 ? 'col-span-2' : ''}`} />
              ))}
            </div>
          ) : !customer ? (
            <div className="flex items-center justify-center h-full text-sm font-secondary text-[var(--muted-foreground)]">Customer not found</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="col-span-2">
                    <span className={labelClass}>Customer Name</span>
                    <input className={inputClass} value={form.customer_name || ''} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
                  </div>
                  <div>
                    <span className={labelClass}>Customer Group</span>
                    <select className={inputClass} value={form.customer_group || ''} onChange={e => setForm({ ...form, customer_group: e.target.value })}>
                      <option value="Commercial">Commercial</option>
                      <option value="Government">Government</option>
                      <option value="Individual">Individual</option>
                      <option value="Non Profit">Non Profit</option>
                    </select>
                  </div>
                  <div>
                    <span className={labelClass}>Territory</span>
                    <input className={inputClass} value={form.territory || ''} onChange={e => setForm({ ...form, territory: e.target.value })} />
                  </div>
                  <div>
                    <span className={labelClass}>Customer Type</span>
                    <select className={inputClass} value={form.customer_type || ''} onChange={e => setForm({ ...form, customer_type: e.target.value })}>
                      <option value="Company">Company</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>
                  <div>
                    <span className={labelClass}>Credit Limit (ETB)</span>
                    <input type="number" className={inputClass} value={form.credit_limit || 0} onChange={e => setForm({ ...form, credit_limit: parseFloat(e.target.value) })} />
                  </div>
                  <div className="col-span-2 pt-2 border-t border-[var(--border)]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.disabled ? 'bg-red-500 border-red-500' : 'border-[var(--border)] bg-[var(--background)] group-hover:border-red-400/50'}`}>
                        {form.disabled ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : null}
                      </div>
                      <input type="checkbox" className="sr-only" checked={!!form.disabled} onChange={e => setForm({ ...form, disabled: e.target.checked ? 1 : 0 })} />
                      <span className="font-secondary text-sm text-[var(--foreground)]">Customer is Disabled</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2"><Stat label="Customer Name" value={customer.customer_name} /></div>
                  <Stat label="Group" value={customer.customer_group} />
                  <Stat label="Territory" value={customer.territory} />
                  <Stat label="Customer Type" value={customer.customer_type} />
                  <Stat label="Credit Limit" mono value={fmtETB(customer.credit_limit || 0)} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/40">
          <span className="font-secondary text-xs text-[var(--muted-foreground)]">
            {customer ? `Modified ${(customer as any).modified?.split(' ')[0] ?? '—'}` : ''}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm font-secondary font-medium px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] cursor-pointer hover:bg-[var(--border)] transition-colors">
              Close
            </button>
            <a
              href={`${window.location.origin}/app/customer/${editName}`}
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
