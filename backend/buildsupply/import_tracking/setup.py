# -*- coding: utf-8 -*-
"""One-click setup helpers for the import landed-cost workflow.

`seed_import_accounts` find-or-creates the four GL accounts used by the customs cost
sheet and stores them in BuildSupply Settings. It is idempotent — running it twice reuses
existing accounts. Account types are sensible defaults for an Ethiopian import flow; adjust
in the Chart of Accounts afterwards if your CoA differs.
"""
import frappe
from frappe import _

# (account_number, account_name, root_type, account_type, settings_field)
IMPORT_ACCOUNTS = [
    ("5200", "Purchase - Imports",      "Expense",   "",        "account_purchase"),
    ("1440", "Supplier Payable - Imports", "Liability", "Payable", "account_supplier"),
    ("1420", "Goods In Transit",        "Asset",     "",        "account_git"),
    ("2400", "Customs Valuation Variance (CVD)", "Liability", "", "account_cvd"),
]


def _root_group_for(company, root_type):
    """Return the top group account for a root_type in this company's CoA."""
    rows = frappe.get_all(
        "Account",
        filters={"company": company, "root_type": root_type, "is_group": 1},
        fields=["name", "lft"],
        order_by="lft asc",
        limit=1,
    )
    return rows[0].name if rows else None


def _find_or_create_account(company, number, account_name, root_type, account_type):
    # Reuse by account_number first, then by name.
    existing = frappe.get_all(
        "Account",
        filters={"company": company, "account_number": number, "is_group": 0},
        limit=1,
    )
    if existing:
        return existing[0].name, False

    parent = _root_group_for(company, root_type)
    if not parent:
        frappe.throw(_("No {0} group account found in the chart of accounts for {1}.")
                     .format(root_type, company))

    acc = frappe.new_doc("Account")
    acc.account_name = account_name
    acc.account_number = number
    acc.company = company
    acc.parent_account = parent
    acc.is_group = 0
    acc.root_type = root_type
    if account_type:
        acc.account_type = account_type
    acc.insert(ignore_permissions=True)
    return acc.name, True


@frappe.whitelist()
def seed_import_accounts(company=None):
    """Create/locate the 4 import GL accounts and save them into BuildSupply Settings."""
    settings = frappe.get_single("BuildSupply Settings")
    company = (company or settings.default_company
               or frappe.defaults.get_user_default("Company"))
    if not company:
        frappe.throw(_("Set a Default Company in BuildSupply Settings first."))

    created, reused = [], []
    for number, name, root_type, account_type, field in IMPORT_ACCOUNTS:
        acc_name, was_created = _find_or_create_account(
            company, number, name, root_type, account_type
        )
        settings.set(field, acc_name)
        (created if was_created else reused).append(acc_name)

    if not settings.default_company:
        settings.default_company = company
    settings.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "company": company,
        "created": created,
        "reused": reused,
        "message": _("{0} account(s) created, {1} reused. Saved to BuildSupply Settings.")
        .format(len(created), len(reused)),
    }
