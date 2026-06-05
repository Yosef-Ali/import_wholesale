# Changelog

All notable changes to BuildSupply Pro are recorded here. This doubles as working memory
for AI/agent sessions — append a note for any user-facing change, schema change, or new
convention. Format follows [Keep a Changelog](https://keepachangelog.com/); the project
uses Conventional Commits.

## [Unreleased]

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
  (`printViewUrl` / `pdfDownloadUrl` in `utils/format.ts`).
- **Web data entry**: editable Cost Sheet tab (`CostSheetEditor.tsx`) with live allocation
  preview via `utils/costsheet.ts` (client mirror of the Python engine).
- **Dry-run seed** `import_tracking/demo.py` (`run_dry_run` / `teardown`).
- **Scan extraction scaffolding**: `import_tracking/extraction/` — `field_map.json` (per-document
  label map) and `extract.py` (`apply_extracted_payload` working now; `extract_from_attachments`
  OCR hook pending real scans).
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

### Notes
- Run `bench migrate` to install the new DocTypes before using the workflow.
- Confirm currency convention (FCY+rate vs ETB) and optional PDF letterhead/logo.
