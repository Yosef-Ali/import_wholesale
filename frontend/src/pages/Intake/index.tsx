import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ClipboardCheck, Landmark, Ship as ShipIcon, Banknote, ShieldCheck,
  Plus, Trash2, Loader2, ArrowRight, CheckCircle2, PackageCheck,
} from 'lucide-react';
import { useExtractionSchema, useApplyIntake } from '../../api/hooks/useIntake';
import { computeCostsheet } from '../../utils/costsheet';
import { fmtETB } from '../../utils/format';
import { toast } from '../../stores/toastStore';
import type {
  ExtractionDocument, ImportChargeLine, ImportItemAllocation, IntakePayload,
} from '../../api/types';

// Paper-stack order and presentation for each source document. The fields/lines
// themselves come from the backend schema (field_map.json) — single source of truth.
const DOC_ORDER = [
  'commercial_invoice', 'packing_list', 'customs_declaration',
  'freight_invoice', 'clearing_agent_invoice', 'bank_advice', 'insurance_certificate',
] as const;

const DOC_ICONS: Record<string, typeof FileText> = {
  commercial_invoice: FileText,
  packing_list: PackageCheck,
  customs_declaration: Landmark,
  freight_invoice: ShipIcon,
  clearing_agent_invoice: ClipboardCheck,
  bank_advice: Banknote,
  insurance_certificate: ShieldCheck,
};

const HEADER_LABELS: Record<string, string> = {
  commercial_invoice_no: 'Commercial Invoice No.',
  supplier: 'Supplier / Exporter',
  invoice_value_fcy: 'Invoice Value (FCY)',
  origin_country: 'Country of Origin',
  declaration_number: 'Declaration No.',
  tin_number: 'TIN',
  tax_payer: 'Tax Payer',
  dvp_value: 'Customs Base Value (DVP, ETB)',
  bl_number: 'B/L Number',
  bank_permit_number: 'Bank Permit No.',
  fcy_rate: 'Exchange Rate (Permit)',
  shipment_title: 'Shipment Title',
};

const NUMERIC_HEADERS = new Set(['invoice_value_fcy', 'dvp_value', 'fcy_rate']);

interface ItemRow { item_code: string; description: string; qty: string; fob_unit_price: string }

const n = (v: string): number => parseFloat(v) || 0;

const inputCls =
  'w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-2.5 py-1.5 ' +
  'font-secondary text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors';
const numCls = inputCls + ' font-mono text-right';
const labelCls = 'block text-[10px] font-primary uppercase tracking-wider text-[var(--muted-foreground)] mb-1';

