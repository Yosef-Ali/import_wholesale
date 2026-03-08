import { useState, useMemo } from 'react';
import { Search, Filter, Plus, FileDown, Shield } from 'lucide-react';
import { useUsers, APP_ROLES } from '../../api/hooks/useUsers';
import StatCard from '../../components/ui/StatCard';
import NewUserDrawer from './NewUserDrawer';
import UserDetailDrawer from './UserDetailDrawer';

const ROLE_COLORS: Record<string, string> = {
  'BuildSupply Admin': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Import Manager':    'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Warehouse Manager': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Sales Manager':     'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Sales Rep':         'bg-teal-500/10 text-teal-600 border-teal-500/20',
  'Accountant':        'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-primary text-xs font-bold shrink-0">
      {initials || '?'}
    </div>
  );
}

export default function Users() {
  const { data: users = [], isLoading } = useUsers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // KPIs
  const totalUsers   = users.length;
  const activeUsers  = useMemo(() => users.filter(u => u.enabled).length, [users]);
  const systemUsers  = useMemo(() => users.filter(u => u.user_type === 'System User').length, [users]);
  const adminCount   = useMemo(() => users.filter(u => (u.roles || []).some((r: any) => r.role === 'BuildSupply Admin')).length, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.mobile_no?.toLowerCase().includes(search.toLowerCase());
      const matchRole = !roleFilter || (u.roles || []).some((r: any) => r.role === roleFilter);
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="flex flex-col gap-0">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 mb-0 shrink-0">
        <div>
          <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">User Management</h1>
          <p className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)] mt-1 mb-0">Manage system users and their role assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-full px-4 py-2 font-secondary text-sm font-medium border-none cursor-pointer hover:bg-[var(--border)] transition-colors">
            <FileDown size={14} /> Export
          </button>
          <button
            onClick={() => setIsNewDrawerOpen(true)}
            className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> New User
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 shrink-0">
        <StatCard title="Total Users" value={totalUsers.toString()} change="All accounts" delay="0.04s" bars={[8, 16, 24, 20]} />
        <StatCard title="Active Users" value={activeUsers.toString()} change="Enabled accounts" delay="0.08s" bars={[16, 24, 20, 28]} />
        <StatCard title="System Users" value={systemUsers.toString()} change="Full system access" delay="0.12s" bars={[24, 16, 20, 12]} />
        <StatCard title="Admins" value={adminCount.toString()} change="BuildSupply Admin role" delay="0.16s" bars={[12, 8, 16, 20]} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 border-y border-[var(--border)] bg-[var(--background)] shrink-0 h-12 gap-4">
        <div className="flex items-center gap-1 h-full">
          <span className="font-secondary text-sm font-medium text-[var(--foreground)] px-1">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-xs font-secondary text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="pl-9 pr-8 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-xs font-secondary text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Roles</option>
              {APP_ROLES.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col flex-1 px-6 pb-6 relative h-full">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col flex-1 shadow-sm mt-4">
          {isLoading && (
            <div className="absolute inset-0 bg-[var(--background)]/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="overflow-auto flex-1 h-full">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[var(--background)]">
                <tr className="border-b border-[var(--border)] h-10">
                  <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary w-12"></th>
                  <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">User</th>
                  <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Roles</th>
                  <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Mobile</th>
                  <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Type</th>
                  <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredUsers.map(u => (
                  <tr
                    key={u.name}
                    onClick={() => setSelectedUser(u.name)}
                    className="group hover:bg-[var(--secondary)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <UserAvatar name={u.full_name || u.name} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-primary text-[0.9375rem] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{u.full_name || u.name}</span>
                        <span className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(u.roles || []).length > 0 ? (u.roles || []).map((r: any) => (
                          <span key={r.role} className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider border ${ROLE_COLORS[r.role] || 'bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]'}`}>
                            {r.role}
                          </span>
                        )) : (
                          <span className="font-secondary text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                            <Shield size={11} /> No roles
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-secondary text-sm text-[var(--foreground)]">{u.mobile_no || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-secondary text-xs text-[var(--muted-foreground)]">{u.user_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-secondary font-bold uppercase tracking-wider ${
                        u.enabled
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {u.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}

                {!isLoading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm font-secondary text-[var(--muted-foreground)]">
                      {search || roleFilter ? 'No users match your filters.' : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isNewDrawerOpen && <NewUserDrawer onClose={() => setIsNewDrawerOpen(false)} />}
      {selectedUser && <UserDetailDrawer editName={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}
