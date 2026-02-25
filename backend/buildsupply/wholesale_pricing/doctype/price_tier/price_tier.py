# -*- coding: utf-8 -*-
import frappe
from frappe.model.document import Document


class PriceTier(Document):
    def validate(self):
        self.validate_rules()

    def validate_rules(self):
        """Ensure quantity ranges don't overlap for the same item."""
        items = {}
        for rule in self.rules or []:
            key = rule.item_code or "__default__"
            if key not in items:
                items[key] = []
            items[key].append(rule)

        for item_code, rules in items.items():
            sorted_rules = sorted(rules, key=lambda r: r.min_qty or 0)
            for i in range(1, len(sorted_rules)):
                prev_max = sorted_rules[i - 1].max_qty or float("inf")
                curr_min = sorted_rules[i].min_qty or 0
                if curr_min <= prev_max:
                    frappe.throw(
                        f"Overlapping quantity ranges for item {item_code}: "
                        f"{sorted_rules[i-1].min_qty}-{sorted_rules[i-1].max_qty} and "
                        f"{sorted_rules[i].min_qty}-{sorted_rules[i].max_qty}"
                    )
