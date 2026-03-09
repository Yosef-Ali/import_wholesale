import { useMemo, useState } from 'react';
import { useWarehouses, useWarehouseSummary } from '../../api/hooks/useWarehouse';
import { Warehouse as WarehouseIcon, Plus, Search, Filter } from 'lucide-react';
import { fmtETBCompact } from '../../utils/format';
import StatCard from '../../components/ui/StatCard';
import PageSkeleton from '../../components/ui/PageSkeleton';
import NewWarehouseDrawer from './NewWarehouseDrawer';
import WarehouseDetailDrawer from './WarehouseDetailDrawer';

interface WarehouseSummary {
  warehouse: string;
  item_count: number;
  total_qty: number;
  total_value: number;
}

export default function WarehouseList() {
  const { data: warehouses, isLoading: whLoading } = useWarehouses();
  const { data: summary } = useWarehouseSummary() as { data: WarehouseSummary[] | undefined };

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalWarehouses = warehouses?.length ?? 0;
  const totalStockValue = useMemo(
    () => (summary || []).reduce((sum, s) => sum + (s.total_value || 0), 0),
    [summary],
  );
  const totalItems = useMemo(
    () => (summary || []).reduce((sum, s) => sum + (s.item_count || 0), 0),
    [summary],
  );
  const uniqueTypes = useMemo(
    () => new Set((warehouses || []).map(w => w.warehouse_type).filter(Boolean)).size,
    [warehouses],
  );

  const summaryMap = useMemo(
    () => Object.fromEntries((summary || []).map((s) => [s.warehouse, s])),
    [summary],
  );

  const filteredWarehouses = useMemo(() => {
    if (!warehouses) return [];
    if (!searchQuery.trim()) return warehouses;
    const q = searchQuery.toLowerCase();
    return warehouses.filter(w => 
      w.name.toLowerCase().includes(q) || 
      w.warehouse_name.toLowerCase().includes(q)
    );
  }, [warehouses, searchQuery]);

  if (whLoading) return <PageSkeleton />;

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header Area */}
      <div className="flex-none px-6 pt-6 pb-0">
        <div className="flex items-center justify-between">
          <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">Warehouse</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewOpen(true)}
              className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> New Warehouse
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <StatCard title="Total Warehouses" value={totalWarehouses} change="locations" delay="0.04s" bars={[12, 20, 16, 24]} />
        <StatCard title="Stock Value" value={fmtETBCompact(totalStockValue)} change="total inventory" delay="0.08s" bars={[20, 28, 16, 24]} />
        <StatCard title="Total Items" value={totalItems} change="units tracked" delay="0.12s" bars={[8, 16, 24, 18]} />
        <StatCard title="Warehouse Types" value={uniqueTypes} change="storage types" delay="0.16s" bars={[16, 12, 20, 16]} />
      </div>

      {/* Toolbar */}
      <div className="flex-none px-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search warehouses..."
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
          {false ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] gap-3 bg-[var(--background)]/50 backdrop-blur-sm">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-auto flex-1 h-full">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[var(--background)]">
                  <tr className="border-b border-[var(--border)] h-10">
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary w-10"></th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Warehouse Name</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Company</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Type</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary text-right">Items</th>
                    <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredWarehouses.map((wh) => {
                    const s = summaryMap[wh.name];
                    return (
                      <tr 
                        key={wh.name} 
                        onClick={() => setSelectedWarehouse(wh.name)}
                        className="group hover:bg-[var(--secondary)] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                            <WarehouseIcon size={18} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-primary text-[0.9375rem] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{wh.warehouse_name}</span>
                            <span className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">{wh.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-secondary text-sm text-[var(--foreground)]">{wh.company}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-secondary text-xs font-medium px-2 py-0.5 rounded-full ${
                            wh.warehouse_type === 'Transit' ? 'bg-amber-500/10 text-amber-600' :
                            wh.warehouse_type === 'Store' ? 'bg-emerald-500/10 text-emerald-600' :
                            'bg-blue-500/10 text-blue-600'
                          }`}>
                            {wh.warehouse_type || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-[var(--foreground)]">{s?.item_count ?? 0}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm font-medium text-[var(--foreground)]">
                            {s?.total_value ? fmtETBCompact(s.total_value) : 'ETB 0'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredWarehouses.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm font-secondary text-[var(--muted-foreground)]">
                        No warehouses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isNewOpen && <NewWarehouseDrawer onClose={() => setIsNewOpen(false)} />}
      {selectedWarehouse && <WarehouseDetailDrawer editName={selectedWarehouse} onClose={() => setSelectedWarehouse(null)} />}
    </div>
  );
}
