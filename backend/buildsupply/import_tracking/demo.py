# -*- coding: utf-8 -*-
"""End-to-end dry run for the import landed-cost workflow.

Creates the sample masters and a full Import Shipment from the *verified* figures of
declaration 4-013659, so you can prove PO -> Purchase Receipt -> Import Shipment ->
Landed Cost Voucher before any real customer data arrives.

Run it with bench (idempotent — safe to re-run):

    bench --site <your-site> execute buildsupply.import_tracking.demo.run_dry_run

Optional: drop everything it created again with

    bench --site <your-site> execute buildsupply.import_tracking.demo.teardown
"""
import frappe

SUPPLIER = "SUQIAN PANDA INT'L TRADE"
ITEM_GROUP = "Products"
WAREHOUSE_NAME = "Imports WIP"
DECLARATION = "4-013659"

ITEMS = [
    # (item_code, description, qty, fob_value_basis, fob_unit_price)
    ("PVC-2.8", "PVC SHEET -1220x2440x2.8MM", 403, 2_291_022.51, 5_684.92),
    ("PVC-3.0", "PVC SHEET -1220x2440x3.0MM", 293, 1_788_331.83, 6_103.52),
    ("PVC-8.0", "PVC SHEET -1220x2440x8.0MM", 26, 412_806.34, 15_877.17),
    ("BLOCK-18", "Blockboard - 1220x2440x18mm", 1795, 9_393_242.10, 5_233.00),
    ("EDGE-BAND", "PVC Edge Banding", 150, 820_839.22, 5_472.26),
]

CHARGES = [
    # (sn, description, group, etb_amount, is_fob, recoverable)
    (1,  "Invoice Price (FOB)", "Cost Basis", 4_727_320.14, 1, 0),
    (3,  "Insurance", "Cost Basis", 4_539.12, 0, 0),
    (7,  "Sea Freight Charge", "Cost Basis", 1_230_958.62, 0, 0),
    (8,  "Port Clearance charges (Djibouti)", "Cost Basis", 281_346.66, 0, 0),
    (4,  "Service Charge On Opening CAD", "Bank", 184_334.27, 0, 0),
    (5,  "Postage/Swift charges/exchange", "Bank", 128_451.41, 0, 0),
    (9,  "Bank Service Charge on Freight & Port", "Bank", 46_519.16, 0, 0),
    (10, "Transportation Cost From Djibouti to Modjo", "Freight & Logistics", 779_934.00, 0, 0),
    (11, "Customs Duty Tax (15%/35%)", "Duty & Tax", 1_787_961.70, 0, 0),
    (12, "Sur tax", "Duty & Tax", 73_142.10, 0, 0),
    (13, "Social Welfare Tax (3%)", "Duty & Tax", 319_666.80, 0, 0),
    (14, "Scanning Fee (7%)", "Duty & Tax", 7_837.00, 0, 0),
    (15, "Other", "Other", 1_175.72, 0, 0),
    (16, "Vat Receivable", "Duty & Tax", 2_006_719.30, 0, 0),
    (17, "Withholding On Customs", "Duty & Tax", 335_920.59, 0, 0),
    (18, "ESLSE Modjo Port/Terminal service", "Handling", 37_128.95, 0, 0),
    (19, "Transit Cost", "Freight & Logistics", 10_000.00, 0, 0),
    (20, "Container Unstuffing", "Handling", 42_000.00, 0, 0),
    (21, "Transportation Cost From Modjo to warehouse", "Freight & Logistics", 76_000.00, 0, 0),
    (22, "Demurrage", "Handling", 13_778.58, 0, 0),
    (23, "Bank CPO charges", "Bank", 957.73, 0, 0),
    (25, "Less:-Vat Rebate", "Deduction", 2_006_719.30, 0, 1),
    (26, "Less:-Withholding Payable", "Deduction", 335_920.59, 0, 1),
]

EXPECTED = {
    "purchase_total": 14_706_242.42,
    "supplier_payable": 4_727_320.14,
    "git_amount": 5_025_731.82,
    "cvd_amount": 4_953_190.46,
}


def _ensure_item_group():
    if not frappe.db.exists("Item Group", ITEM_GROUP):
        frappe.get_doc({"doctype": "Item Group", "item_group_name": ITEM_GROUP,
                        "parent_item_group": "All Item Groups", "is_group": 0}).insert(ignore_permissions=True)


