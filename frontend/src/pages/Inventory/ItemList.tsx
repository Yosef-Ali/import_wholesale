import { useState, useMemo } from 'react';
import {
    Package, Search,
    MoreHorizontal, Filter, Download, Plus, Info,
    ChevronLeft, ChevronRight, LayoutGrid, List, Upload, Loader2,
} from 'lucide-react';
import { useItems, useStockLevels, useItemGroups, useUploadItemImage } from '../../api/hooks/useItems';
import { useDashboardStats } from '../../api/hooks/useDashboard';
import StatCard from '../../components/ui/StatCard';
import ItemDetailDrawer from '../../components/ui/ItemDetailDrawer';
import NewItemDrawer from '../../components/ui/NewItemDrawer';
import { fmtETB, fmtETBCompact, erpnextUrl } from '../../utils/format';
import PageSkeleton from '../../components/ui/PageSkeleton';
import { toast } from '../../stores/toastStore';
import type { Item, StockLevel } from '../../api/types';

/* ─── Stock badge ─── */
function StockBadge({ level }: { level: 'ok' | 'low' | 'out' }) {
  const styles = {
    ok:  'bg-[var(--color-success)] text-[var(--color-success-foreground)]',
    low: 'bg-amber-500/10 text-amber-500',
    out: 'bg-[var(--color-error)] text-[var(--color-error-foreground)]',
  };
  const labels = { ok: 'In Stock', low: 'Low Stock', out: 'Out of Stock' };
  const dots   = { ok: 'bg-[var(--color-success-foreground)]', low: 'bg-amber-500', out: 'bg-[var(--color-error-foreground)]' };

  return (
    <span className={`font-secondary text-[0.6875rem] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[level]}`} />
      {labels[level]}
    </span>
  );
}

/* ─── Stock bar mini-chart ─── */
function StockBar({ qty, safetyStock }: { qty: number; safetyStock: number }) {
  const max = Math.max(qty, safetyStock, 1);
  const pct = Math.min((qty / max) * 100, 100);
  const color = qty <= 0 ? 'var(--color-error-foreground)' : qty <= safetyStock ? '#f59e0b' : 'var(--primary)';

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-primary text-xs text-[var(--muted-foreground)] w-8 text-right">{qty}</span>
    </div>
  );
}

