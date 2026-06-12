// Import Shipment — reusable customs cost sheet helpers.
// Works for any imported goods and any tax payer / supplier; nothing is hardcoded.
frappe.ui.form.on('Import Shipment', {
  refresh(frm) {
    if (frm.is_new()) return;

    frm.add_custom_button(__('Load Standard Charge Template'), () => {
      const run = (overwrite) =>
        frappe.call({
          method: 'buildsupply.import_tracking.doctype.import_shipment.import_shipment.apply_standard_template',
          args: { shipment: frm.doc.name, overwrite: overwrite ? 1 : 0 },
          freeze: true,
          callback: () => frm.reload_doc(),
        });

      if ((frm.doc.charges || []).length) {
        frappe.confirm(
          __('This shipment already has charge lines. Replace them with the standard template?'),
          () => run(true)
        );
      } else {
        run(false);
      }
    }, __('Cost Sheet'));

    if (frm.doc.landed_cost_voucher) {
      frm.add_custom_button(__('Landed Cost Voucher'), () => {
        frappe.set_route('Form', 'Landed Cost Voucher', frm.doc.landed_cost_voucher);
      }, __('View'));
    }
  },
});
