import { useMemo, useState } from 'react';
import { useCustomers } from '../../api/hooks/useCustomers';
import { Users, Plus, Search, Filter } from 'lucide-react';
import { fmtETBCompact } from '../../utils/format';
import StatCard from '../../components/ui/StatCard';
import NewCustomerDrawer from './NewCustomerDrawer';
import CustomerDetailDrawer from './CustomerDetailDrawer';

export default function Customers() {
  const { data: customers, isLoading } = useCustomers();

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalCustomers = customers?.length ?? 0;
  const activeCustomers = useMemo(
    () => (customers || []).filter(c => !c.disabled).length,
    [customers],
  );
  const totalCreditLimit = useMemo(
    () => (customers || []).reduce((sum, c) => sum + (c.credit_limit || 0), 0),
    [customers],
  );
  const uniqueGroups = useMemo(
    () => new Set((customers || []).map(c => c.customer_group).filter(Boolean)).size,
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.customer_name.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header Area */}
      <div className="flex-none px-6 pt-6 pb-0">
        <div className="flex items-center justify-between">
          <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">Customers</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewOpen(true)}
              className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> New Customer
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <StatCard title="Total Customers" value={totalCustomers} change="registered" delay="0.04s" bars={[12, 20, 16, 24]} />
        <StatCard title="Active Customers" value={activeCustomers} change="non-disabled" delay="0.08s" bars={[20, 16, 24, 18]} />
        <StatCard title="Total Credit" value={fmtETBCompact(totalCreditLimit)} change="combined limit" delay="0.12s" bars={[8, 16, 24, 20]} />
        <StatCard title="Customer Groups" value={uniqueGroups} change="categories" delay="0.16s" bars={[16, 12, 20, 16]} />
      </div>

      {/* Toolbar */}
      <div className="flex-none px-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-sm font-secondary focus:outline-none focus:border-[var(--primary)] w-64 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-sm font-secondary text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors">
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 px-6 pb-6 min-h-0">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl h-full flex flex-col overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] gap-3 bg-[var(--background)]/50 backdrop-blur-sm">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-auto flex-1 h-full">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[var(--background)]">
                  <tr className="border-b border-[var(--border)] h-10">
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary w-10"></th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Customer Name</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Group</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Territory</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary text-right">Credit Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredCustomers.map((cust) => {
                    return (
                      <tr 
                        key={cust.name} 
                        onClick={() => setSelectedCustomer(cust.name)}
                        className={`group cursor-pointer transition-colors ${cust.disabled ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-[var(--secondary)]'}`}
                      >
                        <td className="px-4 py-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cust.disabled ? 'bg-red-500/10 text-red-600' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                            <Users size={18} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-primary text-[0.9375rem] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{cust.customer_name} {cust.disabled ? <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded ml-2 uppercase font-bold">Disabled</span> : null}</span>
                            <span className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">{cust.name} &bull; {cust.customer_type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-secondary text-xs font-medium px-2 py-0.5 rounded-full ${
                            cust.customer_group === 'Commercial' ? 'bg-amber-500/10 text-amber-600' :
                            cust.customer_group === 'Government' ? 'bg-emerald-500/10 text-emerald-600' :
                            cust.customer_group === 'Individual' ? 'bg-blue-500/10 text-blue-600' :
                            'bg-[var(--secondary)] text-[var(--muted-foreground)]'
                          }`}>
                            {cust.customer_group || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-secondary text-sm text-[var(--foreground)]">{cust.territory || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm font-medium text-[var(--foreground)]">
                            {cust.credit_limit ? fmtETBCompact(cust.credit_limit) : 'ETB 0'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredCustomers.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm font-secondary text-[var(--muted-foreground)]">
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isNewOpen && <NewCustomerDrawer onClose={() => setIsNewOpen(false)} />}
      {selectedCustomer && <CustomerDetailDrawer editName={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
    </div>
  );
}
