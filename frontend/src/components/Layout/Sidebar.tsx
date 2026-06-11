import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Ship, ShoppingCart,
  Warehouse as WarehouseIcon, Users, UserCheck, UserCog, BarChart3, LogOut, BookOpen,
  ChevronDown, ChevronsUpDown, FileText, Printer, ClipboardList, Landmark,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

// Sidebar grouped to mirror the ERPNext modules / import-to-wholesale document flow,
// using the doctype names users recognise (Purchase Order, Sales Order, …).
// See PLAN_UX_ERPNEXT_WORKFLOW.md.
const overviewNav = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
];

const buyingNav = [
  { to: '/import-orders', icon: Ship,            label: 'Purchase Orders' },
  { to: '/suppliers',     icon: UserCheck,       label: 'Suppliers' },
];

const inventoryNav = [
  { to: '/inventory',     icon: Package,         label: 'Items' },
  { to: '/warehouse',     icon: WarehouseIcon,   label: 'Warehouse' },
];

const sellingNav = [
  { to: '/wholesale',     icon: ShoppingCart,    label: 'Sales Orders' },
  { to: '/customers',     icon: Users,           label: 'Customers' },
];

// Finance/admin only — surfaces the accounting side of the import workflow.
const accountingNav = [
  { to: '/cost-sheet',    icon: Landmark,        label: 'Cost Sheet' },
  { to: '/reports',       icon: BarChart3,       label: 'Reports' },
];

// Admin only.
const settingsNav = [
  { to: '/users',         icon: UserCog,         label: 'User Management' },
];

// Admin-only design previews — static HTML mockups served from /public.
// TODO: swap each to its real React route (e.g. /cost-sheet) once the
// landed-cost backend is migrated to production.
const designPreviews = [
  { href: '/import_cost_sheet_preview.html',       icon: FileText,      label: 'Cost Sheet Preview' },
  { href: '/import_cost_sheet_print_preview.html', icon: Printer,       label: 'Cost Sheet (Print)' },
  { href: '/import_intake_form.html',              icon: ClipboardList, label: 'Intake Form' },
];

// ERPNext finance roles that, alongside admins, may see the Accounting group.
const FINANCE_ROLES = ['Accounts Manager', 'Accounts User'];

interface Props { onGuideOpen: () => void }

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="font-secondary text-[0.65rem] font-semibold text-[var(--sidebar-foreground)] tracking-widest uppercase px-4 pt-5 pb-1.5">
      {children}
    </div>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof LayoutDashboard; label: string }) {
  return (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 text-[0.8125rem] font-secondary transition-colors duration-150 ` +
        (isActive
          ? `font-medium text-[var(--sidebar-accent-foreground)] bg-[var(--sidebar-accent)] rounded-md`
          : `font-normal text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] rounded-md`)
      }
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}

function ExternalItem({ href, icon: Icon, label }: { href: string; icon: typeof LayoutDashboard; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-2 text-[0.8125rem] font-secondary font-normal text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] rounded-md transition-colors duration-150"
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </a>
  );
}

export default function Sidebar({ onGuideOpen }: Props) {
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const roles = useAuthStore((s) => s.roles);
  const user = useAuthStore((s) => s.user);
  const displayName = user || 'Guest';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isFinance = isAdmin || roles.some((r) => FINANCE_ROLES.includes(r));

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[var(--sidebar)] flex flex-col border-r border-[var(--sidebar-border)] z-40">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center shrink-0">
            <span className="font-primary font-bold text-xs text-[var(--primary-foreground)]">BS</span>
          </div>
          <div>
            <div className="font-secondary text-[0.65rem] text-[var(--muted-foreground)]">Import & Wholesale</div>
            <div className="font-secondary text-sm font-semibold text-[var(--sidebar-accent-foreground)]">BuildSupply Pro</div>
          </div>
        </div>
        <ChevronsUpDown size={18} className="text-[var(--muted-foreground)] shrink-0" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4">
        <SectionTitle>Overview</SectionTitle>
        {overviewNav.map((item) => <NavItem key={item.to} {...item} />)}

        <SectionTitle>Buying &amp; Import</SectionTitle>
        {buyingNav.map((item) => <NavItem key={item.to} {...item} />)}

        <SectionTitle>Inventory</SectionTitle>
        {inventoryNav.map((item) => <NavItem key={item.to} {...item} />)}

        <SectionTitle>Wholesale &amp; Selling</SectionTitle>
        {sellingNav.map((item) => <NavItem key={item.to} {...item} />)}

        {isFinance && (
          <>
            <SectionTitle>Accounting</SectionTitle>
            {accountingNav.map((item) => <NavItem key={item.to} {...item} />)}
          </>
        )}

        {isAdmin && (
          <>
            <SectionTitle>Settings</SectionTitle>
            {settingsNav.map((item) => <NavItem key={item.to} {...item} />)}
            {designPreviews.map((item) => <ExternalItem key={item.href} {...item} />)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--sidebar-border)]">
        <button
          onClick={onGuideOpen}
          className="flex items-center gap-2.5 w-full p-2 rounded-md text-sm font-secondary text-[var(--sidebar-foreground)] bg-transparent border-none cursor-pointer transition-colors duration-150 mb-0.5 hover:text-[var(--primary)] hover:bg-[var(--sidebar-accent)]"
        >
          <BookOpen size={15} strokeWidth={1.75} />
          Guide
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full p-2 rounded-md text-sm font-secondary text-[var(--sidebar-foreground)] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-red-500 hover:bg-red-500/5"
        >
          <LogOut size={15} strokeWidth={1.75} />
          Sign Out
        </button>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 p-4 border-t border-[var(--sidebar-border)]">
        <div className="w-9 h-9 bg-[var(--secondary)] rounded-full flex items-center justify-center shrink-0">
          <span className="font-secondary text-xs font-medium text-[var(--foreground)]">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-secondary text-sm font-medium text-[var(--sidebar-accent-foreground)] truncate">{displayName}</div>
          <div className="font-secondary text-xs text-[var(--muted-foreground)]">{isAdmin ? 'Administrator' : roles[0] || 'User'}</div>
        </div>
        <ChevronDown size={18} className="text-[var(--muted-foreground)] shrink-0" />
      </div>
    </aside>
  );
}
