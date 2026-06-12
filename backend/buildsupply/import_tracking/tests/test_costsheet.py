# -*- coding: utf-8 -*-
"""Regression test for the Import Shipment cost-sheet engine.

Runs ``compute_costsheet`` against the real declaration 4-013659 (Suqian Panda) and
asserts every total matches the source customs sheet. Stubs ``frappe`` so it runs without
a bench, e.g.::

    python3 backend/buildsupply/import_tracking/tests/test_costsheet.py
"""
import os
import sys
import types

# --- Stub the minimal frappe surface used by import_shipment.compute_costsheet ---
frappe = types.ModuleType("frappe")
frappe.utils = types.ModuleType("frappe.utils")
frappe.utils.flt = lambda v, p=None: round(float(v or 0), p) if p is not None else float(v or 0)
frappe.model = types.ModuleType("frappe.model")
frappe.model.document = types.ModuleType("frappe.model.document")
frappe.model.document.Document = object
frappe._ = lambda s: s
frappe.whitelist = lambda *a, **k: (lambda f: f)
sys.modules["frappe"] = frappe
sys.modules["frappe.utils"] = frappe.utils
sys.modules["frappe.model"] = frappe.model
sys.modules["frappe.model.document"] = frappe.model.document

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "doctype", "import_shipment"))
from import_shipment import compute_costsheet  # noqa: E402


def build_data():
    charges = [
        # Cost-basis lines (ETB column). FOB first = supplier payable.
        {"description": "Invoice Price (FOB)", "charge_group": "Cost Basis", "is_fob": 1, "etb_amount": 4_727_320.14},
        {"description": "Insurance", "charge_group": "Cost Basis", "etb_amount": 4_539.12},
        {"description": "Sea Freight Charge", "charge_group": "Cost Basis", "etb_amount": 1_230_958.62},
        {"description": "Port Clearance charges (Djibouti)", "charge_group": "Cost Basis", "etb_amount": 281_346.66},
        # Ordinary charges (both columns).
        {"description": "Service Charge On Opening CAD", "charge_group": "Bank", "etb_amount": 184_334.27},
        {"description": "Postage/Swift charges/exchange", "charge_group": "Bank", "etb_amount": 128_451.41},
        {"description": "Bank Service Charge on Freight & Port", "charge_group": "Bank", "etb_amount": 46_519.16},
        {"description": "Transportation Cost From Djibouti to Modjo", "charge_group": "Freight & Logistics", "etb_amount": 779_934.00},
        {"description": "Customs Duty Tax (15%/35%)", "charge_group": "Duty & Tax", "etb_amount": 1_787_961.70},
        {"description": "Sur tax", "charge_group": "Duty & Tax", "etb_amount": 73_142.10},
        {"description": "Social Welfare Tax (3%)", "charge_group": "Duty & Tax", "etb_amount": 319_666.80},
        {"description": "Scanning Fee (7%)", "charge_group": "Duty & Tax", "etb_amount": 7_837.00},
        {"description": "other", "charge_group": "Other", "etb_amount": 1_175.72},
        {"description": "Vat Receivable", "charge_group": "Duty & Tax", "etb_amount": 2_006_719.30},
        {"description": "Withholding On Customs", "charge_group": "Duty & Tax", "etb_amount": 335_920.59},
        {"description": "ESLSE Modjo Port/Terminal service", "charge_group": "Handling", "etb_amount": 37_128.95},
        {"description": "Transit Cost", "charge_group": "Freight & Logistics", "etb_amount": 10_000.00},
        {"description": "Container Unstuffing", "charge_group": "Handling", "etb_amount": 42_000.00},
        {"description": "Transportation Cost From Modjo to warehouse", "charge_group": "Freight & Logistics", "etb_amount": 76_000.00},
        {"description": "Demurrage", "charge_group": "Handling", "etb_amount": 13_778.58},
        {"description": "Bank CPO charges", "charge_group": "Bank", "etb_amount": 957.73},
        # Deductions (recoverable / payable).
        {"description": "Less:-Vat Rebate", "charge_group": "Deduction", "recoverable": 1, "etb_amount": 2_006_719.30},
        {"description": "Less:-Withholding Payable", "charge_group": "Deduction", "recoverable": 1, "etb_amount": 335_920.59},
    ]
    items = [
        {"item_code": "PVC-2.8", "qty": 403, "weight_basis": 2_291_022.51},
        {"item_code": "PVC-3.0", "qty": 293, "weight_basis": 1_788_331.83},
        {"item_code": "PVC-8.0", "qty": 26, "weight_basis": 412_806.34},
        {"item_code": "BLOCK-18", "qty": 1795, "weight_basis": 9_393_242.10},
        {"item_code": "EDGE", "qty": 150, "weight_basis": 820_839.22},
    ]
    return {"dvp_value": 11_197_355.00, "charges": charges,
            "item_allocation": items, "alloc_method": "Allocation Basis"}


