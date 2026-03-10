FROM frappe/erpnext:v16.6.1

USER frappe
WORKDIR /home/frappe/frappe-bench

COPY --chown=frappe:frappe backend/ apps/buildsupply
RUN ./env/bin/pip install --no-deps -e apps/buildsupply && \
    echo "buildsupply" >> apps.txt