export default function ItemList() {
  const [group, setGroup] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [page, setPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const uploadImage = useUploadItemImage();
  const PAGE_SIZE = 10;

  const { data: items, isLoading } = useItems(group || undefined);
  const { data: groups } = useItemGroups();
  const { data: stockLevels } = useStockLevels(undefined, group || undefined);
  const { data: dashStats } = useDashboardStats();

  // Build stock map for quick lookup
  const stockMap = useMemo(() => {
    const map: Record<string, StockLevel> = {};
    (stockLevels || []).forEach((s) => { map[s.item_code] = s; });
    return map;
  }, [stockLevels]);

  // Compute KPIs
  const totalItems = items?.length ?? 0;
  const totalValue = useMemo(
    () => (stockLevels || []).reduce((sum, s) => sum + (s.stock_value || 0), 0),
    [stockLevels],
  );
  const lowStockCount = dashStats?.low_stock_items ?? (stockLevels || []).filter((s) => s.is_low_stock).length;
  const groupCount = groups?.length ?? 0;

  // Filter & paginate
  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((it) =>
      it.item_name.toLowerCase().includes(q) ||
      it.item_code.toLowerCase().includes(q) ||
      it.item_group.toLowerCase().includes(q),
    );
  }, [items, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function getStockLevel(item: Item): 'ok' | 'low' | 'out' {
    const sl = stockMap[item.item_code];
    if (!sl) return 'ok';
    if (sl.actual_qty <= 0) return 'out';
    if (sl.is_low_stock) return 'low';
    return 'ok';
  }

  function handleFileUpload(itemName: string, file: File) {
    uploadImage.mutate({ itemName, file }, {
      onSuccess: () => toast.success('Image uploaded successfully'),
      onError: (err: any) => toast.error(err.message || 'Upload failed'),
    });
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-0">

      {/* Welcome Row */}
      <div className="flex items-center justify-between px-6 pt-6">
        <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">
          Inventory
        </h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-full px-4 py-2 font-secondary text-sm font-medium border-none cursor-pointer hover:bg-[var(--border)] transition-colors">
            <Download size={14} />
            Export
          </button>
          <button
            className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setIsNewDrawerOpen(true)}
          >
            <Plus size={14} />
            New Item
          </button>
        </div>
      </div>

      {/* KPI Grid - 4 columns */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <StatCard
          title="Total Items"
          value={totalItems.toLocaleString()}
          change={`${groupCount} groups`}
          delay="0.04s"
          bars={[8, 16, 24, 20]}
        />
        <StatCard
          title="Stock Value"
          value={fmtETBCompact(totalValue)}
          change="across all warehouses"
          delay="0.08s"
          bars={[20, 28, 16, 24]}
        />
        <StatCard
          title="Low Stock"
          value={lowStockCount.toString()}
          change="items need reorder"
          delay="0.12s"
          bars={[24, 12, 8, 16]}
        />
        <StatCard
          title="Item Groups"
          value={groupCount.toString()}
          change="categories active"
          delay="0.16s"
          bars={[12, 20, 16, 28]}
        />
      </div>

      {/* Main Table Section */}
      <div className="px-6 pb-6">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">

          {/* Table Toolbar */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="font-primary text-xs font-medium text-[var(--muted-foreground)] tracking-widest uppercase">
                Item Catalog
              </span>
              <Info size={14} className="text-[var(--muted-foreground)]" />
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-full h-9 px-3 w-[220px]">
                <Search size={14} className="text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="bg-transparent border-none outline-none font-secondary text-[0.8125rem] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] w-full"
                />
              </div>

              {/* Group Filter */}
              <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-full h-9 px-3">
                <Filter size={14} className="text-[var(--muted-foreground)]" />
                <select
                  value={group}
                  onChange={(e) => { setGroup(e.target.value); setPage(0); }}
                  className="bg-transparent border-none outline-none font-secondary text-[0.8125rem] text-[var(--foreground)] cursor-pointer appearance-none pr-4"
                >
                  <option value="">All Groups</option>
                  {groups?.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-[var(--secondary)] rounded-full p-[3px]">
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 rounded-full border-none cursor-pointer transition-colors ${view === 'list' ? 'bg-[var(--card)] text-[var(--foreground)]' : 'bg-transparent text-[var(--muted-foreground)]'}`}
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded-full border-none cursor-pointer transition-colors ${view === 'grid' ? 'bg-[var(--card)] text-[var(--foreground)]' : 'bg-transparent text-[var(--muted-foreground)]'}`}
                >
                  <LayoutGrid size={14} />
                </button>
              </div>

              <MoreHorizontal size={18} className="text-[var(--muted-foreground)]" />
            </div>
          </div>

          {/* LIST VIEW */}
          {view === 'list' && (
            <>
              {/* Column Headers */}
              <div className="flex items-center bg-[var(--background)] border-b border-[var(--border)] h-10 text-[0.6875rem] font-primary font-medium text-[var(--muted-foreground)] tracking-wider">
                <div className="w-10 flex items-center justify-center shrink-0">
                  <div className="w-4 h-4 border border-[var(--border)] rounded" />
                </div>
                <div className="w-[68px] px-2 whitespace-nowrap shrink-0">CODE</div>
                <div className="flex-[2] px-2 whitespace-nowrap min-w-[120px]">ITEM NAME</div>
                <div className="flex-1 px-2 whitespace-nowrap min-w-[90px]">GROUP</div>
                <div className="w-[50px] px-2 whitespace-nowrap shrink-0">UOM</div>
                <div className="w-[90px] px-2 whitespace-nowrap shrink-0">RATE</div>
                <div className="w-[90px] px-2 whitespace-nowrap shrink-0">STOCK</div>
                <div className="w-[90px] px-2 whitespace-nowrap shrink-0">STATUS</div>
                <div className="w-10 shrink-0"></div>
              </div>

              {/* Data Rows */}
              {paged.length === 0 ? (
                <div className="flex items-center justify-center py-12 font-secondary text-sm text-[var(--muted-foreground)]">
                  {search ? `No items matching "${search}"` : 'No items found. Add construction materials in ERPNext.'}
                </div>
              ) : (
                paged.map((item) => {
                  const sl = stockMap[item.item_code];
                  const qty = sl?.actual_qty ?? 0;
                  const safetyStock = item.safety_stock || sl?.safety_stock || 0;
                  const level = getStockLevel(item);

                  return (
                    <div
                      key={item.name}
                      className="flex items-center border-b border-[var(--border)] h-[48px] text-sm font-secondary text-[var(--foreground)] cursor-pointer hover:bg-[var(--secondary)]/30 transition-colors"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="w-10 flex items-center justify-center shrink-0">
                        <div className="w-4 h-4 border border-[var(--border)] rounded" />
                      </div>
                      <div className="w-[68px] px-2 font-primary text-xs text-[var(--muted-foreground)] truncate shrink-0">
                        {item.item_code}
                      </div>

                      <div className="flex-[2] px-2 flex items-center gap-2.5 min-w-[120px]">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="w-7 h-7 rounded-md object-cover shrink-0 bg-[var(--secondary)]"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement | null)?.style?.removeProperty('display'); }}
                          />
                        ) : null}
                        <div className="relative group/upload" style={{ display: item.image ? 'none' : undefined }}>
                          <label 
                            className="w-7 h-7 rounded-md bg-[var(--secondary)] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[var(--border)] transition-colors border border-dashed border-transparent hover:border-[var(--muted-foreground)]" 
                            title="Upload Image"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {uploadImage.isPending && uploadImage.variables?.itemName === item.name ? (
                              <Loader2 size={12} className="animate-spin text-[var(--muted-foreground)]" />
                            ) : (
                              <Package size={12} className="text-[var(--muted-foreground)] group-hover/upload:opacity-0" />
                            )}
                            {!uploadImage.isPending || uploadImage.variables?.itemName !== item.name ? (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                                <Upload size={12} className="text-[var(--primary)]" />
                              </div>
                            ) : null}
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(item.name, file);
                              }}
                            />
                          </label>
                          {/* Small plus badge to indicate action */}
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--primary)] rounded-full flex items-center justify-center border border-[var(--background)] shadow-sm pointer-events-none">
                            <Plus size={8} className="text-[var(--primary-foreground)]" />
                          </div>
                        </div>
                        <span className="font-medium truncate text-[0.8125rem]">{item.item_name}</span>
                      </div>
                      <div className="flex-1 px-2 min-w-[90px]">
                        <span className="font-secondary text-[0.6875rem] text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full whitespace-nowrap">
                          {item.item_group}
                        </span>
                      </div>
                      <div className="w-[50px] px-2 text-xs text-[var(--muted-foreground)] shrink-0 whitespace-nowrap">{item.stock_uom}</div>
                      <div className="w-[90px] px-2 font-primary text-xs shrink-0 whitespace-nowrap">
                        {item.standard_rate > 0 ? fmtETB(item.standard_rate) : '—'}
                      </div>
                      <div className="w-[90px] px-2 shrink-0">
                        <StockBar qty={qty} safetyStock={safetyStock} />
                      </div>
                      <div className="w-[90px] px-2 shrink-0">
                        <StockBadge level={level} />
                      </div>
                      <div className="w-10 flex justify-center shrink-0">
                        <button
                          className="p-1 rounded bg-transparent border-none cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                          onClick={(e) => { e.stopPropagation(); window.open(erpnextUrl(`/app/item/${item.name}`), '_blank'); }}
                          title="Open in ERPNext"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
                  <span className="font-secondary text-xs text-[var(--muted-foreground)]">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} items
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-1.5 rounded-md border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--secondary)] transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`w-8 h-8 rounded-md border text-xs font-secondary font-medium cursor-pointer transition-colors ${
                          page === i
                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                            : 'bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--secondary)]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-1.5 rounded-md border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--secondary)] transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* GRID VIEW */}
          {view === 'grid' && (
            <div className="grid grid-cols-3 gap-4 p-5">
              {paged.length === 0 ? (
                <div className="col-span-3 flex items-center justify-center py-12 font-secondary text-sm text-[var(--muted-foreground)]">
                  {search ? `No items matching "${search}"` : 'No items found.'}
                </div>
              ) : (
                paged.map((item) => {
                  const sl = stockMap[item.item_code];
                  const qty = sl?.actual_qty ?? 0;
                  const safetyStock = item.safety_stock || sl?.safety_stock || 0;
                  const level = getStockLevel(item);

                  return (
                    <div
                      key={item.name}
                      className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-4 cursor-pointer hover:border-[var(--primary)] transition-colors group"
                      onClick={() => setSelectedItem(item)}
                    >
                      {/* Item header */}
                      <div className="flex items-start gap-3 mb-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[var(--secondary)]"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.style?.removeProperty('display'); }}
                          />
                        ) : null}
                        <div className="relative group/upload shrink-0" style={{ display: item.image ? 'none' : undefined }}>
                          <label 
                            className="w-12 h-12 rounded-lg bg-[var(--secondary)] flex items-center justify-center cursor-pointer hover:bg-[var(--border)] transition-colors border border-dashed border-transparent hover:border-[var(--muted-foreground)]" 
                            title="Upload Image"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {uploadImage.isPending && uploadImage.variables?.itemName === item.name ? (
                              <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
                            ) : (
                              <Package size={20} className="text-[var(--muted-foreground)] group-hover/upload:opacity-0" />
                            )}
                            {!uploadImage.isPending || uploadImage.variables?.itemName !== item.name ? (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                                <Upload size={20} className="text-[var(--primary)]" />
                              </div>
                            ) : null}
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(item.name, file);
                              }}
                            />
                          </label>
                          {/* Small plus badge to indicate action */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--primary)] rounded-full flex items-center justify-center border-2 border-[var(--background)] shadow-sm pointer-events-none">
                            <Plus size={10} className="text-[var(--primary-foreground)]" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-secondary text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                            {item.item_name}
                          </div>
                          <div className="font-primary text-xs text-[var(--muted-foreground)]">{item.item_code}</div>
                        </div>
                        <StockBadge level={level} />
                      </div>

                      {/* Details */}
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                        <div>
                          <div className="font-primary text-[0.6rem] text-[var(--muted-foreground)] uppercase tracking-widest">Rate</div>
                          <div className="font-secondary text-sm font-semibold text-[var(--foreground)]">
                            {item.standard_rate > 0 ? fmtETB(item.standard_rate) : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="font-primary text-[0.6rem] text-[var(--muted-foreground)] uppercase tracking-widest">Stock</div>
                          <div className="font-secondary text-sm font-semibold text-[var(--foreground)]">{qty} {item.stock_uom}</div>
                        </div>
                        <div>
                          <div className="font-primary text-[0.6rem] text-[var(--muted-foreground)] uppercase tracking-widest">Group</div>
                          <div className="font-secondary text-xs text-[var(--muted-foreground)]">{item.item_group}</div>
                        </div>
                      </div>

                      {/* Stock bar */}
                      <div className="mt-3">
                        <StockBar qty={qty} safetyStock={safetyStock} />
                      </div>
                    </div>
                  );
                })
              )}

              {/* Grid Pagination */}
              {totalPages > 1 && (
                <div className="col-span-3 flex items-center justify-between pt-3">
                  <span className="font-secondary text-xs text-[var(--muted-foreground)]">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-1.5 rounded-md border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] cursor-pointer disabled:opacity-30 hover:bg-[var(--secondary)]"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-1.5 rounded-md border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] cursor-pointer disabled:opacity-30 hover:bg-[var(--secondary)]"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Drawer */}
      {selectedItem && (
        <ItemDetailDrawer
          itemName={selectedItem.name}
          stockLevel={stockMap[selectedItem.item_code]}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* New Item Drawer */}
      {isNewDrawerOpen && (
        <NewItemDrawer onClose={() => setIsNewDrawerOpen(false)} />
      )}
    </div>
  );
}
