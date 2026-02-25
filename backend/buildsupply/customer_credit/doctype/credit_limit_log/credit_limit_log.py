# -*- coding: utf-8 -*-
import frappe
from frappe.model.document import Document


class CreditLimitLog(Document):
    def validate(self):
        if self.new_limit and self.new_limit < 0:
            frappe.throw("Credit limit cannot be negative")

    def after_insert(self):
        """Update the customer's credit limit in ERPNext."""
        if self.customer and self.new_limit is not None:
            frappe.db.set_value("Customer", self.customer, "credit_limit", self.new_limit)
