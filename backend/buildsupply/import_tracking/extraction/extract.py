# -*- coding: utf-8 -*-
"""Scan -> Import Shipment extraction scaffolding.

Two layers:

  1. ``apply_extracted_payload`` — the stable layer. Takes a *canonical JSON payload*
     (header dict + charges list + items list) and populates / creates an Import Shipment.
     This works today; pipe it manually-keyed JSON or OCR output alike.

  2. ``extract_from_attachments`` — the pluggable OCR layer. A stub that, once the real
     scans arrive, reads the attached files and emits the canonical payload using
     ``field_map.json`` as the label map. Wire your OCR/LLM of choice here.

Canonical payload shape::

    {
      "header": {"declaration_number": "...", "supplier": "...", "dvp_value": 0, ...},
      "charges": [{"description": "...", "charge_group": "Duty & Tax", "etb_amount": 0,
                   "is_fob": 0, "recoverable": 0}],
      "items":   [{"item_code": "...", "description": "...", "qty": 0,
                   "fob_unit_price": 0}]   # weight_basis is derived if omitted
    }
"""
import json
import os

import frappe
from frappe import _

HEADER_FIELDS = {
    "tax_payer", "tin_number", "declaration_number", "item_description",
    "bank_permit_number", "commercial_invoice_no", "bl_number", "fcy_rate",
    "invoice_value_fcy", "dvp_value", "supplier", "origin_country", "shipment_title",
}


def get_field_map():
    path = os.path.join(os.path.dirname(__file__), "field_map.json")
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


@frappe.whitelist()
def get_extraction_schema():
    """Expose the document/field map (drives the data-entry & OCR templates)."""
    return get_field_map()


def _coerce_payload(payload):
    if isinstance(payload, str):
        payload = json.loads(payload)
    return payload or {}


@frappe.whitelist()
def apply_extracted_payload(payload, shipment=None):
    """Populate an Import Shipment from a canonical extracted payload.

    If ``shipment`` is given, updates that draft; otherwise creates a new one.
    Returns the shipment name. Server-side validate() recomputes all totals, so the
    extraction only needs to supply raw header values, charge amounts and item lines.
    """
    payload = _coerce_payload(payload)
    header = payload.get("header") or {}

    doc = (frappe.get_doc("Import Shipment", shipment)
           if shipment else frappe.new_doc("Import Shipment"))

    for key, val in header.items():
        if key in HEADER_FIELDS and val not in (None, ""):
            doc.set(key, val)
    if not doc.get("shipment_title"):
        doc.shipment_title = header.get("supplier") or "Imported Shipment"
    if not doc.get("status"):
        doc.status = "Customs Clearance"
    if not doc.get("order_date"):
        doc.order_date = frappe.utils.today()

    if payload.get("charges") is not None:
        doc.set("charges", [])
        for c in payload["charges"]:
            doc.append("charges", {
                "sn": c.get("sn"),
                "description": c.get("description"),
                "charge_group": c.get("charge_group") or "Other",
                "etb_amount": frappe.utils.flt(c.get("etb_amount")),
                "customs_amount": frappe.utils.flt(c.get("customs_amount") or c.get("etb_amount")),
                "is_fob": 1 if c.get("is_fob") else 0,
                "recoverable": 1 if c.get("recoverable") else 0,
                "capitalize": 0 if c.get("recoverable") else 1,
                "distribute": 0 if c.get("recoverable") else 1,
            })

    if payload.get("items") is not None:
        doc.set("item_allocation", [])
        for it in payload["items"]:
            qty = frappe.utils.flt(it.get("qty"))
            basis = it.get("weight_basis")
            if basis in (None, "") and it.get("fob_unit_price") is not None:
                basis = qty * frappe.utils.flt(it.get("fob_unit_price"))
            doc.append("item_allocation", {
                "item_code": it.get("item_code"),
                "description": it.get("description"),
                "qty": qty,
                "weight_basis": frappe.utils.flt(basis),
            })

    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return {"shipment": doc.name, "purchase_total": doc.purchase_total,
            "message": _("Shipment {0} populated from extracted data.").format(doc.name)}


@frappe.whitelist()
def extract_from_attachments(shipment):
    """OCR layer — to be implemented once real document scans are available.

    Intended flow: read the files attached to ``shipment`` (bill_of_lading, packing_list,
    commercial_invoice, customs_declaration, ...), run OCR/LLM extraction guided by
    field_map.json, build the canonical payload, then call ``apply_extracted_payload``.
    """
    frappe.throw(_(
        "OCR extraction is not configured yet. Send a sample scan set so the label "
        "anchors in field_map.json can be calibrated, then this method will read the "
        "attachments and auto-fill the shipment. Until then, use apply_extracted_payload "
        "with a JSON payload."
    ))
