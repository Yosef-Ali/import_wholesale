# Prep Checklist — Before the Customer's Scans Arrive

Everything here can be done now; only the OCR label-calibration waits on the actual scans.

## 1. Deploy & configure
- `bench --site <site> migrate` — installs the new doctypes (Import Shipment fields,
  Import Charge Line, Import Item Allocation, BuildSupply Settings) and the print format.
- Open **BuildSupply Settings** → set Default Company → click **Seed Import GL Accounts**
  (creates/locates 5200 / 1440 / 1420 / 2400 and saves them).

## 2. Master data
- Supplier: *Suqian Panda Int'l Trade*.
- Items: the 5 products (PVC 2.8 / 3.0 / 8.0, Blockboard 18mm, Edge Banding) with codes.
- Warehouse: import WIP / destination.
  (All of this is created automatically by the dry-run seed in step 3.)

## 3. End-to-end dry run (proves the pipeline on verified data)
```
bench --site <site> execute buildsupply.import_tracking.demo.run_dry_run
```
Creates the supplier, items, and a full Import Shipment from declaration 4-013659 and
asserts the totals tie out (Purchase 14,706,242.42 · Supplier 4,727,320.14 ·
GIT 5,025,731.82 · CVD 4,953,190.46) and the per-item unit costs match the sheet.
Then link a Purchase Receipt and **Submit** to confirm the Landed Cost Voucher posts.
Undo with `...demo.teardown`.

## 4. Web-app data entry (already built)
In the shipment drawer, the **Cost Sheet** tab now has an edit mode:
- "Load Standard Template" drops in the full 23-line ledger.
- Add/remove charge rows and item rows; enter qty + FOB value per item.
- Totals and per-item **unit cost preview update live** as you type.
- Save writes the child tables; the server recomputes authoritatively.
- **Print** / **PDF** buttons export the formatted cost sheet.

## 5. Scan auto-extract (scaffolding ready; calibrate on arrival)
- `extraction/field_map.json` — which document yields which field/charge line. When the
  scans arrive, fill the `anchors` with the real label text from each document.
- `extraction/extract.py`:
  - `apply_extracted_payload(payload)` — **works now**: feed it a canonical JSON
    (header + charges + items) and it creates/fills a shipment.
  - `extract_from_attachments(shipment)` — the OCR hook to implement once layouts are known.

## Decisions to confirm
- Currency: enter items/FOB in **USD (FCY) + rate**, or already **ETB**?
- Print format branding: add company **logo + letterhead**?
