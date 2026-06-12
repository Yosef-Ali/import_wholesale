---
name: landed-cost-sheet
description: Work on the Ethiopian import customs cost sheet and landed-cost allocation. Use when changing charge lines, the allocation math, GL distribution (Purchase/Supplier/GIT/CVD), or anything in import_shipment.py / costsheet.ts. Explains the model and the invariants that must not break.
---

# Import landed-cost sheet model

The customs cost sheet capitalizes all import costs onto item valuation and posts a 3-way GL
split. The math lives in two places that **must stay in sync**:

- Python engine (authoritative): `backend/buildsupply/import_tracking/doctype/import_shipment/import_shipment.py` → `compute_costsheet(data)`
- TS mirror (live UI preview): `frontend/src/utils/costsheet.ts` → `computeCostsheet(...)`

Change one → change the other in the same commit.

## The two columns

Each charge line has an **ETB amount** (real cost) and a **Customs Invoice Price**.
- **ETB cost basis** = FOB + insurance + sea freight + port clearance (the `Cost Basis` group).
- The customs column replaces that cost basis with **DVP** (customs-assessed value), then both
  columns add the same ordinary charges (duty, taxes, transport, handling, bank).
- Deductions (`Deduction` group / `recoverable`): VAT Rebate and Withholding Payable — entered
  but **excluded** from item valuation.

## Identities that must hold (regression-tested)

```
cost_basis      = Σ etb_amount where group == "Cost Basis"
fob (1440)      = Σ etb_amount where is_fob  (fallback: first Cost Basis line)
sum_charges     = Σ etb_amount where group not in {Cost Basis, Deduction}
deductions      = Σ etb_amount where group == Deduction or recoverable
dvp             = dvp_value  OR  cost_basis  (default → CVD 0 when no uplift)

customs_total (5200 Purchase)  = dvp + sum_charges - deductions
etb_total                      = cost_basis + sum_charges - deductions
cvd (2400)                     = dvp - cost_basis
git (1420)                     = customs_total - fob - cvd

⇒ Purchase = FOB + GIT + CVD          (3-way credit ties to the debit)
⇒ item allocation total = Purchase    (capitalized cost fully distributed)
```

Allocation: each item gets `purchase_total × weight / Σweight`, where weight is `weight_basis`
(default, = qty × FOB unit price) or `qty` when `alloc_method == "By Qty"`.

## Source-of-truth figures (declaration 4-013659)

Purchase **14,706,242.42** · Supplier **4,727,320.14** · GIT **5,025,731.82** · CVD
**4,953,190.46** · ETB total 9,753,051.96. Item unit costs: PVC-2.8 5,684.92, PVC-3.0
6,103.52, PVC-8.0 15,877.17, Blockboard 5,233.00, Edge Banding 5,472.26.

## How to extend safely

- New charge line → add to `STANDARD_CHARGE_TEMPLATE` (Python `import_shipment.py` AND TS
  `costsheet.ts`), pick the right `charge_group`, set `recoverable`/`is_fob` as needed.
- Always re-run the regression after any engine change:
  `python3 backend/buildsupply/import_tracking/tests/test_costsheet.py`
  It runs two scenarios (the real sheet + a generic no-DVP, by-qty import). Both must pass.
- On submit, capitalized charges flow into a native **Landed Cost Voucher** (`create_landed_cost_voucher`).
  Don't double-capitalize deductions.
- Verify a dry run end-to-end: `bench --site <site> execute buildsupply.import_tracking.demo.run_dry_run`.
