import { useEffect, useState } from 'react';
import { X, Package, Save, ExternalLink } from 'lucide-react';
import { useCreateItem, useItemGroups } from '../../api/hooks/useItems';

interface Props {
  onClose: () => void;
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

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = () => {
    if (!form.item_code || !form.item_group || !form.stock_uom) {
      alert('Please fill out all required fields: Item Code, Item Group, and Default UOM.');
      return;
    }
    createItem.mutate(form, {
      onSuccess: () => onClose(),
      onError: (err: any) => alert(err.message || 'Failed to create item'),
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-[600px] bg-[var(--card)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
              <Package size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <div className="font-primary text-[0.6875rem] font-medium text-[var(--muted-foreground)] tracking-widest uppercase mb-0.5">Inventory · Item</div>
              <div className="font-secondary text-sm font-bold text-[var(--foreground)]">New Item</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSave}
              disabled={createItem.isPending}
              className="flex items-center gap-1.5 text-xs font-secondary font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer border-none shadow-sm"
            >
              {createItem.isPending ? 'Saving...' : <><Save size={14} /> Save</>}
            </button>
            <button
              onClick={onClose}
              className="ml-1 p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              {/* Item Code */}
              <div className="flex flex-col gap-1.5">
                <label className="font-secondary text-xs font-medium text-[var(--foreground)]">
                  Item Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.item_code}
                  onChange={e => setForm(p => ({ ...p, item_code: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Item Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-secondary text-xs font-medium text-[var(--foreground)]">Item Name</label>
                <input
                  type="text"
                  className="input"
                  value={form.item_name}
                  onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))}
                />
              </div>

              {/* Item Group */}
              <div className="flex flex-col gap-1.5">
                <label className="font-secondary text-xs font-medium text-[var(--foreground)]">
                  Item Group <span className="text-red-500">*</span>
                </label>
                <select
                  className="input appearance-none"
                  value={form.item_group}
                  onChange={e => setForm(p => ({ ...p, item_group: e.target.value }))}
                >
                  <option value="">Select an Item Group...</option>
                  {(itemGroups || []).map(g => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Default Unit of Measure */}
              <div className="flex flex-col gap-1.5">
                <label className="font-secondary text-xs font-medium text-[var(--foreground)]">
                  Default Unit of Measure <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.stock_uom}
                  onChange={e => setForm(p => ({ ...p, stock_uom: e.target.value }))}
                />
              </div>

              {/* Opening Stock */}
              <div className="flex flex-col gap-1.5">
                <label className="font-secondary text-xs font-medium text-[var(--foreground)]">Opening Stock</label>
                <input
                  type="number"
                  className="input"
                  value={form.opening_stock || ''}
                  onChange={e => setForm(p => ({ ...p, opening_stock: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              {/* Valuation Rate */}
              <div className="flex flex-col gap-1.5">
                <label className="font-secondary text-xs font-medium text-[var(--foreground)]">Valuation Rate</label>
                <input
                  type="number"
                  className="input"
                  value={form.valuation_rate || ''}
                  onChange={e => setForm(p => ({ ...p, valuation_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              {/* Standard Selling Rate */}
              <div className="flex flex-col gap-1.5">
                <label className="font-secondary text-xs font-medium text-[var(--foreground)]">Standard Selling Rate</label>
                <input
                  type="number"
                  className="input"
                  value={form.standard_rate || ''}
                  onChange={e => setForm(p => ({ ...p, standard_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Right Column (Checkboxes) */}
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.disabled}
                  onChange={e => setForm(p => ({ ...p, disabled: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="font-secondary text-sm font-medium text-[var(--foreground)]">Disabled</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.allow_alternative_item}
                  onChange={e => setForm(p => ({ ...p, allow_alternative_item: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="font-secondary text-sm font-medium text-[var(--foreground)]">Allow Alternative Item</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={!!form.is_stock_item}
                  onChange={e => setForm(p => ({ ...p, is_stock_item: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="font-secondary text-sm font-medium text-[var(--foreground)]">Maintain Stock</span>
              </label>

              <div className="flex flex-col gap-1 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.has_variants}
                    onChange={e => setForm(p => ({ ...p, has_variants: e.target.checked ? 1 : 0 }))}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="font-secondary text-sm font-medium text-[var(--foreground)]">Has Variants</span>
                </label>
                <div className="pl-6 font-secondary text-[0.7rem] text-[var(--muted-foreground)] leading-tight">
                  If this item has variants, then it cannot be selected in sales orders etc.
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={!!form.is_fixed_asset}
                  onChange={e => setForm(p => ({ ...p, is_fixed_asset: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="font-secondary text-sm font-medium text-[var(--foreground)]">Is Fixed Asset</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--background)]/50">
          <span className="font-secondary text-[13px] text-[var(--muted-foreground)]">
            Create a new item in the system
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-[13px] font-secondary font-medium px-4 py-1.5 rounded-md bg-[#333333] text-white border border-transparent cursor-pointer hover:bg-[#404040] transition-colors"
            >
              Close
            </button>
            <a
              href="http://localhost:8081/app/item/new-item-1"
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
