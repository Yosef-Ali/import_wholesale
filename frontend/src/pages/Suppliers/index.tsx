import { useMemo, useState } from 'react';
import { useSuppliers } from '../../api/hooks/useSuppliers';
import { PageHeader } from '../../components/ui/PageHeader';
import { Truck, Plus, Search, Filter } from 'lucide-react';
import NewSupplierDrawer from './NewSupplierDrawer';
import SupplierDetailDrawer from './SupplierDetailDrawer';

export default function Suppliers() {
  const { data: suppliers, isLoading } = useSuppliers();

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!searchQuery.trim()) return suppliers;
    const q = searchQuery.toLowerCase();
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.supplier_name.toLowerCase().includes(q)
    );
  }, [suppliers, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header Area */}
      <div className="flex-none px-8 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <PageHeader title="Suppliers" subtitle="International material suppliers" />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsNewOpen(true)}
              className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> New Supplier
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input 
                type="text" 
                placeholder="Search suppliers..." 
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
      </div>

      {/* Table Area */}
      <div className="flex-1 px-8 pb-8 min-h-0">
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
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Supplier Name</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Group</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Country</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredSuppliers.map((sup) => {
                    return (
                      <tr 
                        key={sup.name} 
                        onClick={() => setSelectedSupplier(sup.name)}
                        className="group hover:bg-[var(--secondary)] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                            <Truck size={18} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-primary text-[0.9375rem] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{sup.supplier_name}</span>
                            <span className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">{sup.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-secondary text-xs font-medium px-2 py-0.5 rounded-full ${
                            sup.supplier_group === 'Raw Material' ? 'bg-amber-500/10 text-amber-600' :
                            sup.supplier_group === 'Hardware' ? 'bg-emerald-500/10 text-emerald-600' :
                            sup.supplier_group === 'Distributor' ? 'bg-blue-500/10 text-blue-600' :
                            'bg-[var(--secondary)] text-[var(--muted-foreground)]'
                          }`}>
                            {sup.supplier_group || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-secondary text-sm text-[var(--foreground)]">{sup.country || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-secondary text-sm text-[var(--foreground)]">{sup.supplier_type || '-'}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredSuppliers.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm font-secondary text-[var(--muted-foreground)]">
                        No suppliers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isNewOpen && <NewSupplierDrawer onClose={() => setIsNewOpen(false)} />}
      {selectedSupplier && <SupplierDetailDrawer editName={selectedSupplier} onClose={() => setSelectedSupplier(null)} />}
    </div>
  );
}
