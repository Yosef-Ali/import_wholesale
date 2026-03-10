import { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, ExternalLink, Loader2, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '../../api/hooks/useWarehouse';
import { toast } from '../../stores/toastStore';
import { erpnextUrl } from '../../utils/format';
import { drawerEditClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';
import { Stat } from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface Props { editName: string; onClose: () => void }

export default function WarehouseDetailDrawer({ editName, onClose }: Props) {
  const { data: item, isLoading } = useWarehouse(editName);
  const updateWrapper = useUpdateWarehouse();
  const deleteWrapper = useDeleteWarehouse();
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (item) setForm({ ...item } as Record<string, any>);
  }, [item]);

  const handleSave = async () => {
    try {
      await updateWrapper.mutateAsync({ name: editName, data: form });
      toast.success('Warehouse updated successfully');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update Warehouse');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWrapper.mutateAsync(editName);
      toast.success('Warehouse deleted');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete Warehouse');
    } finally {
      setShowConfirm(false);
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
              <WarehouseIcon size={20} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-5 w-40 bg-[var(--secondary)] rounded animate-pulse mb-1" />
              ) : (
                <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight truncate">{item?.warehouse_name || editName}</h2>
              )}
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">{item?.company || 'Warehouse Location'} · {editName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors" title="Edit"><Edit2 size={15} /></button>
                <button onClick={() => setShowConfirm(true)} className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors ml-1"><X size={16} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors"><X size={16} /></button>
                <button onClick={handleSave} disabled={updateWrapper.isPending} className="px-4 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                  {updateWrapper.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
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
                <div key={i} className={`h-16 bg-[var(--secondary)] rounded-xl animate-pulse ${i < 2 ? 'col-span-2' : ''}`} />
              ))}
            </div>
          ) : !item ? (
            <div className="flex items-center justify-center h-full text-sm font-secondary text-[var(--muted-foreground)]">Warehouse not found</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="col-span-2">
                    <span className={labelClass}>Warehouse Name</span>
                    <input className={inputClass} value={form.warehouse_name || ''} onChange={e => setForm({ ...form, warehouse_name: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <span className={labelClass}>Company</span>
                    <input className={inputClass} value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} />
                  </div>
                  <div>
                    <span className={labelClass}>Type</span>
                    <select className={inputClass} value={form.warehouse_type || ''} onChange={e => setForm({ ...form, warehouse_type: e.target.value })}>
                      <option value="">(Select Type)</option>
                      <option value="Store">Store</option>
                      <option value="Transit">Transit</option>
                      <option value="Target">Target</option>
                      <option value="WIP">WIP</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.is_group === 1 ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)] bg-[var(--background)] group-hover:border-[var(--primary)]/50'}`}>
                        {form.is_group === 1 && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <input type="checkbox" className="sr-only" checked={form.is_group === 1} onChange={e => setForm({ ...form, is_group: e.target.checked ? 1 : 0 })} />
                      <span className="font-secondary text-sm text-[var(--foreground)]">Is Group</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2"><Stat label="Warehouse Name" value={item.warehouse_name} /></div>
                  <div className="col-span-2"><Stat label="Company" value={item.company} /></div>
                  <Stat label="Type" value={item.warehouse_type} />
                  <Stat label="Is Group" value={item.is_group ? 'Yes' : 'No'} />
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
              href={erpnextUrl(`/app/warehouse/${editName}`)}
              target="_blank" rel="noreferrer"
              className="text-sm font-secondary font-semibold px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer hover:opacity-90 transition-opacity no-underline flex items-center gap-1.5"
            >
              <ExternalLink size={13} className="opacity-80" /> Open in ERPNext
            </a>
          </div>
        </div>

      </div>
      {showConfirm && (
        <ConfirmDialog
          title="Delete Warehouse"
          message={`Are you sure you want to delete ${item?.warehouse_name || editName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleteWrapper.isPending}
        />
      )}
    </>
  );
}
