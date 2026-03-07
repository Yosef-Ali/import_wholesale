import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface Props { onClose: () => void }

const sections = [
  {
    id: 'dashboard', label: 'Dashboard',
    content: (
      <>
        <p>Live KPI cards showing: total stock value, pending purchase orders, active shipments, monthly sales, low stock items, and overdue POs. Red cards need immediate attention.</p>
        <p style={{ marginTop: '0.5rem' }}>The <strong>Sales Trend</strong> chart shows 6 months of invoiced sales. The <strong>Import Pipeline</strong> shows how many shipments are at each stage: Ordered → In Transit → At Port → Customs → Warehouse.</p>
      </>
    ),
  },
  {
    id: 'import-orders', label: 'Import Orders',
    content: (
      <>
        <p><strong>Purchase Orders</strong> are created in ERPNext and show here automatically. Click any row to open it in ERPNext.</p>
        <p style={{ marginTop: '0.5rem' }}><strong>Import Shipments</strong> track the physical journey of goods. Use the <em>+ New Shipment</em> button to create one. Fill in: origin country, ETA, status, and the full landed cost breakdown:</p>
        <div style={{ marginTop: '0.625rem', background: 'var(--border-subtle)', borderRadius: '0.375rem', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: 2 }}>
          FOB + Freight + Insurance<br />
          + Customs Duty + Sur Tax + VAT<br />
          + Other Charges<br />
          <span style={{ borderTop: '1px solid var(--border)', display: 'block', marginTop: '0.25rem', paddingTop: '0.25rem', color: 'var(--text)', fontWeight: 600 }}>= Total Landed Cost</span>
        </div>
        <p style={{ marginTop: '0.5rem' }}>Update the shipment status as it moves through the pipeline.</p>
      </>
    ),
  },
  {
    id: 'inventory', label: 'Inventory',
    content: (
      <>
        <p>Browse all construction material items. Use the <strong>group filter</strong> (top right) to narrow by category. Click any row to open the item in ERPNext.</p>
        <p style={{ marginTop: '0.5rem' }}>Items below their Safety Stock level appear as alerts on the Dashboard. Set Safety Stock in ERPNext under the item's Inventory tab.</p>
      </>
    ),
  },
  {
    id: 'warehouse', label: 'Warehouse',
    content: (
      <p>Card view of all warehouses showing item count and total stock value. Click a card to open it in ERPNext where you can view the full stock ledger and transfer stock between locations.</p>
    ),
  },
  {
    id: 'customers', label: 'Customers',
    content: (
      <p>Table of all wholesale customers showing their group, territory, and credit limit in ETB. A dash (—) means no credit limit is set. Click a row to open the customer in ERPNext.</p>
    ),
  },
  {
    id: 'suppliers', label: 'Suppliers',
    content: (
      <p>Directory of international suppliers with their country and type. Click a row to open in ERPNext and view purchase history or payment details.</p>
    ),
  },
  {
    id: 'wholesale', label: 'Wholesale Sales',
    content: (
      <>
        <p>All Sales Orders from wholesale customers. Status badges:</p>
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            ['To Deliver and Bill', '#2563EB'],
            ['To Deliver', '#7C3AED'],
            ['To Bill', '#D97706'],
            ['Completed', '#059669'],
            ['Cancelled', '#94A3B8'],
          ].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '0.5rem' }}>Click a row to open the Sales Order in ERPNext to deliver goods or raise an invoice.</p>
      </>
    ),
  },
  {
    id: 'reports', label: 'Reports',
    content: (
      <>
        <p><strong>Top Selling Items</strong> — bar chart of the top 10 items by revenue over the past year.</p>
        <p style={{ marginTop: '0.375rem' }}><strong>Top Customers</strong> — pie chart of top 10 customers by revenue this year.</p>
        <p style={{ marginTop: '0.375rem' }}>Hover over any chart element to see the exact ETB amount.</p>
      </>
    ),
  },
  {
    id: 'roles', label: 'Roles',
    content: (
      <>
        <p>Roles are assigned in ERPNext (User record → Roles table):</p>
        <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {[
            ['BuildSupply Admin', 'Full access to everything'],
            ['Import Manager', 'Create & manage shipments and POs'],
            ['Warehouse Manager', 'Inventory and warehouse access'],
            ['Sales Manager', 'Customers, sales orders, reports'],
            ['Sales Rep', 'View customers and sales orders'],
            ['Accountant', 'Dashboard, reports, view shipments'],
          ].map(([role, desc]) => (
            <div key={role} style={{ padding: '0.5rem 0.625rem', background: 'var(--border-subtle)', borderRadius: '0.375rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text)', marginBottom: '0.125rem' }}>{role}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </>
    ),
  },
];

export default function GuidePanel({ onClose }: Props) {
  const [active, setActive] = useState('dashboard');

  const activeSection = sections.find((s) => s.id === active)!;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(2px)',
          zIndex: 200,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0,
        width: 'min(520px, 100vw)',
        height: '100vh',
        background: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        zIndex: 201,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
        animation: 'slideIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>
              App Guide
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              BuildSupply Pro — quick reference
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a
              href="http://localhost:8081"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                background: 'transparent',
                transition: 'border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              <ExternalLink size={13} strokeWidth={1.75} />
              ERPNext
            </a>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32,
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Body: two-column */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Section list */}
          <div style={{
            width: '160px',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            padding: '0.625rem 0',
            overflowY: 'auto',
          }}>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: active === s.id ? 600 : 400,
                  color: active === s.id ? 'var(--primary)' : 'var(--text-secondary)',
                  background: active === s.id ? 'var(--primary-subtle)' : 'transparent',
                  border: 'none',
                  borderLeft: `2px solid ${active === s.id ? 'var(--primary)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'color 0.1s, background 0.1s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Section content */}
          <div style={{
            flex: 1,
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--text)',
              marginBottom: '0.875rem',
            }}>
              {activeSection.label}
            </h2>
            {activeSection.content}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}
