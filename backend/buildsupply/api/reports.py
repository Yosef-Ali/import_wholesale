# -*- coding: utf-8 -*-
"""Whitelisted API endpoints for reports and analytics."""
import frappe
from frappe.utils import today, add_months


@frappe.whitelist()
def get_top_items(limit=10, period="month"):
    """Top selling items by quantity."""
    if period == "month":
        start = today()[:8] + "01"
    elif period == "quarter":
        start = add_months(today(), -3)
    else:
        start = add_months(today(), -12)

    data = frappe.db.sql(
        """
        SELECT
            sii.item_code,
            sii.item_name,
            SUM(sii.qty) as total_qty,
            SUM(sii.amount) as total_amount
        FROM `tabSales Invoice Item` sii
        JOIN `tabSales Invoice` si ON si.name = sii.parent
        WHERE si.posting_date >= %s AND si.docstatus = 1
        GROUP BY sii.item_code, sii.item_name
        ORDER BY total_qty DESC
        LIMIT %s
        """,
        (start, int(limit)),
        as_dict=True,
    )
    return data


@frappe.whitelist()
def get_top_customers(limit=10):
    """Top customers by revenue (current year)."""
    year_start = today()[:4] + "-01-01"
    data = frappe.db.sql(
        """
        SELECT
            si.customer,
            si.customer_name,
            COUNT(*) as invoice_count,
            SUM(si.grand_total) as total_revenue
        FROM `tabSales Invoice` si
        WHERE si.posting_date >= %s AND si.docstatus = 1
        GROUP BY si.customer, si.customer_name
        ORDER BY total_revenue DESC
        LIMIT %s
        """,
        (year_start, int(limit)),
        as_dict=True,
    )
    return data


@frappe.whitelist()
def get_import_summary():
    """Import shipment summary by status."""
    data = frappe.db.sql(
        """
        SELECT
            status,
            COUNT(*) as count,
            SUM(total_landed_cost) as total_cost
        FROM `tabImport Shipment`
        WHERE docstatus = 1
        GROUP BY status
        ORDER BY count DESC
        """,
        as_dict=True,
    )
    return data
