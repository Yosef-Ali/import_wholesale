import { useState } from 'react';
import { UserCog, X, Loader2, UserPlus, ExternalLink } from 'lucide-react';
import { useCreateUser, APP_ROLES } from '../../api/hooks/useUsers';
import { toast } from '../../stores/toastStore';
import { drawerInputClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';

interface Props { onClose: () => void }

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="w-[3px] h-4 rounded-full bg-[var(--primary)] shrink-0" />
      <span className="font-primary text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{children}</span>
      <span className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = {
  'BuildSupply Admin': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Import Manager':    'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Warehouse Manager': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Sales Manager':     'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Sales Rep':         'bg-teal-500/10 text-teal-600 border-teal-500/20',
  'Accountant':        'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

export default function NewUserDrawer({ onClose }: Props) {
  const createUser = useCreateUser();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile_no: '',
    user_type: 'System User',
    send_welcome_email: 1,
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleCreate = async () => {
    if (!form.first_name || !form.email) {
      toast.error('First name and email are required');
      return;
    }
    try {
      await createUser.mutateAsync({
        ...form,
        roles: selectedRoles.map(role => ({ role })),
      });
      toast.success('User created successfully');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create user');
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
              <UserCog size={20} />
            </div>
            <div>
              <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight">New User</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">Create a system user and assign roles</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">

            <SectionDivider>Profile</SectionDivider>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input type="text" className={inputClass} value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} autoFocus placeholder="e.g. Alem" />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input type="text" className={inputClass} value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="e.g. Tadesse" />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Email <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input type="email" className={inputClass} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="alem@company.com" />
              </div>
              <div>
                <label className={labelClass}>Mobile No</label>
                <input type="tel" className={inputClass} value={form.mobile_no} onChange={e => setForm(p => ({ ...p, mobile_no: e.target.value }))} placeholder="+251 9xx xxx xxx" />
              </div>
              <div>
                <label className={labelClass}>User Type</label>
                <select className={inputClass} value={form.user_type} onChange={e => setForm(p => ({ ...p, user_type: e.target.value }))}>
                  <option value="System User">System User</option>
                  <option value="Website User">Website User</option>
                </select>
              </div>
            </div>

            <SectionDivider>Roles</SectionDivider>
            <div className="space-y-2">
              {APP_ROLES.map(({ name, description }) => {
                const active = selectedRoles.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleRole(name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      active
                        ? `${ROLE_COLORS[name]} border`
                        : 'bg-[var(--background)] border-[var(--border)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    <div>
                      <div className={`font-primary text-sm font-semibold ${active ? '' : 'text-[var(--foreground)]'}`}>{name}</div>
                      <div className={`font-secondary text-xs mt-0.5 ${active ? 'opacity-70' : 'text-[var(--muted-foreground)]'}`}>{description}</div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      active ? 'bg-current border-current' : 'border-[var(--border)]'
                    }`}>
                      {active && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </button>
                );
              })}
            </div>

            <SectionDivider>Options</SectionDivider>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.send_welcome_email ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)] group-hover:border-[var(--primary)]/50'}`}
                onClick={() => setForm(p => ({ ...p, send_welcome_email: p.send_welcome_email ? 0 : 1 }))}
              >
                {form.send_welcome_email ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : null}
              </div>
              <input type="checkbox" className="sr-only" checked={!!form.send_welcome_email} onChange={e => setForm(p => ({ ...p, send_welcome_email: e.target.checked ? 1 : 0 }))} />
              <div>
                <span className="font-secondary text-sm text-[var(--foreground)]">Send Welcome Email</span>
                <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">User receives a link to set their password</p>
              </div>
            </label>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/40">
          <a
            href={`${window.location.origin}/app/user/new-user-1`}
            target="_blank" rel="noreferrer"
            className="text-sm font-secondary text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1.5 transition-colors no-underline"
          >
            <ExternalLink size={13} /> Open in ERPNext
          </a>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm font-secondary font-medium px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] cursor-pointer hover:bg-[var(--border)] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate} disabled={createUser.isPending}
              className="text-sm font-secondary font-semibold px-5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              {createUser.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Create User
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
