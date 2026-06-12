import { useMemo } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { fmtETB } from '../../utils/format';
import {
  computeCostsheet, STANDARD_CHARGE_TEMPLATE, CHARGE_GROUPS,
} from '../../utils/costsheet';
import type { ImportChargeLine, ImportItemAllocation } from '../../api/types';

interface Props {
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
}

const cellInput =
  'w-full bg-transparent text-xs px-1.5 py-1 rounded border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none';

/** Editable customs cost-sheet form: declaration header, charge ledger, item lines,
 *  with a live allocation preview that mirrors the backend engine. */
export default function CostSheetEditor({ form, setForm }: Props) {
  const charges: ImportChargeLine[] = form.charges || [];
  const items: ImportItemAllocation[] = form.item_allocation || [];

  const preview = useMemo(
    () => computeCostsheet(charges, items, form.dvp_value, form.alloc_method),
    [charges, items, form.dvp_value, form.alloc_method],
  );

  const setCharge = (i: number, patch: Partial<ImportChargeLine>) => {
    const next = charges.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    setForm({ ...form, charges: next });
  };
  const addCharge = () =>
    setForm({ ...form, charges: [...charges, { description: '', charge_group: 'Freight & Logistics', capitalize: 1, distribute: 1 }] });
  const delCharge = (i: number) =>
    setForm({ ...form, charges: charges.filter((_, idx) => idx !== i) });
  const loadTemplate = () =>
    setForm({ ...form, charges: STANDARD_CHARGE_TEMPLATE.map((c) => ({ ...c })) });

  const setItem = (i: number, patch: Partial<ImportItemAllocation>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    setForm({ ...form, item_allocation: next });
  };
  const addItem = () =>
    setForm({ ...form, item_allocation: [...items, { item_code: '', description: '', qty: 0, weight_basis: 0 }] });
  const delItem = (i: number) =>
    setForm({ ...form, item_allocation: items.filter((_, idx) => idx !== i) });

  const num = (v: any) => (v === '' || v == null ? undefined : parseFloat(v));

  return (
    <div className="space-y-5">
      {/* Declaration header */}
      <div className="grid grid-cols-2 gap-3">
        {[
          ['tax_payer', 'Tax Payer'], ['tin_number', 'TIN'],
          ['declaration_number', 'Declaration No.'], ['bank_permit_number', 'Bank Permit'],
          ['commercial_invoice_no', 'Commercial Invoice'], ['bl_number', 'Bill of Lading'],
        ].map(([k, label]) => (
          <label key={k} className="block">
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</span>
            <input className={cellInput + ' border-[var(--border)] mt-1'} value={form[k] || ''}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </label>
        ))}
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">FCY Rate</span>
          <input type="number" className={cellInput + ' border-[var(--border)] mt-1'} value={form.fcy_rate ?? ''}
            onChange={(e) => setForm({ ...form, fcy_rate: num(e.target.value) })} />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Customs Base Value (DVP)</span>
          <input type="number" className={cellInput + ' border-[var(--border)] mt-1'} value={form.dvp_value ?? ''}
            onChange={(e) => setForm({ ...form, dvp_value: num(e.target.value) })} />
        </label>
      </div>

      {/* Charge ledger */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Charge Ledger</h4>
          <div className="flex gap-2">
            <button type="button" onClick={loadTemplate}
              className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline">
              <Sparkles size={12} /> Load Standard Template
            </button>
            <button type="button" onClick={addCharge}
              className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline">
              <Plus size={12} /> Add Row
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[var(--secondary)] text-[var(--muted-foreground)]">
              <tr>
                <th className="text-left px-2 py-1.5 font-medium">Description</th>
                <th className="text-left px-2 py-1.5 font-medium w-28">Group</th>
                <th className="text-right px-2 py-1.5 font-medium w-28">Amount (ETB)</th>
                <th className="w-7"></th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c, i) => (
                <tr key={i} className="border-t border-[var(--border)]">
                  <td className="px-1 py-0.5">
                    <input className={cellInput} value={c.description || ''}
                      onChange={(e) => setCharge(i, { description: e.target.value })} />
                  </td>
                  <td className="px-1 py-0.5">
                    <select className={cellInput} value={c.charge_group || ''}
                      onChange={(e) => setCharge(i, { charge_group: e.target.value })}>
                      {CHARGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="number" className={cellInput + ' text-right font-mono'} value={c.etb_amount ?? ''}
                      onChange={(e) => setCharge(i, { etb_amount: num(e.target.value) })} />
                  </td>
                  <td className="text-center">
                    <button type="button" onClick={() => delCharge(i)} className="text-[var(--muted-foreground)] hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {charges.length === 0 && (
                <tr><td colSpan={4} className="text-center text-[var(--muted-foreground)] py-3 text-xs">
                  No charges — load the standard template or add a row.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item lines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Item Lines</h4>
          <button type="button" onClick={addItem}
            className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline">
            <Plus size={12} /> Add Item
          </button>
        </div>
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[var(--secondary)] text-[var(--muted-foreground)]">
              <tr>
                <th className="text-left px-2 py-1.5 font-medium">Item Code</th>
                <th className="text-left px-2 py-1.5 font-medium">Description</th>
                <th className="text-right px-2 py-1.5 font-medium w-16">Qty</th>
                <th className="text-right px-2 py-1.5 font-medium w-28">FOB Value (basis)</th>
                <th className="text-right px-2 py-1.5 font-medium w-24 bg-[var(--primary)]/5">Unit Cost</th>
                <th className="w-7"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t border-[var(--border)]">
                  <td className="px-1 py-0.5"><input className={cellInput} value={it.item_code || ''}
                    onChange={(e) => setItem(i, { item_code: e.target.value })} /></td>
                  <td className="px-1 py-0.5"><input className={cellInput} value={it.description || ''}
                    onChange={(e) => setItem(i, { description: e.target.value })} /></td>
                  <td className="px-1 py-0.5"><input type="number" className={cellInput + ' text-right font-mono'} value={it.qty ?? ''}
                    onChange={(e) => setItem(i, { qty: num(e.target.value) })} /></td>
                  <td className="px-1 py-0.5"><input type="number" className={cellInput + ' text-right font-mono'} value={it.weight_basis ?? ''}
                    onChange={(e) => setItem(i, { weight_basis: num(e.target.value) })} /></td>
                  <td className="px-2 py-0.5 text-right font-mono text-[var(--primary)]">
                    {fmtETB(preview.allocation[i]?.landed_unit_cost || 0)}
                  </td>
                  <td className="text-center">
                    <button type="button" onClick={() => delItem(i)} className="text-[var(--muted-foreground)] hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="text-center text-[var(--muted-foreground)] py-3 text-xs">
                  No items — add the goods being imported. Unit cost fills automatically.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)] mt-1.5">
          Allocation basis: enter each item's FOB value (qty × unit price). The landed cost is split by this weight.
        </p>
      </div>

      {/* Live totals preview */}
      <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        {[
          ['Purchase / Inventory (5200)', preview.purchaseTotal, true],
          ['Supplier Payable (1440)', preview.supplierPayable],
          ['Goods In Transit (1420)', preview.gitAmount],
          ['CVD / Variance (2400)', preview.cvdAmount],
          ['Customs Total', preview.customsTotal],
          ['ETB Total', preview.etbTotal],
        ].map(([label, val, bold]) => (
          <div key={label as string} className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">{label as string}</span>
            <span className={`font-mono ${bold ? 'font-bold text-[var(--primary)]' : ''}`}>{fmtETB(val as number)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
