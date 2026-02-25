frappe.ui.form.on("Sales Order", {
    refresh(frm) {
        // Show customer credit info
        if (frm.doc.customer) {
            frappe.call({
                method: "buildsupply.api.dashboard.get_customer_credit",
                args: { customer: frm.doc.customer },
                callback(r) {
                    if (r.message) {
                        let credit = r.message;
                        frm.dashboard.add_indicator(
                            __("Credit: {0} ETB / Limit: {1} ETB", [
                                format_currency(credit.outstanding, "ETB"),
                                format_currency(credit.credit_limit, "ETB"),
                            ]),
                            credit.outstanding > credit.credit_limit ? "red" : "green"
                        );
                    }
                },
            });
        }
    },
});
