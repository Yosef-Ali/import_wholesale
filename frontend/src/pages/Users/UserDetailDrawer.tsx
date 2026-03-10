import { useState, useEffect } from 'react';
import { UserCog, ExternalLink, Loader2, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useUser, useUpdateUser, useDeleteUser, APP_ROLES } from '../../api/hooks/useUsers';
import { toast } from '../../stores/toastStore';
import { erpnextUrl } from '../../utils/format';
import { drawerEditClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';
import { Stat } from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface Props { editName: string; onClose: () => void }

const ROLE_COLORS: Record<string, string> = {
  'BuildSupply Admin': 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
  'Import Manager':    'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  'Warehouse Manager': 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
  'Sales Manager':     'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  'Sales Rep':         'bg-teal-500/10 text-teal-600 border border-teal-500/20',
  'Accountant':        'bg-rose-500/10 text-rose-600 border border-rose-500/20',
};

export default function UserDetailDrawer({ editName, onClose }: Props) {
  const { data: item, isLoading } = useUser(editName);
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setForm({ ...item });
      const existing = (item.roles || []).map((r: any) => r.role);
      setSelectedRoles(existing);
    }
  }, [item]);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({
        name: editName,
        data: { ...form, roles: selectedRoles.map(role => ({ role })) },
      });
      toast.success('User updated successfully');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync(editName);
      toast.success('User deleted');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete user');
    } finally {
      setShowConfirm(false);
    }
  };

  const userRoles = (item?.roles || []).map((r: any) => r.role);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-sm shrink-0">
              <UserCog size={20} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-5 w-40 bg-[var(--secondary)] rounded animate-pulse mb-1" />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight truncate">{item?.full_name || editName}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider shrink-0 ${
                    item?.enabled ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                  }`}>{item?.enabled ? 'Active' : 'Disabled'}</span>
                </div>
              )}
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">{editName}</p>
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
                <button onClick={handleSave} disabled={updateUser.isPending} className="px-4 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                  {updateUser.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
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
            <div className="flex items-center justify-center h-full text-sm font-secondary text-[var(--muted-foreground)]">User not found</div>
          ) : (
            <div className="space-y-6">

              {/* Profile fields */}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={labelClass}>First Name</span>
                    <input className={inputClass} value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                  </div>
                  <div>
                    <span className={labelClass}>Last Name</span>
                    <input className={inputClass} value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <span className={labelClass}>Email</span>
                    <input type="email" className={inputClass} value={form.name || ''} disabled />
                  </div>
                  <div>
                    <span className={labelClass}>Mobile No</span>
                    <input type="tel" className={inputClass} value={form.mobile_no || ''} onChange={e => setForm({ ...form, mobile_no: e.target.value })} />
                  </div>
                  <div>
                    <span className={labelClass}>User Type</span>
                    <select className={inputClass} value={form.user_type || 'System User'} onChange={e => setForm({ ...form, user_type: e.target.value })}>
                      <option value="System User">System User</option>
                      <option value="Website User">Website User</option>
                    </select>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-[var(--border)]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.enabled ? 'bg-emerald-500 border-emerald-500' : 'border-[var(--border)] bg-[var(--background)] group-hover:border-emerald-400/50'}`}
                        onClick={() => setForm({ ...form, enabled: form.enabled ? 0 : 1 })}>
                        {form.enabled ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : null}
                      </div>
                      <input type="checkbox" className="sr-only" checked={!!form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked ? 1 : 0 })} />
                      <span className="font-secondary text-sm text-[var(--foreground)]">User is Enabled</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Stat label="Full Name" value={item.full_name} /></div>
                  <div className="col-span-2"><Stat label="Email" value={item.name} /></div>
                  <Stat label="Mobile" value={item.mobile_no} />
                  <Stat label="User Type" value={item.user_type} />
                </div>
              )}

              {/* Roles */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-[3px] h-4 rounded-full bg-[var(--primary)] shrink-0" />
                  <span className="font-primary text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Roles</span>
                  <span className="flex-1 h-px bg-[var(--border)]" />
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    {APP_ROLES.map(({ name, description }) => {
                      const active = selectedRoles.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleRole(name)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                            active ? `${ROLE_COLORS[name]}` : 'bg-[var(--background)] border-[var(--border)] hover:border-[var(--primary)]/40'
                          }`}
                        >
                          <div>
                            <div className={`font-primary text-sm font-semibold ${active ? '' : 'text-[var(--foreground)]'}`}>{name}</div>
                            <div className={`font-secondary text-xs mt-0.5 ${active ? 'opacity-70' : 'text-[var(--muted-foreground)]'}`}>{description}</div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${active ? 'bg-current border-current' : 'border-[var(--border)]'}`}>
                            {active && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {userRoles.length > 0 ? userRoles.map((role: string) => (
                      <span key={role} className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-secondary ${ROLE_COLORS[role] || 'bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]'}`}>
                        {role}
                      </span>
                    )) : (
                      <span className="font-secondary text-sm text-[var(--muted-foreground)]">No roles assigned</span>
                    )}
                  </div>
                )}
              </div>

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
              href={erpnextUrl(`/app/user/${editName}`)}
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
          title="Delete User"
          message={`Are you sure you want to delete ${item?.full_name || editName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleteUser.isPending}
        />
      )}
    </>
  );
}
