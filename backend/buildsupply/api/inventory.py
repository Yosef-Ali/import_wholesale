# -*- coding: utf-8 -*-
"""Whitelisted API endpoints for inventory/stock operations."""
import frappe


@frappe.whitelist()
def get_stock_levels(warehouse=None, item_group=None):
    """Return stock levels, optionally filtered by warehouse or item group."""
    conditions = "WHERE 1=1"
    params = []

    if warehouse:
        conditions += " AND b.warehouse = %s"
        params.append(warehouse)

    if item_group:
        conditions += " AND i.item_group = %s"
        params.append(item_group)

    data = frappe.db.sql(
        f"""
        SELECT
            b.item_code,
            i.item_name,
            i.item_group,
            b.warehouse,
            b.actual_qty,
            b.projected_qty,
            b.reserved_qty,
            b.stock_value,
            i.safety_stock,
            CASE WHEN b.actual_qty < i.safety_stock AND i.safety_stock > 0
                 THEN 1 ELSE 0 END as is_low_stock
        FROM `tabBin` b
        JOIN `tabItem` i ON i.name = b.item_code
        {conditions}
        ORDER BY b.item_code, b.warehouse
        """,
        params,
        as_dict=True,
    )
    return data


@frappe.whitelist()
def get_warehouse_summary():
    """Return summary stock per warehouse."""
    data = frappe.db.sql(
        """
        SELECT
            b.warehouse,
            COUNT(DISTINCT b.item_code) as item_count,
            SUM(b.actual_qty) as total_qty,
            SUM(b.stock_value) as total_value
        FROM `tabBin` b
        GROUP BY b.warehouse
        ORDER BY total_value DESC
        """,
        as_dict=True,
    )
    return data


@frappe.whitelist()
def get_item_groups():
    """Return item groups for construction materials."""
    groups = frappe.get_all(
        "Item Group",
        filters={"is_group": 0},
        fields=["name", "parent_item_group"],
        order_by="name",
    )
    return groups
