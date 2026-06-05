import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Ship, ShoppingCart,
  Warehouse as WarehouseIcon, Users, UserCheck, UserCog, BarChart3, LogOut, BookOpen,
  ChevronDown, ChevronsUpDown, FileText, Printer, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const mainNav = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory',     icon: Package,         label: 'Inventory' },
  { to: '/import-orders', icon: Ship,            label: 'Import Orders' },
  { to: '/wholesale',     icon: ShoppingCart,    label: 'Wholesale' },
  { to: '/warehouse',     icon: WarehouseIcon,   label: 'Warehouse' },
];

const peopleNav = [
  { to: '/suppliers',  icon: UserCheck, label: 'Suppliers' },
  { to: '/customers',  icon: Users,     label: 'Customers' },
  { to: '/users',      icon: UserCog,   label: 'User Management' },
];

const analyticsNav = [
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

// Admin-only design previews — static HTML mockups served from /public.
// TODO: swap each to its real React route (e.g. /cost-sheet) once the
// landed-cost backend is migrated to production.
const adminNav = [
  { href: '/import_cost_sheet_preview.html',       icon: FileText,      label: 'Cost Sheet Preview' },
  { href: '/import_cost_sheet_print_preview.html', icon: Printer,       label: 'Cost Sheet (Print)' },
  { href: '/import_intake_form.html',              icon: ClipboardList, label: 'Intake Form' },
];

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
        <SectionTitle>Operations</SectionTitle>
        {mainNav.map((item) => <NavItem key={item.to} {...item} />)}

        <SectionTitle>People</SectionTitle>
        {peopleNav.map((item) => <NavItem key={item.to} {...item} />)}

        <SectionTitle>Analytics</SectionTitle>
        {analyticsNav.map((item) => <NavItem key={item.to} {...item} />)}

        {isAdmin && (
          <>
            <SectionTitle>Admin</SectionTitle>
            {adminNav.map((item) => <ExternalItem key={item.href} {...item} />)}
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
          <span className="font-secondary text-xs font-medium text-[var(--foreground)]">SP</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-secondary text-sm font-medium text-[var(--sidebar-accent-foreground)] truncate">Salung Prastyo</div>
          <div className="font-secondary text-xs text-[var(--muted-foreground)]">Pro Plan</div>
        </div>
        <ChevronDown size={18} className="text-[var(--muted-foreground)] shrink-0" />
      </div>
    </aside>
  );
}
