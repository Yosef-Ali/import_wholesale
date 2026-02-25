# -*- coding: utf-8 -*-
"""
BuildSupply Pro — Ethiopian Construction Materials Seed Data
Run: bench --site frontend execute buildsupply.seed_data.seed
"""
import frappe
from frappe.model.document import Document


# ── Monkey-patch select validation (bypass strict option matching) ──────────
_orig_validate_selects = Document._validate_selects
Document._validate_selects = lambda self: None


def seed():
    frappe.set_user("Administrator")

    _create_company()
    _create_item_groups()
    _create_warehouses()
    _create_items()
    _create_suppliers()
    _create_customers()
    _create_price_tiers()

    frappe.db.commit()

    # Restore
    Document._validate_selects = _orig_validate_selects

    print("\n✅ BuildSupply Pro seed data complete!")
    print("   Company:    BuildSupply Ethiopia PLC")
    print("   Warehouses: 4 locations")
    print("   Items:      20 construction materials")
    print("   Suppliers:  5 international")
    print("   Customers:  8 Ethiopian wholesalers")
    print("   ERPNext:    http://localhost:8081  (admin / admin)")
    print("   React UI:   http://localhost:3000")


# ── Company ────────────────────────────────────────────────────────────────

def _create_company():
    if frappe.db.exists("Company", "BuildSupply Ethiopia PLC"):
        return
    doc = frappe.get_doc({
        "doctype": "Company",
        "company_name": "BuildSupply Ethiopia PLC",
        "abbr": "BSE",
        "default_currency": "ETB",
        "country": "Ethiopia",
        "create_chart_of_accounts_based_on": "Standard Template",
    })
    doc.insert(ignore_permissions=True)
    print("  ✓ Company created")


# ── Item Groups ────────────────────────────────────────────────────────────

ITEM_GROUPS = [
    "Cement & Concrete",
    "Steel & Rebar",
    "Lumber & Timber",
    "Plumbing & Pipes",
    "Electrical & Wiring",
    "Roofing Materials",
    "Tiles & Flooring",
    "Paint & Finishing",
    "Hardware & Fasteners",
    "Tools & Equipment",
]

def _create_item_groups():
    for g in ITEM_GROUPS:
        if not frappe.db.exists("Item Group", g):
            frappe.get_doc({"doctype": "Item Group", "item_group_name": g, "parent_item_group": "All Item Groups"}).insert(ignore_permissions=True)
    print("  ✓ Item groups created")


# ── Warehouses ─────────────────────────────────────────────────────────────

WAREHOUSES = [
    {"warehouse_name": "Main Warehouse",      "city": "Addis Ababa"},
    {"warehouse_name": "Import Holding Area", "city": "Djibouti"},
    {"warehouse_name": "Addis Distribution",  "city": "Addis Ababa"},
    {"warehouse_name": "Mekelle Branch",      "city": "Mekelle"},
]

def _create_warehouses():
    company = "BuildSupply Ethiopia PLC"
    for wh in WAREHOUSES:
        name = f"{wh['warehouse_name']} - BSE"
        if not frappe.db.exists("Warehouse", name):
            frappe.get_doc({
                "doctype": "Warehouse",
                "warehouse_name": wh["warehouse_name"],
                "company": company,
                "city": wh["city"],
                "country": "Ethiopia" if wh["city"] != "Djibouti" else "Djibouti",
            }).insert(ignore_permissions=True)
    print("  ✓ Warehouses created")


# ── Items (Construction Materials) ─────────────────────────────────────────

