frappe.ui.form.on("Purchase Order", {
    refresh(frm) {
        // Add "Create Import Shipment" button on submitted PO
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__("Import Shipment"), function () {
                frappe.new_doc("Import Shipment", {
                    purchase_order: frm.doc.name,
                    supplier: frm.doc.supplier,
                    supplier_name: frm.doc.supplier_name,
                });
            }, __("Create"));
        }
    },
});
