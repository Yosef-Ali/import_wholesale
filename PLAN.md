# BuildSupply Pro — ERPNext-Aligned UI Redesign

## Problem
Current UI uses editorial serif fonts (Fraunces), dark dramatic sidebar, warm parchment tones, and heavy inline styles. This feels like a magazine, not an enterprise tool. User wants ERPNext best-practice UX.

## Design Direction: "Clean Enterprise"
Inspired by Frappe CRM, ERPNext v15 workspace, and Frappe UI (Espresso design system).

### Design Tokens
- **Font**: Inter (variable) — ONE font. JetBrains Mono only in table currency cells.
- **Primary**: #2563EB (blue-600, matches Frappe blue)
- **Background**: #F9FAFB (gray-50) page, #FFFFFF cards
- **Text**: #111827 (gray-900), #6B7280 (gray-500 secondary), #9CA3AF (gray-400 muted)
- **Border**: #E5E7EB (gray-200)
- **Status**: green=#059669, red=#DC2626, blue=#2563EB, amber=#D97706, gray=#6B7280

### Components to rebuild (14 files)
1. **index.html** — Inter + JetBrains Mono only
2. **index.css** — Frappe-aligned CSS variables, Tailwind-first
3. **Login.tsx** — Clean centered card on gray-50, blue button, no split-screen
4. **Sidebar.tsx** — Light sidebar (white bg, gray-200 border), blue active indicator
5. **AppLayout.tsx** — Gray-50 background, proper spacing
6. **StatCard.tsx** — White card, subtle border, clean hierarchy
7. **Dashboard/index.tsx** — Clean KPI grid + chart
8. **DataTable.tsx** — Gray-50 header, clean rows, subtle hover
9. **ItemList.tsx** — Tailwind classes, clean header
10. **SalesOrderList.tsx** — Standard status badges
11. **WarehouseList.tsx** — Clean card grid
12. **Suppliers/index.tsx** — Clean page header
13. **Customers/index.tsx** — Clean page header
14. **Reports/index.tsx** — Blue-tinted charts
15. **PurchaseOrderList.tsx** — Clean dual tables + blue button
16. **ShipmentForm.tsx** — Clean slide-over with proper form styling
17. **ToastContainer.tsx** — Standard success/error/info colors
