# ERPNext Landed-Cost Workflow — Conversion Plan

Converting the Ethiopian customs cost sheet (final output of the codebase) into an
ERPNext-native workflow, using the **Hybrid** approach: `Import Shipment` captures the
full customs declaration, then auto-generates a standard **Landed Cost Voucher (LCV)**
on submit so the charges flow into ERPNext item valuation and the GL.

---

## 1. What the source sheet actually is

A single import (Declaration `4-013659`, supplier *Suqian Panda Int'l Trade*, China) of
PVC sheet / laminated blockboard. It contains three logical blocks:

1. **Declaration header** — TIN, declaration no., bank permit, commercial invoice, BL,
   FCY rate (134.5121), invoice value in FCY (35,144.20 USD), supplier, origin.
2. **Charge ledger** — ~26 rows in two columns:
   - *Amount in ETB* = real cost basis (FOB + insurance + sea freight + port + charges).
   - *Customs Invoice Price* = customs valuation basis (DVP **replaces** FOB/freight/
     insurance/port, then the same charges are added).
3. **GL distribution + item allocation** — debits Purchase (5200) and credits Supplier
   (1440), GIT (1420), CVD (2400); then spreads the capitalized cost across 5 items.

### Verified accounting identities (see `verify_costsheet.py`, all assertions pass)

| Quantity | Value (ETB) | Definition |
|---|---:|---|
| Customs col, incl. ref. taxes | 17,048,882.31 | DVP + all charges |
| ETB col, incl. ref. taxes | 12,095,691.85 | (FOB+ins+freight+port) + all charges |
| less VAT Rebate | (2,006,719.30) | recoverable — **not** capitalized |
| less Withholding Payable | (335,920.59) | payable — **not** capitalized |
| **Customs Total (= Purchase 5200)** | **14,706,242.42** | capitalized landed cost |
| ETB Total | 9,753,051.96 | net cash cost basis |
| **CVD (2400)** | **4,953,190.46** | = DVP − (FOB+ins+freight+port) |
| **GIT (1420)** | **5,025,731.82** | = Total − FOB − CVD |
| **Supplier/FOB (1440)** | **4,727,320.14** | supplier payable |

Identity: `Purchase = FOB + GIT + CVD` and `Item-allocation total = Purchase`.

**Key insight for ERPNext:** VAT Receivable and Withholding are *recoverable/payable*, so
they are **excluded** from item valuation. The amount that hits stock valuation is the
**capitalized total 14,706,242.42**, which the LCV distributes across the 5 items.

---

## 2. Target ERPNext workflow (Hybrid)

```
Purchase Order ──► Purchase Receipt ──► Import Shipment (full customs capture)
                                              │  on submit
                                              ▼
                                   Landed Cost Voucher (auto-generated)
                                              │  distributes capitalized charges
                                              ▼
                                   Item valuation updated  +  GL entries
                                   Dr 5200 Purchase 14,706,242.42
                                     Cr 1440 Supplier  4,727,320.14
                                     Cr 1420 GIT       5,025,731.82
                                     Cr 2400 CVD       4,953,190.46
```

`Import Shipment` stays the system of record for the declaration and the human-readable
cost sheet / print format. The LCV is the ERPNext-native artifact that mutates valuation
so downstream stock/sales reports use the true landed cost.

---

## 3. Data model changes

### 3a. New child doctype — `Import Charge Line`
One row per cost-sheet line. Fields: `sn` (Int), `description` (Data), `charge_group`
(Select: Cost Basis / Freight & Logistics / Duty & Tax / Handling / Bank / Deduction),
`customs_amount` (Currency), `etb_amount` (Currency), `capitalize` (Check),
`recoverable` (Check), `lcv_account` (Link → Account), `distribute` (Check — include in
LCV distribution to items).

### 3b. New child doctype — `Import Item Allocation`
Final per-item landed cost. Fields: `item_code` (Link → Item), `description` (Data),
`qty` (Float), `landed_unit_cost` (Currency, read-only), `landed_total` (Currency,
read-only), `weight_basis` (Float — value used to apportion).

### 3c. Expand `Import Shipment` doctype
Add to the existing doctype:
- **Declaration block:** `tax_payer`, `tin_number`, `declaration_number`,
  `bank_permit_number`, `commercial_invoice`, `fcy_rate` (Float), `invoice_value_fcy`
  (Currency, USD), `dvp_value` (Currency).
- **Charges:** `charges` (Table → Import Charge Line).
- **Item allocation:** `item_allocation` (Table → Import Item Allocation).
- **Computed GL summary (read-only):** `customs_total`, `etb_total`,
  `vat_rebate`, `withholding_payable`, `cvd_amount` (Custom Valuation Variance),
  `git_amount`, `supplier_payable`, `purchase_total` (= capitalized landed cost).
- **Linkage:** `purchase_receipt` (Link), `landed_cost_voucher` (Link, read-only).
- GL account mapping fields: `account_purchase` (5200), `account_supplier` (1440),
  `account_git` (1420), `account_cvd` (2400).

The legacy simple fields (`fob_cost`, `freight_cost`, …, `total_landed_cost`) are kept for
backward compatibility and recomputed from the new tables so existing UI/records keep
working.

---

## 4. Calculation logic (`import_shipment.py`)

On `validate()`:
1. `sum_charges = Σ charge.etb_amount` over rows flagged neither cost-basis nor deduction.
2. `etb_total_incl = fob + insurance + sea_freight + port + sum_charges`.
3. `customs_total_incl = dvp + sum_charges`.
4. Subtract `vat_rebate` + `withholding_payable` → `etb_total`, `customs_total`.
5. `cvd = dvp − (fob+insurance+sea_freight+port)`.
6. `purchase_total = customs_total`; `git = customs_total − fob − cvd`.
7. Apportion `purchase_total` across `item_allocation` rows by `weight_basis`
   (defaults to photo line totals; configurable to qty- or value-weighted) and set
   `landed_unit_cost`.
8. Mirror into legacy fields for the existing React drawer.

On `on_submit()`:
- Build a **Landed Cost Voucher** referencing the linked Purchase Receipt; add one
  `taxes` row per capitalized charge group mapped to its `lcv_account`; set distribution
  = "Distribute Manually" using each item's computed share; insert + submit; store its
  name in `landed_cost_voucher`.
- Guard: only if `purchase_receipt` is set and not already linked (idempotent).

A standalone `compute_costsheet(doc)` pure function holds the math so it is unit-testable
without a Frappe DB (mirrors `verify_costsheet.py`).

---

## 5. Print format & UI

- **Print format** `Import Cost Sheet` (Jinja/HTML) reproducing the photo: header grid,
  two-column charge ledger with deductions, GL distribution block, and item allocation
  table — printable for customs/finance.
- **Frontend:** extend `src/api/types.ts` (`ImportShipment`) with the new fields + child
  arrays, and add a **"Cost Sheet"** tab in `ShipmentDetailDrawer.tsx` rendering the full
  ledger, GL split, and item allocation (read-only), plus a link to the generated LCV.

---

## 6. Migration & rollout

1. Ship child doctypes + expanded `Import Shipment` JSON; run `bench migrate`.
2. Seed the 4 GL accounts (5200/1440/1420/2400) if absent and set them in **BuildSupply
   Settings** (single doctype). New shipments auto-fill company, the 4 accounts, and the
   allocation method from there; per-shipment overrides still allowed. The settings also
   carry an "Auto-create Landed Cost Voucher on Submit" switch.
3. Backfill: a patch copies legacy single-figure costs into a single "Legacy" charge row
   so old shipments still render.
4. Verify with `verify_costsheet.py` numbers as the regression fixture.

---

## 7. Build order (tracked in the task list)

1. Child doctypes (`Import Charge Line`, `Import Item Allocation`).
2. Expand `Import Shipment` doctype JSON.
3. Calc + LCV generation in `import_shipment.py` (+ pure `compute_costsheet`).
4. Print format + frontend types/drawer.
5. Regression test against the source sheet.

---

## 8. Reusability (any goods, any tax payer / supplier)

Nothing is tied to the Suqian Panda declaration — the sample is just one record:

- **All identifiers are fields** — `tax_payer`, `tin_number`, `supplier`,
  `commercial_invoice_no`, goods description, etc. A new import for a different
  customer/supplier is simply a new `Import Shipment`.
- **Standard charge template** — `STANDARD_CHARGE_TEMPLATE` in `import_shipment.py` holds
  the house-standard ledger (descriptions + groups, no amounts). A **"Load Standard Charge
  Template"** button (`public/js/import_shipment.js`, method `apply_standard_template`)
  scaffolds the full ledger on any new shipment; the user just types the amounts. Edit the
  list once to change the standard for everyone.
- **Explicit FOB flag** — the supplier-payable line is marked `is_fob` rather than guessed
  by position, so any number/order of cost-basis lines works.
- **Optional customs uplift** — if no DVP is entered it defaults to the cost basis, so
  `CVD = 0` and customs == ETB totals. Imports with no valuation variance need no special
  handling.
- **Allocation method** — per shipment: by stated basis, by qty, or by value.
- **Proven generic** — `tests/test_costsheet.py` runs two unrelated scenarios: the real
  PVC/blockboard sheet (ties to the cent) **and** a different steel import with no DVP and
  by-qty allocation. Both pass.
