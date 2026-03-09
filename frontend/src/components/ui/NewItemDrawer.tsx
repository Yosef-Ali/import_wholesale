import { useEffect, useState } from 'react';
import { X, Package, Save, ExternalLink, Loader2 } from 'lucide-react';
import { useCreateItem, useItemGroups } from '../../api/hooks/useItems';
import { erpnextUrl } from '../../utils/format';
import { drawerInputClass as inputClass, drawerLabelClass as labelClass } from '../../utils/styles';
import { toast } from '../../stores/toastStore';

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

export default function NewItemDrawer({ onClose }: Props) {
  const createItem = useCreateItem();
  const { data: itemGroups } = useItemGroups();

  const [form, setForm] = useState({
    item_code: '',
    item_name: '',
    item_group: '',
    stock_uom: 'Nos',
    opening_stock: 0,
    valuation_rate: 0,
    standard_rate: 0,
    disabled: 0,
    allow_alternative_item: 0,
    is_stock_item: 1,
    has_variants: 0,
    is_fixed_asset: 0,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = () => {
    if (!form.item_code || !form.item_group || !form.stock_uom) {
      toast.error('Item Code, Item Group, and Default UOM are required');
      return;
    }
    createItem.mutate(form, {
      onSuccess: () => onClose(),
      onError: (err: any) => toast.error(err.message || 'Failed to create item'),
    });
  };

  const CheckboxField = ({ field, label, hint }: { field: keyof typeof form; label: string; hint?: string }) => (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
          form[field] ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)] bg-[var(--background)] group-hover:border-[var(--primary)]/50'
        }`}
        onClick={() => setForm(p => ({ ...p, [field]: p[field] ? 0 : 1 }))}
      >
        {form[field] ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : null}
      </div>
      <input type="checkbox" className="sr-only" checked={!!form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.checked ? 1 : 0 }))} />
      <div>
        <span className="font-secondary text-sm text-[var(--foreground)]">{label}</span>
        {hint && <p className="font-secondary text-[0.7rem] text-[var(--muted-foreground)] leading-tight mt-0.5">{hint}</p>}
      </div>
    </label>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-sm">
              <Package size={20} />
            </div>
            <div>
              <h2 className="font-primary text-xl font-bold text-[var(--foreground)] leading-tight">New Item</h2>
              <p className="font-secondary text-xs text-[var(--muted-foreground)] mt-0.5">Create a new inventory item</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">

            <SectionDivider>Item Details</SectionDivider>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Item Code <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input type="text" className={inputClass} value={form.item_code} onChange={e => setForm(p => ({ ...p, item_code: e.target.value }))} autoFocus placeholder="e.g. ITEM-0001" />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Item Name</label>
                <input type="text" className={inputClass} value={form.item_name} onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))} placeholder="Descriptive display name" />
              </div>
              <div>
                <label className={labelClass}>Item Group <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <select className={inputClass} value={form.item_group} onChange={e => setForm(p => ({ ...p, item_group: e.target.value }))}>
                  <option value="">Select a group…</option>
                  {(itemGroups || []).map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Unit of Measure <span className="text-red-500 normal-case tracking-normal">*</span></label>
                <input type="text" className={inputClass} value={form.stock_uom} onChange={e => setForm(p => ({ ...p, stock_uom: e.target.value }))} />
              </div>
            </div>

            <SectionDivider>Pricing & Stock</SectionDivider>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Opening Stock</label>
                <input type="number" className={inputClass} value={form.opening_stock || ''} onChange={e => setForm(p => ({ ...p, opening_stock: parseFloat(e.target.value) || 0 }))} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Valuation Rate (ETB)</label>
                <input type="number" className={inputClass} value={form.valuation_rate || ''} onChange={e => setForm(p => ({ ...p, valuation_rate: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Standard Selling Rate (ETB)</label>
                <input type="number" className={inputClass} value={form.standard_rate || ''} onChange={e => setForm(p => ({ ...p, standard_rate: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
              </div>
            </div>

            <SectionDivider>Item Flags</SectionDivider>
            <div className="space-y-4">
              <CheckboxField field="is_stock_item" label="Maintain Stock" />
              <CheckboxField field="has_variants" label="Has Variants" hint="If this item has variants, it cannot be selected in sales orders etc." />
              <CheckboxField field="allow_alternative_item" label="Allow Alternative Item" />
              <CheckboxField field="is_fixed_asset" label="Is Fixed Asset" />
              <CheckboxField field="disabled" label="Disabled" />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--background)]/40">
          <a
            href={erpnextUrl(`/app/item/new-item-1`)}
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
              onClick={handleSave} disabled={createItem.isPending}
              className="text-sm font-secondary font-semibold px-5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              {createItem.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Item
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
