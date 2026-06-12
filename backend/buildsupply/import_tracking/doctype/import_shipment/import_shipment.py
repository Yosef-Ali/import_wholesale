# -*- coding: utf-8 -*-
"""Import Shipment — full Ethiopian customs cost sheet + native Landed Cost Voucher.

The cost-sheet math is isolated in ``compute_costsheet`` (a pure function operating on a
plain dict) so it can be unit-tested without a Frappe database. ``ImportShipment`` is a
thin wrapper that feeds the document into it and writes results back.
"""
import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


# Charge groups that form the "cost basis" replaced by DVP in the customs column.
COST_BASIS_GROUP = "Cost Basis"
DEDUCTION_GROUP = "Deduction"

# Reusable standard Ethiopian import charge ledger. This is a *template* of line
# descriptions only — every shipment (any goods, any tax payer / supplier) starts from
# the same structure and the user just fills in the amounts. Edit this list to adjust the
# house standard; it is not tied to any single declaration.
STANDARD_CHARGE_TEMPLATE = [
    {"sn": 1,  "description": "Invoice Price (FOB)",                 "charge_group": "Cost Basis",          "is_fob": 1},
    {"sn": 3,  "description": "Insurance",                          "charge_group": "Cost Basis"},
    {"sn": 7,  "description": "Sea Freight Charge",                 "charge_group": "Cost Basis"},
    {"sn": 8,  "description": "Port Clearance charges (Djibouti)",  "charge_group": "Cost Basis"},
    {"sn": 4,  "description": "Service Charge On Opening CAD",      "charge_group": "Bank"},
    {"sn": 5,  "description": "Postage/Swift charges/exchange",     "charge_group": "Bank"},
    {"sn": 9,  "description": "Bank Service Charge on Freight & Port", "charge_group": "Bank"},
    {"sn": 10, "description": "Transportation Cost From Djibouti to Modjo", "charge_group": "Freight & Logistics"},
    {"sn": 11, "description": "Customs Duty Tax (15%/35%)",         "charge_group": "Duty & Tax"},
    {"sn": 12, "description": "Sur tax",                            "charge_group": "Duty & Tax"},
    {"sn": 13, "description": "Social Welfare Tax (3%)",            "charge_group": "Duty & Tax"},
    {"sn": 14, "description": "Scanning Fee (7%)",                  "charge_group": "Duty & Tax"},
    {"sn": 15, "description": "Other",                              "charge_group": "Other"},
    {"sn": 16, "description": "Vat Receivable",                     "charge_group": "Duty & Tax"},
    {"sn": 17, "description": "Withholding On Customs",             "charge_group": "Duty & Tax"},
    {"sn": 18, "description": "ESLSE Modjo Port/Terminal service",  "charge_group": "Handling"},
    {"sn": 19, "description": "Transit Cost",                       "charge_group": "Freight & Logistics"},
    {"sn": 20, "description": "Container Unstuffing",               "charge_group": "Handling"},
    {"sn": 21, "description": "Transportation Cost From Modjo to warehouse", "charge_group": "Freight & Logistics"},
    {"sn": 22, "description": "Demurrage",                          "charge_group": "Handling"},
    {"sn": 23, "description": "Bank CPO charges",                   "charge_group": "Bank"},
    {"sn": 25, "description": "Less:-Vat Rebate",                   "charge_group": "Deduction", "recoverable": 1, "capitalize": 0, "distribute": 0},
    {"sn": 26, "description": "Less:-Withholding Payable",          "charge_group": "Deduction", "recoverable": 1, "capitalize": 0, "distribute": 0},
]


@frappe.whitelist()
def get_standard_charge_template():
    """Return the house-standard charge ledger (descriptions + groups, no amounts).
    Reusable for any import / any customer."""
    return STANDARD_CHARGE_TEMPLATE


@frappe.whitelist()
def apply_standard_template(shipment, overwrite=0):
    """Populate a shipment's charge table from the standard template.
    Skips silently if the shipment already has charges unless ``overwrite`` is set."""
    doc = frappe.get_doc("Import Shipment", shipment)
    if doc.charges and not int(overwrite or 0):
        return {"applied": 0, "reason": "charges already present"}
    doc.set("charges", [])
    for line in STANDARD_CHARGE_TEMPLATE:
        row = dict(line)
        row.setdefault("capitalize", 1)
        row.setdefault("distribute", 1)
        doc.append("charges", row)
    # Whitelisted entry point — let Frappe enforce Import Shipment write permission.
    doc.save()
    return {"applied": len(STANDARD_CHARGE_TEMPLATE)}


