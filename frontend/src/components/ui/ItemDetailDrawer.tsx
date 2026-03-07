import { useEffect, useState } from 'react';
import {
  X, Package, ExternalLink, Warehouse, Tag, Scale,
  AlertTriangle, CheckCircle2, RefreshCw, Printer,
  Edit2, TrendingUp, ShoppingCart, BarChart2, Trash2, Save,
} from 'lucide-react';
import { useItemDetail, useItemStock, useUpdateItem, useDeleteItem } from '../../api/hooks/useItems';
import { fmtETB } from '../../utils/format';
import type { StockLevel } from '../../api/types';

/* ─── Mini stat block ─── */
function Stat({ label, value, mono = false, wide = false }: { label: string; value: React.ReactNode; mono?: boolean; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? 'col-span-2' : ''}`}>
      <span className="font-primary text-[0.6875rem] font-medium text-[var(--muted-foreground)] tracking-widest uppercase">
        {label}
      </span>
      <span className={`text-base font-bold text-[var(--foreground)] tracking-tight ${mono ? 'font-primary' : 'font-secondary'}`}>
        {value}
      </span>
    </div>
  );
}

/* ─── Stock row per warehouse ─── */
function StockRow({ sl }: { sl: StockLevel }) {
  const qty = sl.actual_qty ?? 0;
  const reserved = (sl as any).reserved_qty ?? 0;
  const available = qty - reserved;
  const isLow = sl.is_low_stock;
  const isOut = qty <= 0;

  const barPct = Math.max(0, Math.min(100, (qty / ((sl as any).safety_stock || 100)) * 100));

  return (
    <div className="py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Warehouse size={13} className="text-[var(--muted-foreground)] shrink-0" />
          <span className="font-secondary text-xs text-[var(--foreground)] truncate font-medium">{sl.warehouse}</span>
        </div>
        {isOut ? (
          <span className="font-secondary text-[0.6rem] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 whitespace-nowrap">Out of Stock</span>
        ) : isLow ? (
          <span className="font-secondary text-[0.6rem] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 whitespace-nowrap">Low Stock</span>
        ) : (
          <span className="font-secondary text-[0.6rem] font-medium px-2 py-0.5 rounded-full bg-[var(--color-success)]/60 text-[var(--color-success-foreground)] whitespace-nowrap">In Stock</span>
        )}
      </div>
      {/* Stock bar */}
      <div className="w-full h-1.5 bg-[var(--secondary)] rounded-full mb-2">
        <div
          className={`h-full rounded-full transition-all ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-[var(--primary)]'}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs font-primary text-[var(--muted-foreground)]">
        <span>Actual: <strong className="text-[var(--foreground)]">{qty}</strong></span>
        <span>Reserved: <strong className="text-[var(--foreground)]">{reserved}</strong></span>
        <span>Available: <strong className={available <= 0 ? 'text-red-500' : 'text-[var(--foreground)]'}>{available}</strong></span>
      </div>
    </div>
  );
}

/* ─── Section label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-primary text-[0.6875rem] font-medium text-[var(--muted-foreground)] tracking-widest uppercase mb-4">
      {children}
    </div>
  );
}

/* ─── Tab ─── */
type Tab = 'details' | 'stock' | 'purchasing';

interface Props {
  itemName: string | null;
  stockLevel?: StockLevel;
  onClose: () => void;
}

