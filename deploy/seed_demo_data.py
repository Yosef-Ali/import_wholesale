"""
BuildSupply Pro — Demo Data Seed Script (v2 — fixed UOMs, fiscal year, countries)
Copy to container: docker cp seed_demo_data.py buildsupply-backend-1:/home/frappe/frappe-bench/apps/frappe/frappe/seed_buildsupply.py
Run: docker exec buildsupply-backend-1 bash -c 'cd /home/frappe/frappe-bench && bench --site frontend execute frappe.seed_buildsupply.execute'
"""
import frappe
from frappe.utils import today, add_years

COMPANY     = "Import Wholesale PLC"
COMPANY_ABBR = "IWP"

def ensure_uom(name):
    if not frappe.db.exists("UOM", name):
        frappe.get_doc({"doctype": "UOM", "uom_name": name, "enabled": 1}).insert(ignore_permissions=True)

def get_wh(short_name):
    results = frappe.get_all("Warehouse", filters={"warehouse_name": short_name, "company": COMPANY}, pluck="name", limit=1)
    return results[0] if results else None

def execute():
    frappe.set_user("Administrator")
    created = []

    # ── 0. Fiscal Year ────────────────────────────────────────────────
    fy_name = "2025-2026"
    if not frappe.db.exists("Fiscal Year", fy_name):
        try:
            fy = frappe.get_doc({
                "doctype": "Fiscal Year",
                "year": fy_name,
                "year_start_date": "2025-01-01",
                "year_end_date": "2025-12-31",
            })
            fy.insert(ignore_permissions=True)
            created.append(f"FiscalYear: {fy_name}")
        except Exception as e:
            print(f"  FiscalYear skipped: {e}")
    # Also check for a FY covering today (2026)
    fy2_name = "2026"
    if not frappe.db.exists("Fiscal Year", fy2_name):
        try:
            fy2 = frappe.get_doc({
                "doctype": "Fiscal Year",
                "year": fy2_name,
                "year_start_date": "2026-01-01",
                "year_end_date": "2026-12-31",
            })
            fy2.insert(ignore_permissions=True)
            created.append(f"FiscalYear: {fy2_name}")
        except Exception as e:
            print(f"  FiscalYear 2026 skipped: {e}")

    frappe.db.commit()

    # ── 1. UOMs ───────────────────────────────────────────────────────
    for uom in ["Sheet", "Length", "Bag", "Sqm", "Can"]:
        ensure_uom(uom)
        created.append(f"UOM: {uom}")

    frappe.db.commit()

    # ── 2. Item Groups ────────────────────────────────────────────────
    for group in ["Steel", "Cement", "Tiles", "Paint", "Hardware"]:
        if not frappe.db.exists("Item Group", group):
            try:
                frappe.get_doc({
                    "doctype": "Item Group",
                    "item_group_name": group,
                    "parent_item_group": "All Item Groups",
                    "is_group": 0,
                }).insert(ignore_permissions=True)
                created.append(f"ItemGroup: {group}")
            except Exception as e:
                print(f"  ItemGroup {group} skipped: {e}")

    frappe.db.commit()

    # ── 3. Warehouses ─────────────────────────────────────────────────
    warehouses = [
        ("Main Store",     "Stores"),
        ("Tile Warehouse", "Stores"),
        ("Pipe Yard",      "Stores"),
        ("Paint Storage",  "Stores"),
    ]
    for wh_name, wh_type in warehouses:
        if not get_wh(wh_name):
            try:
                frappe.get_doc({
                    "doctype": "Warehouse",
                    "warehouse_name": wh_name,
                    "parent_warehouse": f"All Warehouses - {COMPANY_ABBR}",
                    "company": COMPANY,
                    "is_group": 0,
                }).insert(ignore_permissions=True)
                created.append(f"Warehouse: {wh_name}")
            except Exception as e:
                print(f"  Warehouse {wh_name} skipped: {e}")

    frappe.db.commit()

    default_wh = get_wh("Main Store") or f"Stores - {COMPANY_ABBR}"
    tile_wh    = get_wh("Tile Warehouse") or default_wh
    pipe_wh    = get_wh("Pipe Yard")      or default_wh
    paint_wh   = get_wh("Paint Storage")  or default_wh

    # ── 4. Items ──────────────────────────────────────────────────────
    items = [
        {"item_code": "STL-RB-16", "item_name": "Deformed Rebar 16mm",       "item_group": "Steel",    "stock_uom": "Nos",    "standard_rate": 1200, "safety_stock": 500},
        {"item_code": "STL-CI-28", "item_name": "Corrugated Iron Sheet",      "item_group": "Steel",    "stock_uom": "Sheet",  "standard_rate": 700,  "safety_stock": 300},
        {"item_code": "STL-WE-32", "item_name": "Welding Electrode 3.2mm",    "item_group": "Steel",    "stock_uom": "Kg",     "standard_rate": 3000, "safety_stock": 20},
        {"item_code": "STL-AP-4",  "item_name": "Angle Iron 4\" x 6m",         "item_group": "Steel",    "stock_uom": "Length", "standard_rate": 1800, "safety_stock": 100},
        {"item_code": "CMT-PC-50", "item_name": "Portland Cement 50kg",        "item_group": "Cement",   "stock_uom": "Bag",    "standard_rate": 1800, "safety_stock": 200},
        {"item_code": "CMT-SC-25", "item_name": "Waterproof Screed 25kg",      "item_group": "Cement",   "stock_uom": "Bag",    "standard_rate": 950,  "safety_stock": 150},
        {"item_code": "TIL-CF-40", "item_name": "Ceramic Floor Tile 40x40",   "item_group": "Tiles",    "stock_uom": "Sqm",    "standard_rate": 400,  "safety_stock": 500},
        {"item_code": "PNT-EW-20", "item_name": "Exterior Wall Paint 20L",    "item_group": "Paint",    "stock_uom": "Can",    "standard_rate": 6000, "safety_stock": 50},
        {"item_code": "PIP-PV-4",  "item_name": "PVC Pipe 4\" x 6m",           "item_group": "Hardware", "stock_uom": "Length", "standard_rate": 600,  "safety_stock": 200},
        {"item_code": "HW-BB-M16", "item_name": "Anchor Bolt M16 x 150mm",    "item_group": "Hardware", "stock_uom": "Nos",    "standard_rate": 85,   "safety_stock": 1000},
    ]
    for item_data in items:
        if not frappe.db.exists("Item", item_data["item_code"]):
            try:
                frappe.get_doc({"doctype": "Item", "is_stock_item": 1, **item_data}).insert(ignore_permissions=True)
                created.append(f"Item: {item_data['item_code']}")
            except Exception as e:
                print(f"  Item {item_data['item_code']} skipped: {e}")

    frappe.db.commit()

    # ── 5. Opening Stock ──────────────────────────────────────────────
    stock_data = [
        ("STL-RB-16",  2400, default_wh),
        ("STL-CI-28",  1500, default_wh),
        ("STL-WE-32",     8, default_wh),
        ("STL-AP-4",    320, default_wh),
        ("CMT-PC-50",   180, default_wh),
        ("CMT-SC-25",   450, default_wh),
        ("HW-BB-M16", 5000, default_wh),
        ("TIL-CF-40", 3200, tile_wh),
        ("PIP-PV-4",   890, pipe_wh),
        ("PNT-EW-20",   45, paint_wh),
    ]
    valid_items = [
        {
            "item_code": ic,
            "qty": qty,
            "t_warehouse": wh,
            "basic_rate": frappe.db.get_value("Item", ic, "standard_rate") or 100,
        }
        for ic, qty, wh in stock_data
        if frappe.db.exists("Item", ic) and wh
    ]
    if valid_items:
        try:
            se = frappe.get_doc({
                "doctype": "Stock Entry",
                "stock_entry_type": "Material Receipt",
                "posting_date": "2026-01-15",
                "company": COMPANY,
                "items": valid_items,
            })
            se.insert(ignore_permissions=True)
            se.submit()
            created.append(f"StockEntry: {se.name}")
        except Exception as e:
            print(f"  StockEntry skipped: {e}")

    frappe.db.commit()

    # ── 6. Customer Groups ────────────────────────────────────────────
    for grp in ["Commercial", "Government"]:
        if not frappe.db.exists("Customer Group", grp):
            try:
                frappe.get_doc({
                    "doctype": "Customer Group",
                    "customer_group_name": grp,
                    "parent_customer_group": "All Customer Groups",
                }).insert(ignore_permissions=True)
            except Exception as e:
                print(f"  CustomerGroup {grp}: {e}")

    frappe.db.commit()

    # ── 7. Customers ─────────────────────────────────────────────────
    customers = [
        ("Sunshine Construction", "Commercial", 15_000_000),
        ("Nile Building PLC",     "Government", 25_000_000),
        ("Abyssinia Developers",  "Commercial",  5_000_000),
        ("Meskel Construction",   "Commercial", 10_000_000),
        ("Addis Real Estate",     "Commercial",  8_000_000),
        ("Ethiopian Roads Auth",  "Government", 30_000_000),
    ]
    for cname, cgrp, credit in customers:
        if not frappe.db.exists("Customer", cname):
            try:
                frappe.get_doc({
                    "doctype": "Customer",
                    "customer_name": cname,
                    "customer_group": cgrp,
                    "territory": "Rest Of The World",
                    "customer_type": "Company",
                    "credit_limit": credit,
                }).insert(ignore_permissions=True)
                created.append(f"Customer: {cname}")
            except Exception as e:
                print(f"  Customer {cname} skipped: {e}")

    # ── 8. Supplier Groups ────────────────────────────────────────────
    for grp in ["Raw Material", "Distributor", "Hardware"]:
        if not frappe.db.exists("Supplier Group", grp):
            try:
                frappe.get_doc({
                    "doctype": "Supplier Group",
                    "supplier_group_name": grp,
                    "parent_supplier_group": "All Supplier Groups",
                }).insert(ignore_permissions=True)
            except Exception as e:
                print(f"  SupplierGroup {grp}: {e}")

    frappe.db.commit()

    # ── 9. Suppliers (with correct country names) ─────────────────────
    suppliers = [
        ("Shanghai Steel Co.",      "Raw Material", "China"),
        ("Istanbul Cement Ltd.",    "Raw Material", "Türkiye"),
        ("Dubai Tiles Trading",     "Distributor",  "United Arab Emirates"),
        ("Guangzhou Paint Factory", "Hardware",     "China"),
        ("Ankara Pipe Industries",  "Hardware",     "Türkiye"),
        ("Korea Wire Products",     "Raw Material", "Korea, Republic of"),
    ]
    for sname, sgrp, country in suppliers:
        if not frappe.db.exists("Supplier", sname):
            try:
                frappe.get_doc({
                    "doctype": "Supplier",
                    "supplier_name": sname,
                    "supplier_group": sgrp,
                    "country": country,
                    "supplier_type": "Company",
                }).insert(ignore_permissions=True)
                created.append(f"Supplier: {sname}")
            except Exception as e:
                print(f"  Supplier {sname} skipped: {e}")

    frappe.db.commit()

    # ── 10. Demo Users ────────────────────────────────────────────────
    demo_users = [
        {"email": "abebe.girma@buildsupply.local",  "first_name": "Abebe",  "last_name": "Girma",   "mobile_no": "+251911000001", "roles": ["System Manager"]},
        {"email": "sara.tekeste@buildsupply.local",  "first_name": "Sara",   "last_name": "Tekeste", "mobile_no": "+251911000002", "roles": ["Accounts Manager"]},
        {"email": "daniel.hailu@buildsupply.local",  "first_name": "Daniel", "last_name": "Hailu",   "mobile_no": "+251911000003", "roles": ["Stock Manager"]},
        {"email": "mekdes.alemu@buildsupply.local",  "first_name": "Mekdes", "last_name": "Alemu",   "mobile_no": "+251911000004", "roles": ["Accounts User"]},
        {"email": "yonas.bekele@buildsupply.local",  "first_name": "Yonas",  "last_name": "Bekele",  "mobile_no": "+251911000005", "roles": ["Sales User"]},
    ]
    for u in demo_users:
        if not frappe.db.exists("User", u["email"]):
            try:
                roles = [{"role": r} for r in u.pop("roles")]
                frappe.get_doc({
                    "doctype": "User",
                    "send_welcome_email": 0,
                    "new_password": "BuildSupply@2026",
                    "user_type": "System User",
                    "roles": roles,
                    **u,
                }).insert(ignore_permissions=True)
                created.append(f"User: {u['email']}")
            except Exception as e:
                print(f"  User {u.get('email')} skipped: {e}")

    frappe.db.commit()

    # ── 11. Purchase Orders ───────────────────────────────────────────
    pos = [
        {"supplier": "Shanghai Steel Co.",      "schedule_date": "2026-03-20",
         "items": [{"item_code": "STL-RB-16", "qty": 500, "rate": 1200, "schedule_date": "2026-03-20"},
                   {"item_code": "STL-CI-28", "qty": 300, "rate": 700,  "schedule_date": "2026-03-20"}]},
        {"supplier": "Istanbul Cement Ltd.",    "schedule_date": "2026-03-15",
         "items": [{"item_code": "CMT-PC-50", "qty": 1000, "rate": 1800, "schedule_date": "2026-03-15"}]},
        {"supplier": "Dubai Tiles Trading",     "schedule_date": "2026-02-28",
         "items": [{"item_code": "TIL-CF-40", "qty": 2000, "rate": 400, "schedule_date": "2026-02-28"}]},
        {"supplier": "Guangzhou Paint Factory", "schedule_date": "2026-04-10",
         "items": [{"item_code": "PNT-EW-20", "qty": 200, "rate": 6000, "schedule_date": "2026-04-10"}]},
        {"supplier": "Ankara Pipe Industries",  "schedule_date": "2026-02-25",
         "items": [{"item_code": "PIP-PV-4",  "qty": 500, "rate": 600,  "schedule_date": "2026-02-25"}]},
    ]
    for po_data in pos:
        if not frappe.db.exists("Supplier", po_data["supplier"]):
            continue
        try:
            for it in po_data["items"]:
                it["warehouse"] = default_wh
                if not frappe.db.exists("Item", it["item_code"]):
                    raise ValueError(f"Item {it['item_code']} not found")
            doc = frappe.get_doc({
                "doctype": "Purchase Order",
                "supplier": po_data["supplier"],
                "schedule_date": po_data["schedule_date"],
                "items": po_data["items"],
                "company": COMPANY,
            })
            doc.insert(ignore_permissions=True)
            doc.submit()
            created.append(f"PurchaseOrder: {doc.name}")
        except Exception as e:
            print(f"  PO {po_data['supplier']} skipped: {e}")

    frappe.db.commit()

    # ── 12. Sales Orders ──────────────────────────────────────────────
    sos = [
        {"customer": "Sunshine Construction", "delivery_date": "2026-03-10",
         "items": [{"item_code": "STL-RB-16", "qty": 100, "rate": 1350, "delivery_date": "2026-03-10"}]},
        {"customer": "Nile Building PLC",     "delivery_date": "2026-03-08",
         "items": [{"item_code": "STL-CI-28", "qty": 500, "rate": 800,  "delivery_date": "2026-03-08"}]},
        {"customer": "Abyssinia Developers",  "delivery_date": "2026-03-25",
         "items": [{"item_code": "TIL-CF-40", "qty": 800, "rate": 450,  "delivery_date": "2026-03-25"}]},
        {"customer": "Meskel Construction",   "delivery_date": "2026-03-15",
         "items": [{"item_code": "STL-RB-16", "qty": 300, "rate": 1300, "delivery_date": "2026-03-15"}]},
        {"customer": "Addis Real Estate",     "delivery_date": "2026-03-20",
         "items": [{"item_code": "PNT-EW-20", "qty": 30,  "rate": 6500, "delivery_date": "2026-03-20"}]},
    ]
    for so_data in sos:
        if not frappe.db.exists("Customer", so_data["customer"]):
            continue
        try:
            for it in so_data["items"]:
                it["warehouse"] = default_wh
                if not frappe.db.exists("Item", it["item_code"]):
                    raise ValueError(f"Item {it['item_code']} not found")
            doc = frappe.get_doc({
                "doctype": "Sales Order",
                "customer": so_data["customer"],
                "delivery_date": so_data["delivery_date"],
                "items": so_data["items"],
                "company": COMPANY,
                "order_type": "Sales",
            })
            doc.insert(ignore_permissions=True)
            doc.submit()
            created.append(f"SalesOrder: {doc.name}")
        except Exception as e:
            print(f"  SO {so_data['customer']} skipped: {e}")

    frappe.db.commit()

    print(f"\n✅ Seeded {len(created)} records:")
    for r in created:
        print(f"   • {r}")