def compute_costsheet(data):
    """Pure cost-sheet engine. ``data`` is a dict with keys:

      dvp_value (float), charges (list of dicts with charge_group, etb_amount,
      customs_amount, capitalize, recoverable, distribute, description),
      item_allocation (list of dicts with qty, weight_basis), alloc_method (str).

    Returns a dict of computed totals + the apportioned item_allocation rows.
    The model is verified against the source declaration in tests/verify_costsheet.py.
    """
    charges = data.get("charges") or []

    # Cost-basis lines (FOB, insurance, sea freight, port) — the ETB column uses these,
    # the customs column uses DVP instead.
    cost_basis = sum(
        flt(c.get("etb_amount")) for c in charges
        if c.get("charge_group") == COST_BASIS_GROUP
    )
    # Supplier payable / FOB = lines explicitly flagged is_fob. Fallback: the first
    # cost-basis line (keeps older records working before the flag existed).
    fob = sum(
        flt(c.get("etb_amount")) for c in charges if c.get("is_fob")
    )
    if not fob:
        fob = next(
            (flt(c.get("etb_amount")) for c in charges
             if c.get("charge_group") == COST_BASIS_GROUP), 0.0
        )

    # DVP defaults to the cost basis when no customs uplift is declared, so imports
    # without a valuation variance simply yield CVD = 0 (customs col == ETB col).
    dvp = flt(data.get("dvp_value")) or cost_basis

    # Ordinary charges that appear in both columns (everything that is not cost-basis
    # and not a deduction).
    sum_charges = sum(
        flt(c.get("etb_amount")) for c in charges
        if c.get("charge_group") not in (COST_BASIS_GROUP, DEDUCTION_GROUP)
    )

    # Deductions (VAT rebate, withholding payable) — recoverable, not capitalized.
    deductions = sum(
        flt(c.get("etb_amount")) for c in charges
        if c.get("charge_group") == DEDUCTION_GROUP or c.get("recoverable")
    )
    vat_rebate = sum(
        flt(c.get("etb_amount")) for c in charges
        if c.get("recoverable") and "vat" in (c.get("description") or "").lower()
    )
    withholding_payable = sum(
        flt(c.get("etb_amount")) for c in charges
        if c.get("recoverable") and "withhold" in (c.get("description") or "").lower()
    )

    etb_total_incl = cost_basis + sum_charges
    customs_total_incl = dvp + sum_charges

    etb_total = etb_total_incl - deductions
    customs_total = customs_total_incl - deductions

    # GL distribution.
    cvd = dvp - cost_basis                       # Custom Valuation Variance (2400)
    purchase_total = customs_total               # Purchase / inventory (5200)
    supplier_payable = fob                       # Supplier (1440)
    git = purchase_total - supplier_payable - cvd  # Goods In Transit (1420)

    # Apportion the capitalized landed cost across items.
    items = data.get("item_allocation") or []
    method = data.get("alloc_method") or "Allocation Basis"
    if method == "By Qty":
        weights = [flt(i.get("qty")) for i in items]
    else:  # "Allocation Basis" or "By Value" both use weight_basis
        weights = [flt(i.get("weight_basis")) for i in items]
    total_weight = sum(weights) or 1.0

    alloc = []
    for i, w in zip(items, weights):
        share = purchase_total * (w / total_weight)
        qty = flt(i.get("qty")) or 1.0
        row = dict(i)
        row["landed_total"] = round(share, 2)
        row["landed_unit_cost"] = round(share / qty, 2)
        alloc.append(row)

    return {
        "cost_basis": round(cost_basis, 2),
        "fob": round(fob, 2),
        "sum_charges": round(sum_charges, 2),
        "etb_total_incl": round(etb_total_incl, 2),
        "customs_total_incl": round(customs_total_incl, 2),
        "vat_rebate": round(vat_rebate, 2),
        "withholding_payable": round(withholding_payable, 2),
        "deductions": round(deductions, 2),
        "etb_total": round(etb_total, 2),
        "customs_total": round(customs_total, 2),
        "cvd_amount": round(cvd, 2),
        "git_amount": round(git, 2),
        "supplier_payable": round(supplier_payable, 2),
        "purchase_total": round(purchase_total, 2),
        "item_allocation": alloc,
    }


