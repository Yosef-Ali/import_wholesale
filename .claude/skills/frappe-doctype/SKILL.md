---
name: frappe-doctype
description: Add or modify a Frappe/ERPNext DocType in the buildsupply app — including child tables, whitelisted methods, client scripts, and hooks registration. Use when creating a new doctype, adding fields/child tables, or exposing a server method to the UI.
---

# Adding a Frappe DocType (buildsupply app)

Backend app root: `backend/buildsupply/`. Modules live as top-level packages; current ones
are listed in `modules.txt` (Import Tracking, Wholesale Pricing, Customer Credit).

## File layout

A doctype is a folder with three files:

```
backend/buildsupply/<module_snake>/doctype/<name_snake>/
    __init__.py            # empty
    <name_snake>.json      # schema
    <name_snake>.py        # controller (class = PascalCase of the doctype name)
```

Create the `__init__.py` files for any new directories or Frappe won't import them.

## Schema JSON essentials

- `"name"`: human DocType name (e.g. `"Import Charge Line"`); `"module"`: human module name.
- Child tables (rows inside a parent): `"istable": 1`, `"editable_grid": 1`. Add to a parent
  with a `Table` field whose `options` is the child doctype name.
- Submittable docs: `"is_submittable": 1` and add `submit`/`cancel`/`amend` to permissions.
- Currency fields: `"options": "Company:company:default_currency"`. Read-only computed fields:
  `"read_only": 1`. Auto-naming: `"autoname": "IMP-.YYYY.-.#####"` with `"naming_rule": "Expression"`.
- Single (settings) doctype: `"issingle": 1`.
- Validate the JSON parses: `python3 -c "import json,sys; json.load(open(sys.argv[1]))" <file>`.

## Controller (.py)

```python
import frappe
from frappe.model.document import Document

class ImportChargeLine(Document):
    def validate(self):
        ...
```

- **Keep non-trivial math in a pure function** (dict in / dict out) that `validate()` calls, so
  it can be unit-tested with a stubbed `frappe` (see `import_shipment.compute_costsheet` and
  `tests/test_costsheet.py`). Mirror that pattern.
- Expose UI-callable methods with `@frappe.whitelist()`. Resolve the company/defaults from
  `frappe.defaults` or `BuildSupply Settings`, never hardcode.
- Permission helpers (`get_permission_query_conditions`, `has_permission`) are registered in
  `hooks.py` — follow the existing Import Shipment example for role gating.

## Wiring into the app

- Client-side form behaviour: add `public/js/<doctype_snake>.js` (`frappe.ui.form.on(...)`) and
  register it in `hooks.py` under `doctype_js`.
- Print formats: `<module>/print_format/<slug>/<slug>.json` with `"custom_format": 1` and Jinja
  `html` (see `import_cost_sheet`).
- Schema is applied on the site with `bench --site <site> migrate`. Note this in CHANGELOG.

## Definition of done

JSON valid; `python3 -m py_compile` clean; pure-function logic covered by a test; any new UI
method/client script registered in `hooks.py`; migration noted. See `CLAUDE.md`.
