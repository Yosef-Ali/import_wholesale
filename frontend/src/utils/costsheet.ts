// Client-side mirror of the backend compute_costsheet() engine.
// Gives instant allocation preview as the user types; the server recomputes on save,
// so this is display-only and must stay in sync with import_shipment.py.
import type { ImportChargeLine, ImportItemAllocation } from '../api/types';

const COST_BASIS = 'Cost Basis';
const DEDUCTION = 'Deduction';

export interface CostSheetResult {
  costBasis: number;
  fob: number;
  sumCharges: number;
  customsTotal: number;
  etbTotal: number;
  vatRebate: number;
  withholdingPayable: number;
  cvdAmount: number;
  gitAmount: number;
  supplierPayable: number;
  purchaseTotal: number;
  allocation: Array<ImportItemAllocation & { landed_unit_cost: number; landed_total: number }>;
}

const n = (v: unknown): number => (typeof v === 'number' ? v : parseFloat(String(v ?? 0))) || 0;

export function computeCostsheet(
  charges: ImportChargeLine[] = [],
  items: ImportItemAllocation[] = [],
  dvpValue = 0,
  allocMethod = 'Allocation Basis',
): CostSheetResult {
  const costBasis = charges
    .filter((c) => c.charge_group === COST_BASIS)
    .reduce((s, c) => s + n(c.etb_amount), 0);

  let fob = charges.filter((c) => c.is_fob).reduce((s, c) => s + n(c.etb_amount), 0);
  if (!fob) fob = n(charges.find((c) => c.charge_group === COST_BASIS)?.etb_amount);

  const sumCharges = charges
    .filter((c) => c.charge_group !== COST_BASIS && c.charge_group !== DEDUCTION)
    .reduce((s, c) => s + n(c.etb_amount), 0);

  const deductions = charges
    .filter((c) => c.charge_group === DEDUCTION || c.recoverable)
    .reduce((s, c) => s + n(c.etb_amount), 0);
  const vatRebate = charges
    .filter((c) => c.recoverable && (c.description || '').toLowerCase().includes('vat'))
    .reduce((s, c) => s + n(c.etb_amount), 0);
  const withholdingPayable = charges
    .filter((c) => c.recoverable && (c.description || '').toLowerCase().includes('withhold'))
    .reduce((s, c) => s + n(c.etb_amount), 0);

  const dvp = n(dvpValue) || costBasis;
  const etbTotal = costBasis + sumCharges - deductions;
  const customsTotal = dvp + sumCharges - deductions;
  const cvdAmount = dvp - costBasis;
  const purchaseTotal = customsTotal;
  const supplierPayable = fob;
  const gitAmount = purchaseTotal - supplierPayable - cvdAmount;

  const weights = items.map((i) =>
    allocMethod === 'By Qty' ? n(i.qty) : n(i.weight_basis),
  );
  const totalWeight = weights.reduce((s, w) => s + w, 0) || 1;

  const allocation = items.map((i, idx) => {
    const share = purchaseTotal * (weights[idx] / totalWeight);
    const qty = n(i.qty) || 1;
    return {
      ...i,
      landed_total: Math.round(share * 100) / 100,
      landed_unit_cost: Math.round((share / qty) * 100) / 100,
    };
  });

  return {
    costBasis, fob, sumCharges, customsTotal, etbTotal, vatRebate, withholdingPayable,
    cvdAmount, gitAmount, supplierPayable, purchaseTotal, allocation,
  };
}

// House-standard charge ledger (mirror of STANDARD_CHARGE_TEMPLATE in the backend).
export const STANDARD_CHARGE_TEMPLATE: ImportChargeLine[] = [
  { sn: 1, description: 'Invoice Price (FOB)', charge_group: 'Cost Basis', is_fob: 1, capitalize: 1, distribute: 1 },
  { sn: 3, description: 'Insurance', charge_group: 'Cost Basis', capitalize: 1, distribute: 1 },
  { sn: 7, description: 'Sea Freight Charge', charge_group: 'Cost Basis', capitalize: 1, distribute: 1 },
  { sn: 8, description: 'Port Clearance charges (Djibouti)', charge_group: 'Cost Basis', capitalize: 1, distribute: 1 },
  { sn: 4, description: 'Service Charge On Opening CAD', charge_group: 'Bank', capitalize: 1, distribute: 1 },
  { sn: 5, description: 'Postage/Swift charges/exchange', charge_group: 'Bank', capitalize: 1, distribute: 1 },
  { sn: 9, description: 'Bank Service Charge on Freight & Port', charge_group: 'Bank', capitalize: 1, distribute: 1 },
  { sn: 10, description: 'Transportation Cost From Djibouti to Modjo', charge_group: 'Freight & Logistics', capitalize: 1, distribute: 1 },
  { sn: 11, description: 'Customs Duty Tax (15%/35%)', charge_group: 'Duty & Tax', capitalize: 1, distribute: 1 },
  { sn: 12, description: 'Sur tax', charge_group: 'Duty & Tax', capitalize: 1, distribute: 1 },
  { sn: 13, description: 'Social Welfare Tax (3%)', charge_group: 'Duty & Tax', capitalize: 1, distribute: 1 },
  { sn: 14, description: 'Scanning Fee (7%)', charge_group: 'Duty & Tax', capitalize: 1, distribute: 1 },
  { sn: 15, description: 'Other', charge_group: 'Other', capitalize: 1, distribute: 1 },
  { sn: 16, description: 'Vat Receivable', charge_group: 'Duty & Tax', capitalize: 1, distribute: 1 },
  { sn: 17, description: 'Withholding On Customs', charge_group: 'Duty & Tax', capitalize: 1, distribute: 1 },
  { sn: 18, description: 'ESLSE Modjo Port/Terminal service', charge_group: 'Handling', capitalize: 1, distribute: 1 },
  { sn: 19, description: 'Transit Cost', charge_group: 'Freight & Logistics', capitalize: 1, distribute: 1 },
  { sn: 20, description: 'Container Unstuffing', charge_group: 'Handling', capitalize: 1, distribute: 1 },
  { sn: 21, description: 'Transportation Cost From Modjo to warehouse', charge_group: 'Freight & Logistics', capitalize: 1, distribute: 1 },
  { sn: 22, description: 'Demurrage', charge_group: 'Handling', capitalize: 1, distribute: 1 },
  { sn: 23, description: 'Bank CPO charges', charge_group: 'Bank', capitalize: 1, distribute: 1 },
  { sn: 25, description: 'Less:-Vat Rebate', charge_group: 'Deduction', recoverable: 1, capitalize: 0, distribute: 0 },
  { sn: 26, description: 'Less:-Withholding Payable', charge_group: 'Deduction', recoverable: 1, capitalize: 0, distribute: 0 },
];

export const CHARGE_GROUPS = ['Cost Basis', 'Freight & Logistics', 'Duty & Tax', 'Handling', 'Bank', 'Deduction', 'Other'];