function WorkflowStrip() {
  const steps = ['Purchase Order', 'Document Intake', 'Cost Sheet Review', 'Submit → Landed Cost Voucher', 'Purchase Receipt'];
  return (
    <div className="flex items-center gap-2 flex-wrap px-6 pb-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className={`font-primary text-[0.65rem] uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              i === 1
                ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10 font-bold'
                : 'border-[var(--border)] text-[var(--muted-foreground)]'
            }`}
          >
            {s}
          </span>
          {i < steps.length - 1 && <ArrowRight size={12} className="text-[var(--muted-foreground)]" />}
        </div>
      ))}
    </div>
  );
}

export default function Intake() {
  const navigate = useNavigate();
  const { data: schema, isLoading } = useExtractionSchema();
  const applyIntake = useApplyIntake();

  const [header, setHeader] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({}); // charge description -> ETB
  const [items, setItems] = useState<ItemRow[]>([
    { item_code: '', description: '', qty: '', fob_unit_price: '' },
  ]);

  const docs = useMemo(() => {
    const list = schema?.documents ?? [];
    const byType = new Map(list.map((d) => [d.doc_type, d]));
    return DOC_ORDER.map((t) => byType.get(t)).filter(Boolean) as ExtractionDocument[];
  }, [schema]);

  // FOB in ETB is derived, not typed: invoice FCY total × bank-permit rate.
  const fobEtb = n(header.invoice_value_fcy) * n(header.fcy_rate);
  const vatAmount = n(amounts['Vat Receivable']);
  const whtAmount = n(amounts['Withholding On Customs']);

  // Build the full charge ledger the way the backend will see it.
  const charges: ImportChargeLine[] = useMemo(() => {
    const rows: ImportChargeLine[] = [];
    if (fobEtb > 0) {
      rows.push({ description: 'Invoice Price (FOB)', charge_group: 'Cost Basis', etb_amount: fobEtb, is_fob: 1 });
    }
    for (const d of docs) {
      for (const c of d.charge_lines ?? []) {
        const amt = n(amounts[c.description]);
        if (amt > 0) rows.push({ description: c.description, charge_group: c.charge_group, etb_amount: amt });
      }
    }
    // Recoverable taxes wash out of the landed cost as deduction mirrors.
    if (vatAmount > 0) rows.push({ description: 'Less:-Vat Rebate', charge_group: 'Deduction', etb_amount: vatAmount, recoverable: 1 });
    if (whtAmount > 0) rows.push({ description: 'Less:-Withholding Payable', charge_group: 'Deduction', etb_amount: whtAmount, recoverable: 1 });
    return rows;
  }, [docs, amounts, fobEtb, vatAmount, whtAmount]);

  const allocItems: ImportItemAllocation[] = useMemo(
    () =>
      items
        .filter((it) => it.description.trim() && n(it.qty) > 0)
        .map((it) => ({
          item_code: it.item_code || undefined,
          description: it.description,
          qty: n(it.qty),
          weight_basis: n(it.qty) * n(it.fob_unit_price),
        })),
    [items],
  );

  const preview = useMemo(
    () => computeCostsheet(charges, allocItems, n(header.dvp_value)),
    [charges, allocItems, header.dvp_value],
  );

  const setH = (k: string, v: string) => setHeader((p) => ({ ...p, [k]: v }));
  const setA = (k: string, v: string) => setAmounts((p) => ({ ...p, [k]: v }));
  const setItem = (i: number, k: keyof ItemRow, v: string) =>
    setItems((p) => p.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  function save() {
    if (!header.supplier?.trim()) { toast.error('Supplier (from the Commercial Invoice) is required'); return; }
    if (allocItems.length === 0) { toast.error('Add at least one item line with a quantity'); return; }

    const payload: IntakePayload = {
      header: Object.fromEntries(
        Object.entries(header)
          .filter(([, v]) => v !== '')
          .map(([k, v]) => [k, NUMERIC_HEADERS.has(k) ? n(v) : v]),
      ),
      charges: charges.map((c) => ({
        description: c.description!,
        charge_group: c.charge_group!,
        etb_amount: c.etb_amount!,
        is_fob: !!c.is_fob,
        recoverable: !!c.recoverable,
      })),
      items: items
        .filter((it) => it.description.trim() && n(it.qty) > 0)
        .map((it) => ({
          item_code: it.item_code || undefined,
          description: it.description,
          qty: n(it.qty),
          fob_unit_price: n(it.fob_unit_price) || undefined,
        })),
    };

    applyIntake.mutate(
      { payload },
      {
        onSuccess: (res) => {
          toast.success(`Shipment ${res.shipment} saved — review the cost sheet`);
          navigate(`/cost-sheet/${res.shipment}`);
        },
        onError: (err: Error) => toast.error(err.message || 'Failed to save intake'),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)]">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading document schema…
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">Shipment Intake</h1>
        <p className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)] mt-1 mb-0">
          Enter each hard-copy customs document in order — your final cost sheet is the check, not an input.
        </p>
      </div>
      <WorkflowStrip />

      <div className="flex flex-col xl:flex-row gap-4 px-6 pb-6 pt-2">
        {/* Document sections, paper order */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Shipment title (optional) */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <label className={labelCls}>{HEADER_LABELS.shipment_title} (optional)</label>
            <input className={inputCls} placeholder="e.g. Suqian Panda — PVC & Blockboard"
              value={header.shipment_title ?? ''} onChange={(e) => setH('shipment_title', e.target.value)} />
          </div>

          {docs.map((d, idx) => {
            const Icon = DOC_ICONS[d.doc_type] ?? FileText;
            const isInvoice = d.doc_type === 'commercial_invoice';
            const isPackingList = d.doc_type === 'packing_list';
            return (
              <section key={d.doc_type} className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                <header className="flex items-center gap-2.5 px-4 pt-3.5 pb-3 border-b border-[var(--border)]">
                  <span className="w-6 h-6 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <Icon size={15} className="text-[var(--primary)] shrink-0" />
                  <span className="font-primary text-[0.7rem] font-bold uppercase tracking-widest text-[var(--foreground)]">
                    {d.label}
                  </span>
                </header>

                <div className="p-4 flex flex-col gap-4">
                  {isPackingList ? (
                    <p className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)] m-0">
                      Cross-check only — confirm the quantities below match this document. Nothing to type.
                    </p>
                  ) : null}

                  {(d.header_fields?.length ?? 0) > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {d.header_fields!.map((f) => (
                        <label key={f.target} className="block">
                          <span className={labelCls}>{HEADER_LABELS[f.target] ?? f.target}</span>
                          <input
                            className={NUMERIC_HEADERS.has(f.target) ? numCls : inputCls}
                            type={NUMERIC_HEADERS.has(f.target) ? 'number' : 'text'}
                            placeholder={f.anchors?.length ? `printed as: ${f.anchors.slice(0, 3).join(' / ')}` : ''}
                            value={header[f.target] ?? ''}
                            onChange={(e) => setH(f.target, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {isInvoice && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={labelCls + ' mb-0'}>Item lines (description · qty · FOB unit price)</span>
                        <button
                          onClick={() => setItems((p) => [...p, { item_code: '', description: '', qty: '', fob_unit_price: '' }])}
                          className="flex items-center gap-1 font-secondary text-xs text-[var(--primary)] bg-transparent border-none cursor-pointer hover:opacity-80"
                        >
                          <Plus size={13} /> Add line
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {items.map((row, i) => (
                          <div key={i} className="grid grid-cols-[110px_1fr_80px_120px_28px] gap-2 items-center">
                            <input className={inputCls} placeholder="Item code" value={row.item_code}
                              onChange={(e) => setItem(i, 'item_code', e.target.value)} />
                            <input className={inputCls} placeholder="Description of goods" value={row.description}
                              onChange={(e) => setItem(i, 'description', e.target.value)} />
                            <input className={numCls} type="number" placeholder="Qty" value={row.qty}
                              onChange={(e) => setItem(i, 'qty', e.target.value)} />
                            <input className={numCls} type="number" placeholder="Unit price" value={row.fob_unit_price}
                              onChange={(e) => setItem(i, 'fob_unit_price', e.target.value)} />
                            <button
                              onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}
                              disabled={items.length === 1}
                              className="p-1 text-[var(--muted-foreground)] hover:text-red-500 bg-transparent border-none cursor-pointer disabled:opacity-30"
                              aria-label="Remove line"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(d.charge_lines?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-2">
                      {d.charge_lines!.map((c) => (
                        <div key={c.description} className="grid grid-cols-[1fr_150px] gap-2 items-center">
                          <span className="font-secondary text-[0.8125rem] text-[var(--foreground)]">
                            {c.description}
                            <span className="text-[var(--muted-foreground)] text-[0.7rem] ml-2">{c.charge_group}</span>
                          </span>
                          <input
                            className={numCls}
                            type="number"
                            placeholder="ETB 0"
                            value={amounts[c.description] ?? ''}
                            onChange={(e) => setA(c.description, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* Review panel — the customer's document 8 is the check */}
        <aside className="w-full xl:w-[340px] shrink-0">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] xl:sticky xl:top-4">
            <header className="px-4 pt-3.5 pb-3 border-b border-[var(--border)]">
              <span className="font-primary text-[0.7rem] font-bold uppercase tracking-widest text-[var(--foreground)]">
                8 · Check against your cost sheet
              </span>
            </header>
            <div className="p-4 flex flex-col gap-2 font-secondary text-sm">
              <Row label="Invoice Price (FOB, ETB)" value={fobEtb} hint="FCY × permit rate" />
              <Row label="ETB Total (actual cost)" value={preview.etbTotal} />
              <Row label="Customs Total (Purchase)" value={preview.purchaseTotal} strong />
              <div className="border-t border-[var(--border)] my-1" />
              <Row label="Supplier Payable" value={preview.supplierPayable} />
              <Row label="Goods in Transit (GIT)" value={preview.gitAmount} />
              <Row label="Customs Valuation Var. (CVD)" value={preview.cvdAmount} />
              <Row label="VAT Rebate (recoverable)" value={preview.vatRebate} />
              <Row label="Withholding Payable" value={preview.withholdingPayable} />

              <p className="text-[0.75rem] text-[var(--muted-foreground)] mt-2 mb-0">
                If <b>Customs Total</b> matches the bottom line of your hand-made cost sheet, the entry is correct.
                The server recomputes and stores these on save.
              </p>

              <button
                onClick={save}
                disabled={applyIntake.isPending}
                className="mt-3 flex items-center justify-center gap-2 w-full bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2.5 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {applyIntake.isPending
                  ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                  : <><CheckCircle2 size={15} /> Save & open Cost Sheet</>}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong, hint }: { label: string; value: number; strong?: boolean; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-[var(--muted-foreground)] ${strong ? 'font-semibold text-[var(--foreground)]' : ''}`}>
        {label}{hint && <span className="text-[0.7rem] ml-1.5 opacity-70">({hint})</span>}
      </span>
      <span className={`font-mono ${strong ? 'font-bold text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
        {fmtETB(value)}
      </span>
    </div>
  );
}