class ImportShipment(Document):
    def validate(self):
        self.apply_settings_defaults()
        self.run_costsheet()
        self.sync_legacy_fields()
        self.set_title()

    def apply_settings_defaults(self):
        """Auto-fill company + GL accounts + allocation method from BuildSupply Settings
        whenever they are blank, so users never have to re-pick accounts per shipment."""
        try:
            s = frappe.get_single("BuildSupply Settings")
        except Exception:
            return
        if not s:
            return
        if not self.company:
            self.company = s.default_company or frappe.defaults.get_user_default("Company")
        if not self.alloc_method:
            self.alloc_method = s.default_alloc_method or "Allocation Basis"
        for fld in ("account_purchase", "account_supplier", "account_git", "account_cvd"):
            if not self.get(fld) and s.get(fld):
                self.set(fld, s.get(fld))

    def run_costsheet(self):
        data = {
            "dvp_value": self.dvp_value,
            "alloc_method": self.alloc_method,
            "charges": [c.as_dict() for c in (self.charges or [])],
            "item_allocation": [i.as_dict() for i in (self.item_allocation or [])],
        }
        res = compute_costsheet(data)

        self.customs_total = res["customs_total"]
        self.etb_total = res["etb_total"]
        self.vat_rebate = res["vat_rebate"]
        self.withholding_payable = res["withholding_payable"]
        self.purchase_total = res["purchase_total"]
        self.supplier_payable = res["supplier_payable"]
        self.git_amount = res["git_amount"]
        self.cvd_amount = res["cvd_amount"]

        for row, calc in zip(self.item_allocation or [], res["item_allocation"]):
            row.landed_total = calc["landed_total"]
            row.landed_unit_cost = calc["landed_unit_cost"]

    def sync_legacy_fields(self):
        """Mirror new ledger into the legacy single-figure fields so the existing
        React drawer and old reports keep working."""
        def grp(*needles):
            total = 0.0
            for c in self.charges or []:
                desc = (c.description or "").lower()
                if any(n in desc for n in needles):
                    total += flt(c.etb_amount)
            return total

        self.fob_cost = self.supplier_payable
        self.freight_cost = grp("freight", "transport", "transit")
        self.insurance_cost = grp("insurance")
        self.customs_duty = grp("customs duty", "duty tax")
        self.sur_tax = grp("sur tax", "surtax")
        self.vat = grp("vat receivable")
        self.other_charges = grp("scanning", "social welfare", "port", "demurrage",
                                 "unstuffing", "bank", "cpo", "swift", "cad", "other")
        # Capitalized total is the canonical landed cost.
        self.total_landed_cost = self.purchase_total

    def set_title(self):
        if not self.shipment_title and self.supplier_name:
            self.shipment_title = f"{self.supplier_name} - {self.origin_country or 'Import'}"

    # ------------------------------------------------------------------
    # Native Landed Cost Voucher generation
    # ------------------------------------------------------------------
    def on_submit(self):
        if frappe.db.get_single_value("BuildSupply Settings", "auto_create_lcv") == 0:
            return
        self.create_landed_cost_voucher()

    def create_landed_cost_voucher(self):
        if self.landed_cost_voucher:
            return  # idempotent
        if not self.purchase_receipt:
            frappe.msgprint(
                _("No Purchase Receipt linked — skipping Landed Cost Voucher. "
                  "Link a Purchase Receipt and re-submit to post valuation."),
                indicator="orange", alert=True,
            )
            return

        capitalized = [
            c for c in (self.charges or [])
            if c.capitalize and c.charge_group != DEDUCTION_GROUP and not c.recoverable
        ]
        if not capitalized:
            return

        lcv = frappe.new_doc("Landed Cost Voucher")
        lcv.company = self.company or frappe.defaults.get_user_default("Company")
        lcv.distribute_charges_based_on = "Distribute Manually"
        lcv.append("purchase_receipts", {
            "receipt_document_type": "Purchase Receipt",
            "receipt_document": self.purchase_receipt,
        })
        lcv.get_items_from_purchase_receipts()

        for c in capitalized:
            lcv.append("taxes", {
                "expense_account": c.lcv_account or self.account_git,
                "description": c.description,
                "amount": flt(c.etb_amount),
            })

        # Manual distribution by each item's computed landed share.
        total = sum(flt(r.landed_total) for r in (self.item_allocation or [])) or 1.0
        share_by_item = {r.item_code: flt(r.landed_total) / total
                         for r in (self.item_allocation or []) if r.item_code}
        charges_total = sum(flt(c.etb_amount) for c in capitalized)
        for item in lcv.items:
            frac = share_by_item.get(item.item_code, 1.0 / max(len(lcv.items), 1))
            item.applicable_charges = round(charges_total * frac, 2)

        lcv.insert(ignore_permissions=True)
        lcv.submit()
        self.db_set("landed_cost_voucher", lcv.name)
        frappe.msgprint(
            _("Landed Cost Voucher {0} created and submitted.").format(lcv.name),
            indicator="green", alert=True,
        )


def get_permission_query_conditions(user):
    if not user:
        user = frappe.session.user
    if "BuildSupply Admin" in frappe.get_roles(user) or "Import Manager" in frappe.get_roles(user):
        return ""
    return "1=0"


def has_permission(doc, ptype, user):
    if not user:
        user = frappe.session.user
    roles = frappe.get_roles(user)
    if "BuildSupply Admin" in roles or "Import Manager" in roles:
        return True
    if ptype == "read" and ("Warehouse Manager" in roles or "Accountant" in roles or "Sales Manager" in roles):
        return True
    return False
