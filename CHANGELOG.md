# Changelog

All notable changes to BuildSupply Pro are recorded here. This doubles as working memory
for AI/agent sessions — append a note for any user-facing change, schema change, or new
convention. Format follows [Keep a Changelog](https://keepachangelog.com/); the project
uses Conventional Commits.

## [Unreleased]

### Changed — Design review + chart modernization (2026-06-11)
- **Charts fixed and modernized** (`components/Charts/`): Sales Trend is a gradient area
  curve (was broken — NaN tooltips from a mock/type field mismatch, plus "New User/Existing
  User" template residue); Top Items renders ranked progress bars on tracks; Top Customers
  gets readable axes (`fmtCompactNum` ticks, truncated labels, full name in tooltip) and a
  dashed invoices curve; Revenue Breakdown sparkbars grade by value with the peak highlighted.
  New helper `fmtCompactNum` in `utils/format.ts`. **Rule:** mock data field names in
  `api/client.ts` must match the TS types — recharts silently renders nothing on a missing
  `dataKey`.
- **Responsive layout**: below `lg` the sidebar is an off-canvas drawer (hamburger + backdrop);
  KPI grids go 2-col, chart rows stack below `xl`. The SPA is now usable on phones.
- **Honest states**: stock pill derives from displayed qty (qty-0 no longer "In Stock");
  KPI deltas hidden when the value is missing; dates derive from the clock (no more 2025);
  sidebar chip shows the real signed-in user.
- **`/cost-sheet` defaults to the latest shipment** (was hardcoded to dev-era
  `IMP-2025-00042`, which 404'd on live sites); friendly empty state when none exist.
- **DESIGN.md added** — the real design system (dark-first, `--primary #FF8400`, Geist +
  JetBrains Mono, chart house style, breakpoints). CLAUDE.md's stale blue/Inter tokens now
  point there.

### Fixed — Seed & local stack (2026-06-11)
- `seed_data.py`: select-validation bypass scoped with try/finally (was leaking process-wide
  on error); ensures UOMs, Supplier Groups, and the Transit Warehouse Type before inserts.
- `demo.run_dry_run()` is actually idempotent (reuses the shipment for declaration 4-013659).
- `setup.seed_import_accounts` falls back to account-name reuse as documented.
- Compose `create-site`: newline-safe `apps.txt` append (fixes the `erpnextbuildsupply`
  migrate crash on stale sites volumes).
- Local-stack note: fresh sites skip the wizard, so set `System Settings.language` (the seed
  flow now does) — frappe v16's `locale.py:get_locale_value` raises `UnboundLocalError` on
  document updates when no language is set (upstream bug; also breaks
  `install_fixtures.install`).

### Added — Import landed-cost workflow (ERPNext-native)
- **Import Shipment** expanded into a full Ethiopian customs cost sheet: declaration header
  (TIN, declaration no., bank permit, FCY rate, DVP), a `charges` child table
  (**Import Charge Line**), an `item_allocation` child table (**Import Item Allocation**),
  and computed GL totals (Purchase 5200, Supplier 1440, GIT 1420, CVD 2400).
- **`compute_costsheet()`** pure engine in `import_shipment.py`; ties to the source
  declaration to the cent (Purchase 14,706,242.42 · CVD 4,953,190.46 · GIT 5,025,731.82).
- **Landed Cost Voucher** auto-generated on submit, distributing capitalized charges to item
  valuation (gated by a settings flag).
- **Standard charge template** (`STANDARD_CHARGE_TEMPLATE`) + "Load Standard Template"
  button so any new shipment / supplier scaffolds the full ledger.
- **BuildSupply Settings** (single doctype): default company, GL accounts, allocation method,
  auto-LCV switch. One-click **Seed Import GL Accounts** (`import_tracking/setup.py`).
- **Print format** "Import Cost Sheet" + **Print / PDF** buttons in the React shipment drawer
  (`printViewUrl` / `pdfDownloadUrl` in `utils/format.ts`). Letterhead header pulls the company
  name + `company_logo` from the ERPNext Company record (falls back to `BuildSupply Settings`
  default company) — no hardcoded logo; styled with the app design tokens.
- **Web data entry**: editable Cost Sheet tab (`CostSheetEditor.tsx`) with live allocation
  preview via `utils/costsheet.ts` (client mirror of the Python engine).
- **Customer cost-sheet view** (`CostSheetView.tsx`, routes `/cost-sheet/:name` + `/cost-sheet`):
  read-only, print-clean rendering of a shipment's cost sheet (the "what the customer sees" for
  IMP-2025-00042) from live ERPNext data — server totals preferred, engine mirror as fallback;
  design tokens + `fmtETB` + Print/PDF buttons. Dev mock of declaration 4-013659 added so it
  renders offline.
- **Dry-run seed** `import_tracking/demo.py` (`run_dry_run` / `teardown`).
- **Scan extraction scaffolding**: `import_tracking/extraction/` — `field_map.json` (per-document
  label map) and `extract.py` (`apply_extracted_payload` working now; `extract_from_attachments`
  OCR hook pending real scans). `anchors` pre-seeded with best-guess English + Amharic label
  variants (155 candidates across the 8 documents) to minimise calibration when scans arrive;
  every charge `description` still ties to `STANDARD_CHARGE_TEMPLATE`.
- **Regression test** `import_tracking/tests/test_costsheet.py` — two scenarios (real PVC/
  blockboard sheet + a generic no-DVP, by-qty import).
- **Admin sidebar previews**: role-gated **Admin** section in `Sidebar.tsx` linking the cost-sheet
  / print / intake HTML mockups (served from `frontend/public/`). Gating via new `roles`/`isAdmin`
  in `authStore` + `getUserRoles()` in `api/client.ts` (reads the user's own User doc;
  `System Manager` ⇒ admin, `Administrator` always admin). Temporary — links swap to real React
  routes once the backend is live in production.

### Added — Agent workflow tooling
- `CLAUDE.md` project conventions; this `CHANGELOG.md` as working memory.
- `.claude/agents/code-reviewer.md` reviewer subagent.
- `.claude/skills/`: `frappe-doctype`, `landed-cost-sheet`, `react-feature`.
- `.claude/settings.json` Stop hook enforcing the cost-sheet test + typecheck.

### Changed — Navigation (ERPNext-aligned, phase 1)
- Sidebar regrouped to mirror ERPNext modules / the import→wholesale document flow, using the
  doctype names users recognise: **Overview · Buying & Import** (Purchase Orders, Suppliers)
  **· Inventory** (Items, Warehouse) **· Wholesale & Selling** (Sales Orders, Customers)
  **· Accounting** (Cost Sheet, Reports — finance/admin only) **· Settings** (admin only:
  User Management + design previews). Gating via `isAdmin` + new finance-role check
  (`Accounts Manager`/`Accounts User`). See `PLAN_UX_ERPNEXT_WORKFLOW.md`; later phases add the
  PO→Receipt→Shipment→LCV pipeline strip and accounting surfacing.

### Notes
- Run `bench migrate` to install the new DocTypes before using the workflow.
- Confirm currency convention (FCY+rate vs ETB) and optional PDF letterhead/logo.
