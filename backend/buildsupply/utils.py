# -*- coding: utf-8 -*-
import frappe


def has_app_permission():
    """Check if user has any BuildSupply role."""
    roles = frappe.get_roles()
    buildsupply_roles = {
        "BuildSupply Admin",
        "Import Manager",
        "Warehouse Manager",
        "Sales Manager",
        "Sales Rep",
        "Accountant",
        "Administrator",
        "System Manager",
    }
    return bool(set(roles) & buildsupply_roles)


def on_session_creation():
    """Set locale defaults on login."""
    pass


# ── Scheduled tasks ──────────────────────────────────────────────────────


def check_low_stock_alerts():
    """Daily: flag items below reorder level."""
    items = frappe.db.sql(
        """
        SELECT b.item_code, b.warehouse, b.actual_qty, i.safety_stock
        FROM `tabBin` b
        JOIN `tabItem` i ON i.name = b.item_code
        WHERE b.actual_qty < i.safety_stock AND i.safety_stock > 0
        """,
        as_dict=True,
    )
    for item in items:
        frappe.log_error(
            title="Low Stock Alert",
            message=f"{item.item_code} in {item.warehouse}: {item.actual_qty} (safety: {item.safety_stock})",
        )


def check_overdue_purchase_orders():
    """Daily: flag POs past expected delivery date."""
    from frappe.utils import today

    overdue = frappe.get_all(
        "Purchase Order",
        filters={
            "status": ["in", ["To Receive and Bill", "To Receive"]],
            "schedule_date": ["<", today()],
        },
        fields=["name", "supplier_name", "schedule_date"],
    )
    for po in overdue:
        frappe.log_error(
            title="Overdue Purchase Order",
            message=f"PO {po.name} from {po.supplier_name} was due {po.schedule_date}",
        )


def update_shipment_status():
    """Hourly: update import shipments that should have arrived."""
    from frappe.utils import today

    shipments = frappe.get_all(
        "Import Shipment",
        filters={
            "status": ["in", ["In Transit", "At Port"]],
            "eta": ["<=", today()],
        },
        fields=["name"],
    )
    for s in shipments:
        frappe.db.set_value("Import Shipment", s.name, "status", "Arrived \u2013 Pending Clearance")
    if shipments:
        frappe.db.commit()
