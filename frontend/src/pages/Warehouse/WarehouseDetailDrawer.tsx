import { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, ExternalLink, Loader2, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '../../api/hooks/useWarehouse';
import { toast } from '../../stores/toastStore';

interface Props {
  editName: string;
  onClose: () => void;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
      <span className="font-secondary text-[0.65rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{label}</span>
      <span className="text-sm text-[var(--foreground)] font-primary font-medium">{value || '—'}</span>
    </div>
  );
}

export default function WarehouseDetailDrawer({ editName, onClose }: Props) {
  const { data: item, isLoading } = useWarehouse(editName);
  const updateWrapper = useUpdateWarehouse();
  const deleteWrapper = useDeleteWarehouse();
  
  const [activeTab, setActiveTab] = useState<'details'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (item && isEditing) {
      setForm({ ...item } as Record<string, any>);
    }
  }, [item, isEditing]);

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
    if (!window.confirm(`Are you sure you want to delete warehouse ${editName}?`)) return;
    try {
      await deleteWrapper.mutateAsync(editName);
      toast.success('Warehouse deleted');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete Warehouse');
    }
  };

  const inputClass = "w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded font-secondary text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors";

  return (
    <>
      <div className="fixed inset-0 bg-[#00000040] backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed top-2 right-2 bottom-2 w-[500px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <WarehouseIcon size={20} />
            </div>
            <div>
              <h2 className="font-primary text-lg font-bold text-[var(--foreground)] leading-tight">{editName}</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)]">{item?.warehouse_name || 'Warehouse Location'}</p>
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
                  disabled={updateWrapper.isPending}
                  className="px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-md hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
                >
                  {updateWrapper.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-4 border-b border-[var(--border)] shrink-0 bg-[var(--background)]/30">
          <button onClick={() => setActiveTab('details')} className={`px-4 py-3 text-xs font-secondary font-semibold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'details' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>Details</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]"><Loader2 size={24} className="animate-spin" /></div>
          ) : !item ? (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)] font-secondary text-sm">Warehouse not found</div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'details' && (
                <div className="grid grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div className="col-span-2">
                        <span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Warehouse Name</span>
                        <input className={inputClass} value={form.warehouse_name || ''} onChange={e => setForm({...form, warehouse_name: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Company</span>
                        <input className={inputClass} value={form.company || ''} onChange={e => setForm({...form, company: e.target.value})} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[var(--muted-foreground)] block mb-1">Type</span>
                        <select className={inputClass} value={form.warehouse_type || ''} onChange={e => setForm({...form, warehouse_type: e.target.value})}>
                          <option value="">(Select Type)</option>
                          <option value="Store">Store</option>
                          <option value="Transit">Transit</option>
                          <option value="Target">Target</option>
                          <option value="WIP">WIP</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-1">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                            checked={form.is_group === 1}
                            onChange={e => setForm({...form, is_group: e.target.checked ? 1 : 0})} 
                          />
                          <span className="text-sm font-medium text-[var(--foreground)]">Is Group</span>
                        </div>
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
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--background)]/50">
          <span className="font-secondary text-[13px] text-[var(--muted-foreground)]">
            {item ? `Modified ${(item as any).modified?.split(' ')[0] ?? '—'}` : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-[13px] font-secondary font-medium px-4 py-1.5 rounded-md bg-[#333333] text-white border border-transparent cursor-pointer hover:bg-[#404040] transition-colors"
            >
              Close
            </button>
            <a
              href={`http://localhost:8081/app/warehouse/${editName}`}
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