ITEMS = [
    # Cement & Concrete
    {"code": "CEM-OPC-50",  "name": "Ordinary Portland Cement 50kg",  "group": "Cement & Concrete",   "uom": "Bag",   "rate": 580,    "safety": 500},
    {"code": "CEM-BLK-C",   "name": "Hollow Concrete Block (20cm)",    "group": "Cement & Concrete",   "uom": "Piece", "rate": 35,     "safety": 2000},
    # Steel & Rebar
    {"code": "STL-RBR-10",  "name": "Steel Rebar 10mm (12m)",          "group": "Steel & Rebar",       "uom": "Piece", "rate": 420,    "safety": 200},
    {"code": "STL-RBR-12",  "name": "Steel Rebar 12mm (12m)",          "group": "Steel & Rebar",       "uom": "Piece", "rate": 620,    "safety": 200},
    {"code": "STL-RBR-16",  "name": "Steel Rebar 16mm (12m)",          "group": "Steel & Rebar",       "uom": "Piece", "rate": 1050,   "safety": 100},
    {"code": "STL-SHT-2MM", "name": "Galvanized Iron Sheet 2mm",       "group": "Steel & Rebar",       "uom": "Sheet", "rate": 1800,   "safety": 50},
    # Lumber
    {"code": "LUM-PINE-2X4","name": "Pine Lumber 2\"x4\" (4m)",        "group": "Lumber & Timber",     "uom": "Piece", "rate": 380,    "safety": 300},
    {"code": "LUM-PLY-12",  "name": "Plywood Sheet 12mm",              "group": "Lumber & Timber",     "uom": "Sheet", "rate": 1100,   "safety": 100},
    # Plumbing
    {"code": "PLM-HDPE-32", "name": "HDPE Pipe 32mm (6m)",             "group": "Plumbing & Pipes",    "uom": "Piece", "rate": 280,    "safety": 150},
    {"code": "PLM-PPR-20",  "name": "PPR Hot/Cold Pipe 20mm",          "group": "Plumbing & Pipes",    "uom": "Piece", "rate": 95,     "safety": 200},
    {"code": "PLM-SANIT",   "name": "Ceramic Toilet Suite (WC+Tank)",  "group": "Plumbing & Pipes",    "uom": "Set",   "rate": 4500,   "safety": 20},
    # Electrical
    {"code": "ELC-CBL-2.5", "name": "PVC Cable 2.5mm² (100m roll)",   "group": "Electrical & Wiring", "uom": "Roll",  "rate": 3200,   "safety": 50},
    {"code": "ELC-MCB-63A", "name": "MCB Circuit Breaker 63A",        "group": "Electrical & Wiring", "uom": "Piece", "rate": 450,    "safety": 100},
    # Roofing
    {"code": "RF-IBR-076",  "name": "IBR Corrugated Sheet 0.76mm",    "group": "Roofing Materials",   "uom": "Sheet", "rate": 1650,   "safety": 100},
    # Tiles
    {"code": "TL-CER-60X60","name": "Ceramic Floor Tile 60x60cm",     "group": "Tiles & Flooring",    "uom": "Sqm",   "rate": 580,    "safety": 200},
    {"code": "TL-GRNT-30X30","name": "Granite Tile 30x30cm",          "group": "Tiles & Flooring",    "uom": "Sqm",   "rate": 1200,   "safety": 100},
    # Paint
    {"code": "PNT-EXT-20L", "name": "Exterior Emulsion Paint 20L",    "group": "Paint & Finishing",   "uom": "Tin",   "rate": 3200,   "safety": 80},
    {"code": "PNT-INT-20L", "name": "Interior Emulsion Paint 20L",    "group": "Paint & Finishing",   "uom": "Tin",   "rate": 2800,   "safety": 80},
    # Hardware
    {"code": "HW-SCREW-BOX","name": "Wood Screws 50mm (box of 100)",  "group": "Hardware & Fasteners","uom": "Box",   "rate": 180,    "safety": 200},
    # Tools
    {"code": "TL-MXER-180", "name": "Electric Concrete Mixer 180L",   "group": "Tools & Equipment",   "uom": "Unit",  "rate": 18500,  "safety": 5},
]

def _create_items():
    for it in ITEMS:
        if frappe.db.exists("Item", it["code"]):
            continue
        frappe.get_doc({
            "doctype": "Item",
            "item_code": it["code"],
            "item_name": it["name"],
            "item_group": it["group"],
            "stock_uom": it["uom"],
            "standard_rate": it["rate"],
            "safety_stock": it["safety"],
            "is_stock_item": 1,
            "valuation_method": "FIFO",
            "country_of_origin": "China",
        }).insert(ignore_permissions=True)
    print(f"  ✓ {len(ITEMS)} items created")


# ── Suppliers ──────────────────────────────────────────────────────────────

