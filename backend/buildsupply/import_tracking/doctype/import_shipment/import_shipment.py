# -*- coding: utf-8 -*-
import frappe
from frappe.model.document import Document


class ImportShipment(Document):
    def validate(self):
        self.calculate_landed_cost()
        self.set_title()

    def calculate_landed_cost(self):
        self.total_landed_cost = (
            (self.fob_cost or 0)
            + (self.freight_cost or 0)
            + (self.insurance_cost or 0)
            + (self.customs_duty or 0)
            + (self.sur_tax or 0)
            + (self.vat or 0)
            + (self.other_charges or 0)
        )

    def set_title(self):
        if not self.shipment_title and self.supplier_name:
            self.shipment_title = f"{self.supplier_name} - {self.origin_country or 'Import'}"


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
