app_name = "buildsupply"
app_title = "BuildSupply Pro"
app_publisher = "Yosef"
app_description = "Import & Wholesale Management for Construction Materials"
app_email = "admin@buildsupply.et"
app_license = "MIT"
app_version = "1.0.0"
app_icon = "octicon octicon-package"
app_color = "#E67E22"

# ---------------------------------------------------------------------------
# App on ERPNext home screen
# ---------------------------------------------------------------------------
add_to_apps_screen = [
    {
        "name": "buildsupply",
        "logo": "/assets/buildsupply/images/logo.svg",
        "title": "BuildSupply Pro",
        "route": "/app/item",
        "has_permission": "buildsupply.utils.has_app_permission",
    }
]

# ---------------------------------------------------------------------------
# Web assets
# ---------------------------------------------------------------------------
app_include_css = ["/assets/buildsupply/css/buildsupply.css"]
app_include_js = ["/assets/buildsupply/js/buildsupply.js"]

# ---------------------------------------------------------------------------
# Fixtures (exported with bench export-fixtures)
# ---------------------------------------------------------------------------
fixtures = [
    {
        "dt": "Role",
        "filters": [
            [
                "name",
                "in",
                [
                    "BuildSupply Admin",
                    "Import Manager",
                    "Warehouse Manager",
                    "Sales Manager",
                    "Sales Rep",
                    "Accountant",
                ],
            ]
        ],
    },
    {"dt": "Custom Field"},
    {"dt": "Property Setter"},
]

# ---------------------------------------------------------------------------
# Website / portal
# ---------------------------------------------------------------------------
website_route_rules = [
    # Let React SPA handle its own routing via Nginx; nothing needed here.
]

# ---------------------------------------------------------------------------
# Scheduled tasks
# ---------------------------------------------------------------------------
scheduler_events = {
    "daily": [
        "buildsupply.utils.check_low_stock_alerts",
        "buildsupply.utils.check_overdue_purchase_orders",
    ],
    "hourly": [
        "buildsupply.utils.update_shipment_status",
    ],
}

# ---------------------------------------------------------------------------
# Permissions (row-level, optional)
# ---------------------------------------------------------------------------
permission_query_conditions = {
    "Import Shipment": "buildsupply.import_tracking.doctype.import_shipment.import_shipment.get_permission_query_conditions",
}

has_permission = {
    "Import Shipment": "buildsupply.import_tracking.doctype.import_shipment.import_shipment.has_permission",
}

# ---------------------------------------------------------------------------
# DocType JS overrides
# ---------------------------------------------------------------------------
doctype_js = {
    "Purchase Order": "public/js/purchase_order.js",
    "Sales Order": "public/js/sales_order.js",
}

# ---------------------------------------------------------------------------
# Override ERPNext whitelisted methods (extend, not replace)
# ---------------------------------------------------------------------------
override_whitelisted_methods = {}

# ---------------------------------------------------------------------------
# Patches
# ---------------------------------------------------------------------------
patches_txt = "buildsupply.patches.patches.txt"

# ---------------------------------------------------------------------------
# Session hooks
# ---------------------------------------------------------------------------
on_session_creation = [
    "buildsupply.utils.on_session_creation",
]
