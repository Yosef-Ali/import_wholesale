import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Printer, Download, FileText } from 'lucide-react';
import { useImportShipment, useImportShipments } from '../../api/hooks/useOrders';
import { computeCostsheet } from '../../utils/costsheet';
import { fmtETB, printViewUrl, pdfDownloadUrl } from '../../utils/format';
import type { ImportChargeLine, ImportItemAllocation } from '../../api/types';

/**
 * Read-only, print-clean customs cost sheet — "what the customer sees" for a shipment
 * (e.g. IMP-2025-00042). Reads the live Import Shipment from ERPNext; the server's stored
 * totals are authoritative, with the client engine mirror as a fallback for preview before
 * the doc has been recomputed/saved. Currency always via fmtETB; styled with design tokens.
 */
export default function CostSheetView({ name: nameProp }: { name?: string }) {
  const params = useParams();
  const explicit = nameProp || params.name || null;
  // No shipment specified (bare /cost-sheet) → show the most recent one.
  const { data: shipments, isLoading: listLoading } = useImportShipments();
  const name = explicit || shipments?.[0]?.name || null;

  const { data: doc, isLoading: docLoading } = useImportShipment(name);
  const isLoading = docLoading || (!explicit && listLoading);

  const charges: ImportChargeLine[] = doc?.charges || [];
  const items: ImportItemAllocation[] = doc?.item_allocation || [];

  // Engine mirror — used only to fill values the server hasn't persisted yet.
  // Depend on the stable doc fields (not the `|| []` locals) so the memo actually caches.
  const preview = useMemo(
    () => computeCostsheet(doc?.charges || [], doc?.item_allocation || [], doc?.dvp_value, doc?.alloc_method),
    [doc?.charges, doc?.item_allocation, doc?.dvp_value, doc?.alloc_method],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)]">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading cost sheet…
      </div>
    );
  }
  if (!doc) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)]">
        <FileText size={18} className="mr-2" />
        {name ? `Shipment ${name} not found.` : 'No import shipments yet — create one from Purchase Orders.'}
      </div>
    );
  }

  // Prefer server-stored totals; fall back to the computed mirror for unsaved previews.
  const num = (v: number | undefined, fallback: number) => (v ?? 0) || fallback;
  const purchaseTotal = num(doc.purchase_total, preview.purchaseTotal);
  const cvdAmount = num(doc.cvd_amount, preview.cvdAmount);
  const gitAmount = num(doc.git_amount, preview.gitAmount);
  const supplierPayable = num(doc.supplier_payable, preview.supplierPayable);
  const etbTotal = num(doc.etb_total, preview.etbTotal);
  const customsTotal = num(doc.customs_total, preview.customsTotal);
  // Prefer server-computed landed values; if absent (unsaved/dev), use the engine mirror.
  const allocation = items.some((i) => i.landed_total != null) ? items : preview.allocation;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action bar — hidden when printing */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div>
          <h1 className="font-primary text-lg font-semibold text-[var(--foreground)]">{doc.name}</h1>
          <p className="font-secondary text-sm text-[var(--muted-foreground)]">
            Import Cost Sheet · {doc.supplier_name || doc.supplier || '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={printViewUrl('Import Shipment', doc.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-secondary rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted,#F3F4F6)] transition-colors"
          >
            <Printer size={15} /> Print
          </a>
          <a
            href={pdfDownloadUrl('Import Shipment', doc.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-secondary rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <Download size={15} /> PDF
          </a>
        </div>
      </div>

      {/* Sheet */}
      <div className="bg-[var(--card,#FFFFFF)] border border-[var(--border)] rounded-lg p-6 shadow-sm">
        {/* Letterhead */}
        <div className="flex items-center justify-between border-b-2 border-[var(--primary)] pb-3 mb-4">
          <div>
            <div className="font-primary text-base font-bold text-[var(--foreground)]">BuildSupply Pro</div>
            <div className="font-secondary text-xs text-[var(--muted-foreground)]">Import &amp; Wholesale — Construction Materials</div>
          </div>
          <div className="text-right">
            <div className="font-primary text-sm font-bold text-[var(--primary)]">Import Cost Sheet</div>
            <div className="font-secondary text-xs text-[var(--muted-foreground)]">{doc.name}</div>
          </div>
        </div>

        {/* Customs declaration header */}
        <h2 className="font-secondary text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Customs Declaration</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-6 text-sm">
          <Field label="Name of Tax Payer" value={doc.tax_payer} strong />
          <Field label="Commercial Invoice" value={doc.commercial_invoice_no} />
          <Field label="TIN Number" value={doc.tin_number} />
          <Field label="Bill of Lading" value={doc.bl_number} />
          <Field label="Declaration Number" value={doc.declaration_number} />
          <Field label="FCY Rate" value={doc.fcy_rate ? String(doc.fcy_rate) : undefined} />
          <Field label="Bank Permit Number" value={doc.bank_permit_number} />
          <Field label="Invoice Value (FCY)" value={doc.invoice_value_fcy != null ? doc.invoice_value_fcy.toLocaleString(undefined, { minimumFractionDigits: 2 }) : undefined} mono />
          <Field label="Customs Base Value (DVP)" value={doc.dvp_value != null ? fmtETB(doc.dvp_value) : undefined} mono />
          <Field label="Country of Origin" value={doc.origin_country} />
        </div>

        {/* Customs charge ledger */}
        <h2 className="font-secondary text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Customs Charge Ledger</h2>
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="text-left font-secondary text-xs text-[var(--muted-foreground)] border-b border-[var(--border)]">
              <th className="py-1.5 w-10">s/n</th>
              <th className="py-1.5">Description</th>
              <th className="py-1.5 text-right w-40">Customs Invoice Price</th>
              <th className="py-1.5 text-right w-40">Amount in ETB</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((c, i) => (
              <tr
                key={c.name || i}
                className={`border-b border-[var(--border)] ${c.recoverable ? 'text-[var(--destructive,#DC2626)]' : 'text-[var(--foreground)]'}`}
              >
                <td className="py-1.5">{c.sn ?? i + 1}</td>
                <td className="py-1.5">{c.description}</td>
                <td className="py-1.5 text-right font-mono">{c.customs_amount ? fmtETB(c.customs_amount) : ''}</td>
                <td className="py-1.5 text-right font-mono">{c.etb_amount ? fmtETB(c.etb_amount) : ''}</td>
              </tr>
            ))}
            <tr className="font-semibold text-[var(--foreground)]">
              <td className="py-2"></td>
              <td className="py-2">Total</td>
              <td className="py-2 text-right font-mono">{fmtETB(customsTotal)}</td>
              <td className="py-2 text-right font-mono">{fmtETB(etbTotal)}</td>
            </tr>
            <tr className="text-[var(--muted-foreground)]">
              <td></td>
              <td className="py-1">Custom Valuation Variance (CVD)</td>
              <td className="py-1 text-right font-mono">{fmtETB(cvdAmount)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {/* GL distribution */}
        <h2 className="font-secondary text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">GL Distribution</h2>
        <table className="w-full text-sm mb-6">
          <tbody>
            <GLRow account="5200" label="PURCHASE" amount={purchaseTotal} strong />
            <GLRow account="2400" label="CVD" amount={cvdAmount} />
            <GLRow account="1420" label="GIT" amount={gitAmount} />
            <GLRow account="1440" label={doc.supplier_name || doc.supplier || 'SUPPLIER'} amount={supplierPayable} />
          </tbody>
        </table>

        {/* Item landed cost allocation */}
        <h2 className="font-secondary text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Item Landed Cost Allocation</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-secondary text-xs text-[var(--muted-foreground)] border-b border-[var(--border)]">
              <th className="py-1.5 w-20">Qty</th>
              <th className="py-1.5">Description</th>
              <th className="py-1.5 text-right w-40">Unit Cost</th>
              <th className="py-1.5 text-right w-40">Total</th>
            </tr>
          </thead>
          <tbody>
            {allocation.map((a, i) => (
              <tr key={a.name || i} className="border-b border-[var(--border)] text-[var(--foreground)]">
                <td className="py-1.5">{Math.round(a.qty || 0)}</td>
                <td className="py-1.5">{a.description || a.item_code}</td>
                <td className="py-1.5 text-right font-mono">{fmtETB(a.landed_unit_cost || 0)}</td>
                <td className="py-1.5 text-right font-mono">{fmtETB(a.landed_total || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value, strong, mono }: { label: string; value?: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--border)] py-1">
      <span className="font-secondary text-[var(--muted-foreground)]">{label}</span>
      <span className={`text-right text-[var(--foreground)] ${strong ? 'font-semibold' : ''} ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function GLRow({ account, label, amount, strong }: { account: string; label: string; amount: number; strong?: boolean }) {
  return (
    <tr className={`border-b border-[var(--border)] ${strong ? 'font-semibold' : ''} text-[var(--foreground)]`}>
      <td className="py-1.5 w-16 text-[var(--muted-foreground)] font-mono">{account}</td>
      <td className="py-1.5">{label}</td>
      <td className="py-1.5 text-right font-mono">{fmtETB(amount)}</td>
    </tr>
  );
}
