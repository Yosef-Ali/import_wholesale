import { useEffect, useState } from 'react';
import {
  X, Package, ExternalLink, Warehouse, Tag, Scale,
  AlertTriangle, CheckCircle2, RefreshCw, Printer,
  Edit2, TrendingUp, ShoppingCart, BarChart2, Trash2, Check, Loader2, Upload, Plus,
} from 'lucide-react';
import { useItemDetail, useItemStock, useUpdateItem, useDeleteItem, useUploadItemImage } from '../../api/hooks/useItems';
import { fmtETB, erpnextUrl } from '../../utils/format';
import { drawerEditClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';
import { toast } from '../../stores/toastStore';
import type { Item, StockLevel } from '../../api/types';
import ConfirmDialog from './ConfirmDialog';

/* ─── Mini stat block ─── */
function Stat({ label, value, mono = false, wide = false }: { label: string; value: React.ReactNode; mono?: boolean; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors ${wide ? 'col-span-2' : ''}`}>
      <span className="font-primary text-[0.6rem] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{label}</span>
      <span className={`text-[0.9375rem] text-[var(--foreground)] ${mono ? 'font-mono font-semibold' : 'font-primary font-semibold'}`}>{value || '—'}</span>
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
      <div className="w-full h-1.5 bg-[var(--secondary)] rounded-full mb-2">
        <div className={`h-full rounded-full transition-all ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-[var(--primary)]'}`} style={{ width: `${barPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs font-primary text-[var(--muted-foreground)]">
        <span>Actual: <strong className="text-[var(--foreground)]">{qty}</strong></span>
        <span>Reserved: <strong className="text-[var(--foreground)]">{reserved}</strong></span>
        <span>Available: <strong className={available <= 0 ? 'text-red-500' : 'text-[var(--foreground)]'}>{available}</strong></span>
      </div>
    </div>
  );
}

/* ─── Section divider ─── */
function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="w-[3px] h-4 rounded-full bg-[var(--primary)] shrink-0" />
      <span className="font-primary text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{children}</span>
      <span className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

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
  const uploadImage = useUploadItemImage();

  const [tab, setTab] = useState<Tab>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Item>>({});

  useEffect(() => {
    if (item && !isEditing) {
      setEditForm({
        item_name: item.item_name,
        item_group: item.item_group,
        stock_uom: item.stock_uom,
        standard_rate: item.standard_rate,
        safety_stock: item.safety_stock,
        ...(({ is_stock_item: (item as any).is_stock_item, is_sales_item: (item as any).is_sales_item, is_purchase_item: (item as any).is_purchase_item }) as any),
      });
    }
  }, [item, isEditing]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditing) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, isEditing]);

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
          const lbl = qty <= 0 ? 'Out of Stock' : sl.is_low_stock ? 'Low Stock' : 'In Stock';
          return `<tr><td>${sl.warehouse}</td><td>${qty}</td><td>${res}</td><td>${qty - res}</td><td><span class="badge ${cls}">${lbl}</span></td></tr>`;
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
      onSuccess: () => { setIsEditing(false); toast.success('Item updated successfully'); },
      onError: (err: any) => toast.error(err.message || 'Failed to update item'),
    });
  };

  const handleFileUpload = (name: string, file: File) => {
    uploadImage.mutate({ itemName: name, file }, {
      onSuccess: () => toast.success('Image uploaded successfully'),
      onError: (err: any) => toast.error(err.message || 'Image upload failed'),
    });
  };

  const handleDelete = () => {
    if (!itemName) return;
    deleteItem.mutate(itemName, {
      onSuccess: () => { toast.success('Item deleted'); onClose(); setShowConfirm(false); },
      onError: (err: any) => { toast.error(err.message || 'Failed to delete item'); setShowConfirm(false); },
    });
  };

  const TABS = [
    { id: 'details' as Tab, icon: Package, label: 'Details' },
    { id: 'stock' as Tab, icon: BarChart2, label: 'Stock' },
    { id: 'purchasing' as Tab, icon: ShoppingCart, label: 'Purchasing' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-sm shrink-0">
              <Package size={20} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-5 w-40 bg-[var(--secondary)] rounded animate-pulse mb-1" />
              ) : (
                <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight truncate">{item?.item_name ?? itemName}</h2>
              )}
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">{item?.item_code ?? 'Inventory Item'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!isEditing ? (
              <>
                <button onClick={() => { setTab('details'); setIsEditing(true); }} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors" title="Edit"><Edit2 size={15} /></button>
                <button onClick={() => setShowConfirm(true)} disabled={deleteItem.isPending || !item} className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40" title="Delete">
                  {deleteItem.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
                <button onClick={handlePrint} disabled={!item} className="p-2 text-[var(--muted-foreground)] hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-40" title="Print"><Printer size={15} /></button>
                <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors ml-1"><X size={16} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors"><X size={16} /></button>
                <button onClick={handleSave} disabled={updateItem.isPending} className="px-4 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                  {updateItem.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-6 border-b border-[var(--border)] shrink-0">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-secondary font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                tab === id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-16 bg-[var(--secondary)] rounded-xl animate-pulse ${i === 0 ? 'col-span-2' : ''}`} />
              ))}
            </div>
          ) : item ? (
            <>
              {/* DETAILS TAB */}
              {tab === 'details' && (
                <>
                  {/* Hero */}
                  <div className="p-5 border-b border-[var(--border)]">
                    <div className="flex items-start gap-4">
                      <div className="relative group/upload shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image as string} 
                            alt="" 
                            className="w-24 h-24 rounded-xl object-cover bg-[var(--secondary)]" 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} 
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-[var(--secondary)] flex items-center justify-center">
                            <Package size={36} className="text-[var(--muted-foreground)] group-hover/upload:opacity-0" />
                          </div>
                        )}
                        <label 
                          className={`absolute inset-0 flex items-center justify-center cursor-pointer rounded-xl transition-all
                            ${item.image ? 'bg-black/40 opacity-0 group-hover/upload:opacity-100' : 'hover:border-2 hover:border-[var(--muted-foreground)] border border-dashed border-transparent'}
                          `}
                          title="Upload Image"
                        >
                          {uploadImage.isPending && uploadImage.variables?.itemName === item.name ? (
                            <Loader2 size={30} className={`animate-spin ${item.image ? 'text-white' : 'text-[var(--muted-foreground)]'}`} />
                          ) : (
                            <div className={`opacity-0 group-hover/upload:opacity-100 transition-opacity flex flex-col items-center gap-1 ${item.image ? 'text-white' : 'text-[var(--primary)]'}`}>
                              <Upload size={item.image ? 24 : 36} />
                              {item.image && <span className="text-xs font-semibold">Replace</span>}
                            </div>
                          )}
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && item.name) handleFileUpload(item.name, file);
                            }}
                          />
                        </label>
                        {!item.image && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center border-2 border-[var(--card)] shadow-sm pointer-events-none">
                            <Plus size={12} className="text-[var(--primary-foreground)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input type="text" className={inputClass + ' font-secondary text-xl font-bold mb-1.5'} value={editForm.item_name || ''} onChange={e => setEditForm(p => ({ ...p, item_name: e.target.value }))} />
                        ) : (
                          <h2 className="font-secondary text-xl font-bold text-[var(--foreground)] m-0 mb-1.5 leading-tight">{item.item_name}</h2>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-primary text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded">{item.item_code}</span>
                          <span className={`font-secondary text-xs font-semibold px-2 py-0.5 rounded-full ${(item as any).disabled ? 'bg-red-500/10 text-red-500' : 'bg-[var(--color-success)]/60 text-[var(--color-success-foreground)]'}`}>
                            {(item as any).disabled ? 'Disabled' : 'Enabled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-secondary text-[var(--muted-foreground)]">
                          <TrendingUp size={12} className={totalStock > 0 ? 'text-[var(--color-success-foreground)]' : 'text-red-400'} />
                          <span>Total stock: <strong className="text-[var(--foreground)]">{totalStock} {item.stock_uom}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Details */}
                  <div className="p-5 border-b border-[var(--border)]">
                    <SectionDivider>Core Details</SectionDivider>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {isEditing ? (
                        <>
                          <div>
                            <span className={labelClass}>Item Group</span>
                            <input className={inputClass} value={editForm.item_group || ''} onChange={e => setEditForm(p => ({ ...p, item_group: e.target.value }))} />
                          </div>
                          <div>
                            <span className={labelClass}>UOM (Stock)</span>
                            <input className={inputClass} value={editForm.stock_uom || ''} onChange={e => setEditForm(p => ({ ...p, stock_uom: e.target.value }))} />
                          </div>
                          <div>
                            <span className={labelClass}>Standard Rate (ETB)</span>
                            <input type="number" className={inputClass} value={editForm.standard_rate || 0} onChange={e => setEditForm(p => ({ ...p, standard_rate: parseFloat(e.target.value) }))} />
                          </div>
                          <div>
                            <span className={labelClass}>Safety Stock</span>
                            <input type="number" className={inputClass} value={editForm.safety_stock || 0} onChange={e => setEditForm(p => ({ ...p, safety_stock: parseFloat(e.target.value) }))} />
                          </div>
                        </>
                      ) : (
                        <>
                          <Stat label="Item Group" value={<span className="flex items-center gap-1.5"><Tag size={12} className="text-[var(--muted-foreground)]" />{item.item_group}</span>} />
                          <Stat label="Unit of Measure" value={<span className="flex items-center gap-1.5"><Scale size={12} className="text-[var(--muted-foreground)]" />{item.stock_uom}</span>} />
                          <Stat label="Maintain Stock" value={(item as any).is_stock_item ? <span className="flex items-center gap-1 text-[var(--color-success-foreground)]"><CheckCircle2 size={13} /> Yes</span> : <span className="flex items-center gap-1 text-[var(--muted-foreground)]"><X size={13} /> No</span>} />
                          <Stat label="Standard Rate" mono value={item.standard_rate > 0 ? fmtETB(item.standard_rate) : '—'} />
                          <Stat label="Valuation Rate" mono value={(item as any).valuation_rate ? fmtETB((item as any).valuation_rate) : '—'} />
                          <Stat label="Safety Stock" value={item.safety_stock > 0 ? `${item.safety_stock} ${item.stock_uom}` : '—'} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Flags */}
                  {!isEditing && (
                    <div className="px-5 py-4 border-b border-[var(--border)]">
                      <SectionDivider>Flags</SectionDivider>
                      <div className="grid grid-cols-3 gap-3 mt-4">
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
                      <SectionDivider>Description</SectionDivider>
                      <div className="font-secondary text-sm text-[var(--muted-foreground)] leading-relaxed mt-4" dangerouslySetInnerHTML={{ __html: (item as any).description }} />
                    </div>
                  )}

                  {/* Allowances */}
                  <div className="p-5">
                    <SectionDivider>Allowances</SectionDivider>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Stat label="Over Delivery Allowance (%)" mono value={(item as any).over_delivery_receipt_allowance ?? '0.000'} />
                      <Stat label="Over Billing Allowance (%)" mono value={(item as any).over_billing_allowance ?? '0.000'} />
                    </div>
                  </div>
                </>
              )}

              {/* STOCK TAB */}
              {tab === 'stock' && (
                <div className="p-5">
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

                  <SectionDivider>
                    Stock by Warehouse {stockLoading && <RefreshCw size={11} className="animate-spin inline-block ml-2 text-[var(--muted-foreground)]" />}
                  </SectionDivider>

                  <div className="mt-4">
                    {stockRows.length === 0 ? (
                      <div className="flex items-center gap-2 py-6 text-[var(--muted-foreground)] justify-center">
                        <AlertTriangle size={16} />
                        <span className="font-secondary text-sm">No stock records found</span>
                      </div>
                    ) : (
                      stockRows.map((sl, i) => <StockRow key={i} sl={sl} />)
                    )}
                  </div>
                </div>
              )}

              {/* PURCHASING TAB */}
              {tab === 'purchasing' && (
                <div className="p-5">
                  <SectionDivider>Purchasing Details</SectionDivider>
                  <div className="grid grid-cols-2 gap-4 mt-4 mb-5">
                    <Stat label="Is Purchase Item" value={(item as any).is_purchase_item ? <span className="flex items-center gap-1 text-[var(--color-success-foreground)]"><CheckCircle2 size={13} /> Yes</span> : <span className="text-[var(--muted-foreground)]">No</span>} />
                    <Stat label="Is Sub-contracted" value={(item as any).is_sub_contracted_item ? <span className="flex items-center gap-1 text-[var(--color-success-foreground)]"><CheckCircle2 size={13} /> Yes</span> : <span className="text-[var(--muted-foreground)]">No</span>} />
                    <Stat label="Lead Time (days)" mono value={(item as any).lead_time_days ?? '—'} />
                    <Stat label="Min Order Qty" mono value={(item as any).min_order_qty ?? '—'} />
                    <Stat label="Last Purchase Rate" mono value={(item as any).last_purchase_rate ? fmtETB((item as any).last_purchase_rate) : '—'} />
                    <Stat label="Country of Origin" value={(item as any).country_of_origin ?? '—'} />
                  </div>

                  <SectionDivider>Supplier Info</SectionDivider>
                  <div className="bg-[var(--secondary)] rounded-xl border border-[var(--border)] p-4 mt-4">
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
            <div className="flex items-center justify-center h-full text-sm font-secondary text-[var(--muted-foreground)]">Item not found</div>
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
              href={erpnextUrl(`/app/item/${itemName}`)}
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
          title="Delete Item"
          message={`Are you sure you want to delete ${item?.item_name ?? itemName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleteItem.isPending}
        />
      )}
    </>
  );
}
