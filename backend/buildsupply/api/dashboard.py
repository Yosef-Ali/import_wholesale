# -*- coding: utf-8 -*-
"""Whitelisted API endpoints for the React dashboard."""
import frappe
from frappe.utils import today, add_months


@frappe.whitelist()
def get_dashboard_stats():
    """Return KPI summary for the dashboard."""
    # Total stock value
    stock_value = frappe.db.sql(
        "SELECT SUM(stock_value) as total FROM `tabBin`", as_dict=True
    )[0].total or 0

    # Pending purchase orders
    pending_pos = frappe.db.count(
        "Purchase Order",
        filters={"status": ["in", ["To Receive and Bill", "To Receive"]]},
    )

    # Active import shipments
    active_shipments = frappe.db.count(
        "Import Shipment",
        filters={"status": ["not in", ["Completed", "Cancelled"]], "docstatus": 1},
    )

    # Monthly sales (current month)
    month_start = today()[:8] + "01"
    monthly_sales = frappe.db.sql(
        """SELECT IFNULL(SUM(grand_total), 0) as total
           FROM `tabSales Invoice`
           WHERE posting_date >= %s AND docstatus = 1""",
        month_start,
    )[0][0]

    # Low stock items
    low_stock = frappe.db.sql(
        """SELECT COUNT(*) FROM `tabBin` b
           JOIN `tabItem` i ON i.name = b.item_code
           WHERE b.actual_qty < i.safety_stock AND i.safety_stock > 0""",
    )[0][0]

    # Overdue POs
    overdue_pos = frappe.db.count(
        "Purchase Order",
        filters={
            "status": ["in", ["To Receive and Bill", "To Receive"]],
            "schedule_date": ["<", today()],
        },
    )

    return {
        "stock_value": stock_value,
        "pending_purchase_orders": pending_pos,
        "active_shipments": active_shipments,
        "monthly_sales": monthly_sales,
        "low_stock_items": low_stock,
        "overdue_purchase_orders": overdue_pos,
    }


@frappe.whitelist()
def get_customer_credit(customer):
    """Return customer credit info for Sales Order form."""
    outstanding = frappe.db.sql(
        """SELECT IFNULL(SUM(outstanding_amount), 0)
           FROM `tabSales Invoice`
           WHERE customer = %s AND docstatus = 1""",
        customer,
    )[0][0]

    credit_limit = frappe.db.get_value("Customer", customer, "credit_limit") or 0

    return {"outstanding": outstanding, "credit_limit": credit_limit}


@frappe.whitelist()
def get_sales_trend():
    """Monthly sales trend for past 6 months."""
    six_months_ago = add_months(today(), -6)
    data = frappe.db.sql(
        """SELECT DATE_FORMAT(posting_date, '%%Y-%%m') as month,
                  SUM(grand_total) as total
           FROM `tabSales Invoice`
           WHERE posting_date >= %s AND docstatus = 1
           GROUP BY month ORDER BY month""",
        six_months_ago,
        as_dict=True,
    )
    return data