def approx(a, b, tol=0.5):
    return abs(a - b) <= tol


def run():
    r = compute_costsheet(build_data())
    checks = [
        ("Customs total incl ref taxes", r["customs_total_incl"], 17_048_882.31),
        ("ETB total incl ref taxes", r["etb_total_incl"], 12_095_691.85),
        ("Customs Total", r["customs_total"], 14_706_242.42),
        ("ETB Total", r["etb_total"], 9_753_051.96),
        ("CVD (2400)", r["cvd_amount"], 4_953_190.46),
        ("GIT (1420)", r["git_amount"], 5_025_731.82),
        ("Supplier/FOB (1440)", r["supplier_payable"], 4_727_320.14),
        ("Purchase (5200)", r["purchase_total"], 14_706_242.42),
        ("VAT Rebate", r["vat_rebate"], 2_006_719.30),
        ("Withholding Payable", r["withholding_payable"], 335_920.59),
    ]
    ok = True
    for label, got, want in checks:
        good = approx(got, want)
        ok = ok and good
        print(f"[{'OK ' if good else 'XX '}] {label:32} got={got:,.2f} want={want:,.2f}")

    alloc_total = sum(r2["landed_total"] for r2 in r["item_allocation"])
    good = approx(alloc_total, 14_706_242.42, tol=1.0)
    ok = ok and good
    print(f"[{'OK ' if good else 'XX '}] {'Item allocation total':32} got={alloc_total:,.2f} want=14,706,242.42")
    print("\nUnit costs vs sheet:")
    for r2 in r["item_allocation"]:
        print(f"   {r2['item_code']:10} qty={r2['qty']:>6}  unit={r2['landed_unit_cost']:>12,.2f}")

    assert ok, "Cost-sheet regression FAILED"
    print("\nSheet #1 (Suqian Panda) regression checks passed.")


def run_generic():
    """Different goods, different tax payer, NO customs uplift (DVP blank).
    Proves the engine is not tied to the sample declaration."""
    data = {
        "dvp_value": 0,  # no DVP declared -> defaults to cost basis -> CVD must be 0
        "alloc_method": "By Qty",
        "charges": [
            {"description": "Invoice Price (FOB)", "charge_group": "Cost Basis", "is_fob": 1, "etb_amount": 1_000_000.0},
            {"description": "Insurance", "charge_group": "Cost Basis", "etb_amount": 5_000.0},
            {"description": "Sea Freight Charge", "charge_group": "Cost Basis", "etb_amount": 200_000.0},
            {"description": "Customs Duty Tax", "charge_group": "Duty & Tax", "etb_amount": 150_000.0},
            {"description": "Inland Transport", "charge_group": "Freight & Logistics", "etb_amount": 50_000.0},
            {"description": "Less:-Vat Rebate", "charge_group": "Deduction", "recoverable": 1, "etb_amount": 30_000.0},
        ],
        "item_allocation": [
            {"item_code": "STEEL-A", "qty": 100},
            {"item_code": "STEEL-B", "qty": 300},
        ],
    }
    r = compute_costsheet(data)
    # cost_basis = 1,205,000 ; charges (non-basis, non-deduction) = 200,000
    # customs_total = etb_total = (1,205,000 + 200,000) - 30,000 = 1,375,000
    # CVD = DVP(=cost_basis) - cost_basis = 0 ; GIT = 1,375,000 - 1,000,000 - 0 = 375,000
    checks = [
        ("CVD == 0 (no uplift)", r["cvd_amount"], 0.0),
        ("Customs == ETB total", r["customs_total"], r["etb_total"]),
        ("Purchase total", r["purchase_total"], 1_375_000.0),
        ("Supplier payable (FOB flag)", r["supplier_payable"], 1_000_000.0),
        ("GIT", r["git_amount"], 375_000.0),
    ]
    ok = True
    for label, got, want in checks:
        good = approx(got, want)
        ok = ok and good
        print(f"[{'OK ' if good else 'XX '}] {label:32} got={got:,.2f} want={want:,.2f}")
    # By-qty allocation: 100/400 and 300/400 of 1,375,000
    alloc = {a["item_code"]: a["landed_total"] for a in r["item_allocation"]}
    good = approx(alloc["STEEL-A"], 343_750.0) and approx(alloc["STEEL-B"], 1_031_250.0)
    ok = ok and good
    print(f"[{'OK ' if good else 'XX '}] {'By-qty allocation':32} A={alloc['STEEL-A']:,.2f} B={alloc['STEEL-B']:,.2f}")
    assert ok, "Generic scenario FAILED"
    print("Sheet #2 (generic, no-DVP, by-qty) checks passed.")


if __name__ == "__main__":
    run()
    print()
    run_generic()
    print("\nAll scenarios passed — engine is generic across goods & customers.")
