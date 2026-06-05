// BuildSupply Settings — one-click GL account seeding for the import workflow.
frappe.ui.form.on('BuildSupply Settings', {
  refresh(frm) {
    frm.add_custom_button(__('Seed Import GL Accounts'), () => {
      frappe.confirm(
        __('Create/locate the 5200 / 1440 / 1420 / 2400 accounts in the chart of accounts and save them here?'),
        () => {
          frappe.call({
            method: 'buildsupply.import_tracking.setup.seed_import_accounts',
            args: { company: frm.doc.default_company || null },
            freeze: true,
            freeze_message: __('Seeding import accounts…'),
            callback: (r) => {
              if (r.message) {
                frappe.msgprint({
                  title: __('Import Accounts Ready'),
                  message: r.message.message,
                  indicator: 'green',
                });
                frm.reload_doc();
              }
            },
          });
        }
      );
    }).addClass('btn-primary');
  },
});