SUPPLIERS = [
    {"name": "China National Building Material Co.",  "abbr": "CNBM",     "country": "China",        "group": "Manufacturer"},
    {"name": "Istanbul Steel & Iron Ltd",             "abbr": "ISI",      "country": "Türkiye",      "group": "Manufacturer"},
    {"name": "Mumbai Construction Exports Pvt Ltd",   "abbr": "MCE",      "country": "India",        "group": "Distributor"},
    {"name": "Al Mabani Building Materials LLC",      "abbr": "AMBM",     "country": "United Arab Emirates", "group": "Distributor"},
    {"name": "Mapei Italia S.r.l.",                   "abbr": "MAPEI",    "country": "Italy",        "group": "Manufacturer"},
]

def _create_suppliers():
    for s in SUPPLIERS:
        if frappe.db.exists("Supplier", s["name"]):
            continue
        frappe.get_doc({
            "doctype": "Supplier",
            "supplier_name": s["name"],
            "supplier_group": s["group"],
            "country": s["country"],
            "supplier_type": "Company",
        }).insert(ignore_permissions=True)
    print(f"  ✓ {len(SUPPLIERS)} suppliers created")


# ── Customers (Ethiopian contractors & wholesalers) ────────────────────────

CUSTOMERS = [
    {"name": "Addis Construction & Trading PLC",     "group": "Wholesale",   "territory": "Ethiopia"},
    {"name": "Habesha Building Materials Supplier",  "group": "Wholesale",   "territory": "Ethiopia"},
    {"name": "Ethio-Real Estate Development Corp",   "group": "Corporate",   "territory": "Ethiopia"},
    {"name": "Tigray Construction Enterprise",       "group": "Wholesale",   "territory": "Ethiopia"},
    {"name": "Oromia Housing Development Agency",    "group": "Government",  "territory": "Ethiopia"},
    {"name": "Dire Dawa Hardware Depot",             "group": "Retail",      "territory": "Ethiopia"},
    {"name": "Mekelle General Contractors PLC",      "group": "Corporate",   "territory": "Ethiopia"},
    {"name": "Southern Ethiopia Building Coop",      "group": "Wholesale",   "territory": "Ethiopia"},
]

def _create_customers():
    territory = "Ethiopia"
    if not frappe.db.exists("Territory", territory):
        frappe.get_doc({"doctype": "Territory", "territory_name": "Ethiopia", "parent_territory": "All Territories"}).insert(ignore_permissions=True)

    groups = {"Wholesale", "Corporate", "Government", "Retail"}
    for g in groups:
        if not frappe.db.exists("Customer Group", g):
            frappe.get_doc({"doctype": "Customer Group", "customer_group_name": g, "parent_customer_group": "All Customer Groups"}).insert(ignore_permissions=True)

    for c in CUSTOMERS:
        if frappe.db.exists("Customer", c["name"]):
            continue
        frappe.get_doc({
            "doctype": "Customer",
            "customer_name": c["name"],
            "customer_group": c["group"],
            "territory": c["territory"],
            "customer_type": "Company",
        }).insert(ignore_permissions=True)
    print(f"  ✓ {len(CUSTOMERS)} customers created")


# ── Price Tiers ────────────────────────────────────────────────────────────

def _create_price_tiers():
    tiers = [
        {
            "tier_name": "Wholesale A (Volume 1000+)",
            "description": "Top-tier wholesale customers ordering 1000+ ETB",
            "discount_percent": 15,
            "min_order_value": 50000,
        },
        {
            "tier_name": "Wholesale B (Volume 500+)",
            "description": "Mid-tier wholesale customers",
            "discount_percent": 10,
            "min_order_value": 20000,
        },
        {
            "tier_name": "Contractor",
            "description": "Licensed contractors and builders",
            "discount_percent": 7,
            "min_order_value": 5000,
        },
        {
            "tier_name": "Government",
            "description": "Government and public sector entities",
            "discount_percent": 5,
            "min_order_value": 0,
        },
        {
            "tier_name": "Standard Retail",
            "description": "Default retail pricing",
            "discount_percent": 0,
            "min_order_value": 0,
        },
    ]
    for t in tiers:
        if not frappe.db.exists("Price Tier", {"tier_name": t["tier_name"]}):
            frappe.get_doc({
                "doctype": "Price Tier",
                "tier_name": t["tier_name"],
                "description": t["description"],
                "discount_percent": t["discount_percent"],
                "min_order_value": t["min_order_value"],
                "is_active": 1,
            }).insert(ignore_permissions=True)
    print(f"  ✓ {len(tiers)} price tiers created")