def _ensure_supplier():
    if not frappe.db.exists("Supplier", SUPPLIER):
        frappe.get_doc({"doctype": "Supplier", "supplier_name": SUPPLIER,
                        "supplier_group": "All Supplier Groups", "country": "China"}).insert(ignore_permissions=True)


def _ensure_items():
    _ensure_item_group()
    for code, desc, *_ in ITEMS:
        if not frappe.db.exists("Item", code):
            frappe.get_doc({
                "doctype": "Item", "item_code": code, "item_name": desc[:140],
                "description": desc, "item_group": ITEM_GROUP, "stock_uom": "Nos",
                "is_stock_item": 1, "is_purchase_item": 1,
            }).insert(ignore_permissions=True)


def run_dry_run():
    """Create masters + a full Import Shipment and verify the totals tie out."""
    _ensure_supplier()
    _ensure_items()

    existing = frappe.get_all("Import Shipment",
                              filters={"declaration_number": DECLARATION, "docstatus": ["<", 2]},
                              pluck="name", limit=1)
    if existing:
        doc = frappe.get_doc("Import Shipment", existing[0])
        if doc.docstatus == 0:
            doc.save(ignore_permissions=True)  # recompute draft with the current engine
    else:
        company = (frappe.db.get_single_value("BuildSupply Settings", "default_company")
                   or frappe.defaults.get_global_default("company"))

        doc = frappe.new_doc("Import Shipment")
        doc.shipment_title = "DRY RUN — Suqian Panda (4-013659)"
        doc.supplier = SUPPLIER
        doc.status = "Cleared"
        doc.company = company
        doc.order_date = frappe.utils.today()
        doc.origin_country = "China"
        doc.tax_payer = "MIHRETEAB MELKIE"
        doc.tin_number = "0053323233"
        doc.declaration_number = DECLARATION
        doc.bank_permit_number = "DSB/DMB/01/03395/2025"
        doc.commercial_invoice_no = "V-HY2501"
        doc.bl_number = "PENCB25004089"
        doc.fcy_rate = 134.5121
        doc.invoice_value_fcy = 35_144.20
        doc.dvp_value = 11_197_355.00
        doc.alloc_method = "Allocation Basis"

        for sn, desc, group, amt, is_fob, rec in CHARGES:
            doc.append("charges", {
                "sn": sn, "description": desc, "charge_group": group, "etb_amount": amt,
                "customs_amount": amt, "is_fob": is_fob, "recoverable": rec,
                "capitalize": 0 if rec else 1, "distribute": 0 if rec else 1,
            })

        for code, desc, qty, basis, _unit in ITEMS:
            doc.append("item_allocation", {
                "item_code": code, "description": desc, "qty": qty, "weight_basis": basis,
            })

        doc.insert(ignore_permissions=True)  # triggers validate() -> compute

    # --- assert the engine matches the source sheet ---
    failures = []
    for field, want in EXPECTED.items():
        got = frappe.utils.flt(doc.get(field), 2)
        if abs(got - want) > 0.5:
            failures.append(f"{field}: got {got:,.2f} want {want:,.2f}")

    print("\n=== Import Shipment dry run ===")
    print(f"Shipment: {doc.name}")
    for field in EXPECTED:
        print(f"  {field:18} {frappe.utils.flt(doc.get(field), 2):,.2f}")
    print("  Item unit costs:")
    for row in doc.item_allocation:
        print(f"    {row.item_code:10} qty={row.qty:>6}  unit={frappe.utils.flt(row.landed_unit_cost,2):>12,.2f}")

    if failures:
        print("\nFAILURES:\n  " + "\n  ".join(failures))
    else:
        print("\nAll totals tie to the source sheet. Now submit the shipment to auto-create")
        print("the Landed Cost Voucher (link a Purchase Receipt first to post valuation).")

    frappe.db.commit()
    return doc.name


def teardown():
    """Remove demo shipments created by run_dry_run (does not touch masters)."""
    for name in frappe.get_all("Import Shipment",
                               filters={"declaration_number": DECLARATION}, pluck="name"):
        frappe.delete_doc("Import Shipment", name, force=True, ignore_permissions=True)
    frappe.db.commit()
    print("Demo shipments removed.")
