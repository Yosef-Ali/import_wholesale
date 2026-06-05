# Plan — Sync the SPA UX with the ERPNext Import → Wholesale Workflow

Status: **proposal for review — no code yet.** Goal: make the navigation and screens
mirror how ERPNext actually moves a document, and surface the accounting (GL) the current
UI hides. Two hard constraints carry over: follow the design system, stay server-authoritative.

## 1. The problem (today)

The sidebar groups by generic buckets — **Operations / People / Analytics** — which say
nothing about the import workflow or the accounting behind it:

```
Operations: Dashboard · Inventory · Import Orders · Wholesale · Warehouse
People:     Suppliers · Customers · User Management
Analytics:  Reports
Admin:      (HTML previews)
```

Gaps vs. ERPNext:
- No visible **document flow**: PO → Purchase Receipt → Import Shipment (cost sheet) →
  Landed Cost Voucher → Stock valuation → Sales.
- **Accounting is invisible**: the GL accounts the engine posts to (5200 Purchase, 1440
  Supplier, 1420 GIT, 2400 CVD), Landed Cost Vouchers, payments/AP — none are navigable.
- "Import Orders" actually lists Purchase Orders; "Wholesale" lists Sales Orders — the names
  don't match the ERPNext docs underneath.

## 2. Proposed information architecture (sidebar)

Regroup around the ERPNext modules and the real pipeline order:

```
OVERVIEW
  Dashboard

BUYING & IMPORT          (the import pipeline, in flow order)
  Purchase Orders         → ERPNext Purchase Order
  Import Shipments        → Import Shipment (cost sheet) + Cost Sheet view
  Suppliers               → Supplier
  Landed Cost Vouchers    → Landed Cost Voucher (read-only list + status)

INVENTORY
  Items
  Warehouses / Stock

WHOLESALE & SELLING
  Sales Orders
  Customers
  Customer Credit         → existing Customer Credit module

ACCOUNTING
  Cost Sheets / GL        → per-shipment GL distribution (5200/1440/1420/2400)
  Payments & AP           → Payment Entry / supplier payable
  Reports

SETTINGS  (admin-gated)
  BuildSupply Settings
  Users
  Design Previews         → the HTML mockups (kept while in dev)
```

Why: every top group maps to an ERPNext module a user already understands, and the
**Buying & Import** group is ordered as the document actually flows.

## 3. "Synchronize the process" — make the flow walkable

On each document, surface the next/prev stage so the chain is navigable (ERPNext's
connections, in our UI):

```
Purchase Order ─▶ Purchase Receipt ─▶ Import Shipment ─▶ Landed Cost Voucher ─▶ Stock ─▶ Sales Order
```

- Import Shipment detail gets a **pipeline strip** at the top: PO · Receipt · Shipment ·
  LCV · linked, each a link, with status. (`purchase_receipt`, `landed_cost_voucher` fields
  already exist on the doctype.)
- The Cost Sheet view (already built) becomes the canonical "customer-facing" output of the
  shipment stage.

## 4. Surface the accounting

- A compact **GL Distribution** panel on the shipment (the four accounts + amounts) — we
  already render it in `CostSheetView`; reuse it on the detail page.
- An **Accounting** section listing Landed Cost Vouchers and supplier payable status, read
  from ERPNext (server-authoritative), not recomputed in the client.

## 5. Phasing (each phase shippable on its own)

1. **Rename + regroup the sidebar** (low risk, `Sidebar.tsx` only) — names match ERPNext docs,
   groups match modules. No data changes.
2. **Pipeline strip** on the Import Shipment detail (links PO/Receipt/Shipment/LCV).
3. **Accounting section** — LCV list + GL panel reuse.
4. **Customer Credit** surfaced in Wholesale.

## 6. Decisions needed before build

- Keep the literal labels "Import Orders / Wholesale", or rename to the ERPNext doc names
  (Purchase Orders / Sales Orders)? (Recommend rename — that's the whole point.)
- Who sees the **Accounting** group — all staff, or finance/admin roles only (we now have
  `isAdmin`/roles)?
- Is **Customer Credit** in scope for this pass, or later?

## 7. Out of scope / unchanged

- The landed-cost engine and its invariants (Purchase 14,706,242.42 / CVD 4,953,190.46 /
  GIT 5,025,731.82) — untouched.
- Backend doctypes — this is navigation + presentation only.