export default function ItemDetailDrawer({ itemName, stockLevel, onClose }: Props) {
  const { data: item, isLoading } = useItemDetail(itemName);
  const { data: stockData, isLoading: stockLoading } = useItemStock(item?.item_code ?? null);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [tab, setTab] = useState<Tab>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<any>>({});

  // Sync form when item loads
  useEffect(() => {
    if (item && !isEditing) {
      setEditForm({
        item_name: item.item_name,
        item_group: item.item_group,
        stock_uom: item.stock_uom,
        standard_rate: item.standard_rate,
        safety_stock: item.safety_stock,
        is_stock_item: (item as any).is_stock_item,
        is_sales_item: (item as any).is_sales_item,
        is_purchase_item: (item as any).is_purchase_item,
      });
    }
  }, [item, isEditing]);

  // Close on Escape (only if not editing)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditing) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const stockRows = stockData ?? (stockLevel ? [stockLevel] : []);
  const totalStock = stockRows.reduce((s, r) => s + (r.actual_qty ?? 0), 0);
  const totalReserved = stockRows.reduce((s, r) => s + ((r as any).reserved_qty ?? 0), 0);

  const handlePrint = () => {
    if (!item) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${item.item_name}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .code { font-size: 12px; color: #666; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; color: #888; padding: 6px 8px; border-bottom: 2px solid #eee; }
        td { padding: 8px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
        .section { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #888; margin-top: 24px; margin-bottom: 8px; letter-spacing: 0.08em; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; }
        .ok { background: #dcfce7; color: #16a34a; }
        .low { background: #fef3c7; color: #d97706; }
        .out { background: #fee2e2; color: #dc2626; }
      </style>
      </head><body>
      <h1>${item.item_name}</h1>
      <div class="code">SKU: ${item.item_code} · Group: ${item.item_group} · UOM: ${item.stock_uom}</div>
      <div class="section">Pricing</div>
      <table>
        <tr><th>Standard Rate</th><th>Valuation Rate</th><th>Safety Stock</th></tr>
        <tr>
          <td>${item.standard_rate > 0 ? `ETB ${item.standard_rate.toLocaleString()}` : '—'}</td>
          <td>${(item as any).valuation_rate ? `ETB ${(item as any).valuation_rate.toLocaleString()}` : '—'}</td>
          <td>${item.safety_stock > 0 ? `${item.safety_stock} ${item.stock_uom}` : '—'}</td>
        </tr>
      </table>
      <div class="section">Stock Levels (${new Date().toLocaleDateString()})</div>
      <table>
        <tr><th>Warehouse</th><th>Actual Qty</th><th>Reserved</th><th>Available</th><th>Status</th></tr>
        ${stockRows.map(sl => {
          const qty = sl.actual_qty ?? 0;
          const res = (sl as any).reserved_qty ?? 0;
          const cls = qty <= 0 ? 'out' : sl.is_low_stock ? 'low' : 'ok';
          const label = qty <= 0 ? 'Out of Stock' : sl.is_low_stock ? 'Low Stock' : 'In Stock';
          return `<tr><td>${sl.warehouse}</td><td>${qty}</td><td>${res}</td><td>${qty - res}</td><td><span class="badge ${cls}">${label}</span></td></tr>`;
        }).join('')}
        <tr style="border-top:2px solid #eee"><td><strong>Total</strong></td><td><strong>${totalStock}</strong></td><td><strong>${totalReserved}</strong></td><td><strong>${totalStock - totalReserved}</strong></td><td></td></tr>
      </table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleSave = () => {
    if (!itemName) return;
    updateItem.mutate({ name: itemName, data: editForm }, {
      onSuccess: () => setIsEditing(false)
    });
  };

  const handleDelete = () => {
    if (!itemName) return;
    if (confirm(`Are you sure you want to delete ${item?.item_name ?? itemName}?`)) {
      deleteItem.mutate(itemName, {
        onSuccess: () => onClose()
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer — adjusted width */}
      <div className="fixed right-0 top-0 h-full w-[500px] bg-[var(--card)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
              <Package size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <div className="font-primary text-[0.6875rem] font-medium text-[var(--muted-foreground)] tracking-widest uppercase mb-0.5">Inventory · Item</div>
              <div className="font-secondary text-sm font-bold text-[var(--foreground)]">
                {isLoading ? 'Loading…' : (item?.item_name ?? itemName)}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={updateItem.isPending}
                  className="flex items-center gap-1.5 text-xs font-secondary font-semibold text-[var(--foreground)] bg-[var(--secondary)] px-3 py-1.5 rounded-lg hover:bg-[var(--border)] transition-colors border border-[var(--border)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateItem.isPending}
                  className="flex items-center gap-1.5 text-xs font-secondary font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer border-none"
                >
                  {updateItem.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  Save
                </button>
              </>
            ) : (
              <>
                {/* Delete */}
                <button
                  onClick={handleDelete}
                  disabled={deleteItem.isPending || !item}
                  className="flex items-center gap-1.5 text-xs font-secondary font-semibold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors border border-transparent cursor-pointer disabled:opacity-40"
                  title="Delete Item"
                >
                  {deleteItem.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>

                {/* Print */}
                <button
                  onClick={handlePrint}
                  disabled={!item}
                  className="flex items-center gap-1.5 text-xs font-secondary font-semibold text-[var(--foreground)] bg-[var(--secondary)] px-3 py-1.5 rounded-lg hover:bg-[var(--border)] transition-colors border border-[var(--border)] cursor-pointer disabled:opacity-40"
                >
                  <Printer size={13} />
                  Print
                </button>

                {/* Edit inline */}
                <button
                  onClick={() => { setTab('details'); setIsEditing(true); }}
                  className="flex items-center gap-1.5 text-xs font-secondary font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer border-none"
                >
                  <Edit2 size={13} />
                  Edit
                </button>
              </>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              disabled={isEditing}
              className="ml-1 p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors disabled:opacity-40"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-0 px-5 border-b border-[var(--border)]">
          {([
            { id: 'details', icon: Package, label: 'Details' },
            { id: 'stock',   icon: BarChart2, label: 'Stock' },
            { id: 'purchasing', icon: ShoppingCart, label: 'Purchasing' },
          ] as { id: Tab; icon: typeof Package; label: string }[]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-secondary font-semibold border-b-2 transition-colors cursor-pointer bg-transparent border-x-0 border-t-0 ${
                tab === id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full gap-2 text-[var(--muted-foreground)]">
              <RefreshCw size={16} className="animate-spin" />
              <span className="font-secondary text-sm">Loading item…</span>
            </div>
          ) : item ? (
            <>
              {/* ── DETAILS TAB ── */}
              {tab === 'details' && (
                <>
                  {/* Hero */}
                  <div className="p-5 border-b border-[var(--border)]">
                    <div className="flex items-start gap-4">
                      {item.image ? (
                        <img
                          src={item.image as string}
                          alt=""
                          className="w-24 h-24 rounded-xl object-cover bg-[var(--secondary)] shrink-0"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-[var(--secondary)] flex items-center justify-center shrink-0">
                          <Package size={36} className="text-[var(--muted-foreground)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            className="input font-secondary text-xl font-bold mb-1.5"
                            value={editForm.item_name || ''}
                            onChange={e => setEditForm(prev => ({ ...prev, item_name: e.target.value }))}
                          />
                        ) : (
                          <h2 className="font-secondary text-xl font-bold text-[var(--foreground)] m-0 mb-1.5 leading-tight">
                            {item.item_name}
                          </h2>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-primary text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded">
                            {item.item_code}
                          </span>
                          <span className={`font-secondary text-xs font-semibold px-2 py-0.5 rounded-full ${
                            (item as any).disabled
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-[var(--color-success)]/60 text-[var(--color-success-foreground)]'
                          }`}>
                            {(item as any).disabled ? 'Disabled' : 'Enabled'}
                          </span>
                        </div>
                        {/* Total stock quick-view */}
                        <div className="flex items-center gap-1.5 text-xs font-secondary text-[var(--muted-foreground)]">
                          <TrendingUp size={12} className={totalStock > 0 ? 'text-[var(--color-success-foreground)]' : 'text-red-400'} />
                          <span>
                            Total stock: <strong className="text-[var(--foreground)]">{totalStock} {item.stock_uom}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="p-5 border-b border-[var(--border)]">
                    <SectionLabel>Core Details</SectionLabel>
                    <div className="grid grid-cols-2 gap-4">
                      {isEditing ? (
                        <>
                          <div className="flex flex-col gap-1">
                            <label className="label">Item Group</label>
                            <input className="input" value={editForm.item_group || ''} onChange={e => setEditForm(p => ({ ...p, item_group: e.target.value }))} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="label">UOM (Stock)</label>
                            <input className="input" value={editForm.stock_uom || ''} onChange={e => setEditForm(p => ({ ...p, stock_uom: e.target.value }))} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="label">Standard Rate (ETB)</label>
                            <input type="number" className="input" value={editForm.standard_rate || 0} onChange={e => setEditForm(p => ({ ...p, standard_rate: parseFloat(e.target.value) }))} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="label">Safety Stock</label>
                            <input type="number" className="input" value={editForm.safety_stock || 0} onChange={e => setEditForm(p => ({ ...p, safety_stock: parseFloat(e.target.value) }))} />
                          </div>
                        </>
                      ) : (
                        <>
                          <Stat label="Item Group" value={<span className="flex items-center gap-1.5"><Tag size={12} className="text-[var(--muted-foreground)]" />{item.item_group}</span>} />
                          <Stat label="Unit of Measure" value={<span className="flex items-center gap-1.5"><Scale size={12} className="text-[var(--muted-foreground)]" />{item.stock_uom}</span>} />
                          <Stat label="Maintain Stock" value={
                            (item as any).is_stock_item
                              ? <span className="flex items-center gap-1 text-[var(--color-success-foreground)]"><CheckCircle2 size={13} /> Yes</span>
                              : <span className="flex items-center gap-1 text-[var(--muted-foreground)]"><X size={13} /> No</span>
                          } />
                          <Stat label="Standard Rate" mono value={item.standard_rate > 0 ? fmtETB(item.standard_rate) : <span className="text-[var(--muted-foreground)]">—</span>} />
                          <Stat label="Valuation Rate" mono value={(item as any).valuation_rate ? fmtETB((item as any).valuation_rate) : <span className="text-[var(--muted-foreground)]">—</span>} />
                          <Stat label="Safety Stock" value={item.safety_stock > 0 ? `${item.safety_stock} ${item.stock_uom}` : <span className="text-[var(--muted-foreground)]">—</span>} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Flags */}
                  {!isEditing && (
                    <div className="px-5 py-4 border-b border-[var(--border)]">
                      <SectionLabel>Flags</SectionLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Has Variants', key: 'has_variants' },
                          { label: 'Fixed Asset', key: 'is_fixed_asset' },
                          { label: 'Allow Alt Item', key: 'allow_alternative_item' },
                          { label: 'Is Sales Item', key: 'is_sales_item' },
                          { label: 'Is Purchase Item', key: 'is_purchase_item' },
                          { label: 'Is Sub-contracted', key: 'is_sub_contracted_item' },
                        ].map(({ label, key }) => (
                          <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${(item as any)[key] ? 'bg-[var(--primary)]/5 border border-[var(--primary)]/20' : 'bg-[var(--secondary)] border border-[var(--border)]'}`}>
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${(item as any)[key] ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                            <span className={`font-secondary text-[0.7rem] leading-tight ${(item as any)[key] ? 'text-[var(--foreground)] font-semibold' : 'text-[var(--muted-foreground)]'}`}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {(item as any).description && !isEditing && (
                    <div className="p-5 border-b border-[var(--border)]">
                      <SectionLabel>Description</SectionLabel>
                      <div
                        className="font-secondary text-sm text-[var(--muted-foreground)] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: (item as any).description }}
                      />
                    </div>
                  )}

                  {/* Over billing/delivery allowances */}
                  <div className="p-5">
                    <SectionLabel>Allowances</SectionLabel>
                    <div className="grid grid-cols-2 gap-4">
                      <Stat label="Over Delivery Allowance (%)" mono value={(item as any).over_delivery_receipt_allowance ?? '0.000'} />
                      <Stat label="Over Billing Allowance (%)" mono value={(item as any).over_billing_allowance ?? '0.000'} />
                    </div>
                  </div>
                </>
              )}

              {/* ── STOCK TAB ── */}
              {tab === 'stock' && (
                <div className="p-5">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: 'Total Actual', value: totalStock, uom: item.stock_uom },
                      { label: 'Reserved', value: totalReserved, uom: item.stock_uom },
                      { label: 'Available', value: totalStock - totalReserved, uom: item.stock_uom, highlight: true },
                    ].map(({ label, value, uom, highlight }) => (
                      <div key={label} className={`p-3 rounded-xl border ${highlight ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5' : 'border-[var(--border)] bg-[var(--secondary)]'}`}>
                        <div className="font-primary text-[0.55rem] font-medium text-[var(--muted-foreground)] tracking-widest uppercase mb-1">{label}</div>
                        <div className={`font-primary text-lg font-bold ${value <= 0 ? 'text-red-500' : highlight ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>{value}</div>
                        <div className="font-secondary text-[0.6rem] text-[var(--muted-foreground)]">{uom}</div>
                      </div>
                    ))}
                  </div>

                  <SectionLabel>
                    Stock by Warehouse
                    {stockLoading && <RefreshCw size={11} className="animate-spin inline-block ml-2 text-[var(--muted-foreground)]" />}
                  </SectionLabel>

                  {stockRows.length === 0 ? (
                    <div className="flex items-center gap-2 py-6 text-[var(--muted-foreground)] justify-center">
                      <AlertTriangle size={16} />
                      <span className="font-secondary text-sm">No stock records found</span>
                    </div>
                  ) : (
                    stockRows.map((sl, i) => <StockRow key={i} sl={sl} />)
                  )}
                </div>
              )}

              {/* ── PURCHASING TAB ── */}
              {tab === 'purchasing' && (
                <div className="p-5">
                  <SectionLabel>Purchasing Details</SectionLabel>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <Stat label="Is Purchase Item" value={(item as any).is_purchase_item ? <span className="flex items-center gap-1 text-[var(--color-success-foreground)]"><CheckCircle2 size={13} /> Yes</span> : <span className="text-[var(--muted-foreground)]">No</span>} />
                    <Stat label="Is Sub-contracted" value={(item as any).is_sub_contracted_item ? <span className="flex items-center gap-1 text-[var(--color-success-foreground)]"><CheckCircle2 size={13} /> Yes</span> : <span className="text-[var(--muted-foreground)]">No</span>} />
                    <Stat label="Lead Time (days)" mono value={(item as any).lead_time_days ?? '—'} />
                    <Stat label="Min Order Qty" mono value={(item as any).min_order_qty ?? '—'} />
                    <Stat label="Last Purchase Rate" mono value={(item as any).last_purchase_rate ? fmtETB((item as any).last_purchase_rate) : <span className="text-[var(--muted-foreground)]">—</span>} />
                    <Stat label="Country of Origin" value={(item as any).country_of_origin ?? <span className="text-[var(--muted-foreground)]">—</span>} />
                  </div>

                  <SectionLabel>Supplier Info</SectionLabel>
                  <div className="bg-[var(--secondary)] rounded-xl border border-[var(--border)] p-4">
                    {(item as any).supplier_items?.length ? (
                      (item as any).supplier_items.map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                          <div>
                            <div className="font-secondary text-sm font-medium text-[var(--foreground)]">{s.supplier}</div>
                            <div className="font-secondary text-xs text-[var(--muted-foreground)]">{s.supplier_part_no || 'No part no.'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-primary text-sm font-semibold text-[var(--foreground)]">{s.supplier_name}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 py-3 text-[var(--muted-foreground)]">
                        <ShoppingCart size={14} />
                        <span className="font-secondary text-sm">No supplier records linked</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)] font-secondary text-sm">
              Item not found
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--background)]/50">
          <span className="font-secondary text-[13px] text-[var(--muted-foreground)]">
            {item ? `Modified ${(item as any).modified?.split(' ')[0] ?? '—'} · Created By ${(item as any).owner ?? '—'}` : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-[13px] font-secondary font-medium px-4 py-1.5 rounded-md bg-[#333333] text-white border border-transparent cursor-pointer hover:bg-[#404040] transition-colors"
            >
              Close
            </button>
            <a
              href={`http://localhost:8081/app/item/${itemName}`}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-secondary font-semibold px-4 py-1.5 rounded-md bg-[#ff8a00] text-black cursor-pointer hover:bg-[#e67a00] transition-colors no-underline flex items-center gap-1.5"
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
