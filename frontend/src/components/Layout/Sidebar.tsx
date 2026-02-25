import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Ship, ShoppingCart,
  Warehouse as WarehouseIcon, Users, UserCheck, BarChart3, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const nav = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/inventory',     icon: Package,         label: 'Inventory'     },
  { to: '/import-orders', icon: Ship,            label: 'Import Orders' },
  { to: '/wholesale',     icon: ShoppingCart,    label: 'Wholesale'     },
  { to: '/warehouse',     icon: WarehouseIcon,   label: 'Warehouse'     },
  { to: '/suppliers',     icon: UserCheck,       label: 'Suppliers'     },
  { to: '/customers',     icon: Users,           label: 'Customers'     },
  { to: '/reports',       icon: BarChart3,       label: 'Reports'       },
];

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0,
      height: '100vh', width: '15rem',
      background: 'var(--sidebar)',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--sidebar-border)',
      zIndex: 40,
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '1.25rem 1rem 1.125rem',
        borderBottom: '1px solid var(--sidebar-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '1.75rem', height: '1.75rem',
            background: 'var(--accent)',
            borderRadius: '0.3rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '0.65rem',
            color: '#fff',
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}>BS</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#FAFAFA',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}>
              Build<span style={{ color: 'var(--accent)' }}>Supply</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              color: 'var(--sidebar-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>Pro</div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          color: 'var(--sidebar-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '0 0.5rem 0.625rem',
        }}>
          Menu
        </div>

        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '0.0625rem',
              fontSize: '0.83rem',
              fontFamily: 'var(--font-body)',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
              background: isActive ? 'rgb(255 255 255 / 0.05)' : 'transparent',
              borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              textDecoration: 'none',
              transition: 'color 0.12s, background 0.12s, border-color 0.12s',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              if (!el.getAttribute('aria-current')) {
                el.style.color = '#D4D4D8';
                el.style.background = 'rgb(255 255 255 / 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              if (!el.getAttribute('aria-current')) {
                el.style.color = 'var(--sidebar-text)';
                el.style.background = 'transparent';
              }
            }}
          >
            <Icon size={14} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Sign out ── */}
      <div style={{ padding: '0.75rem 0.625rem', borderTop: '1px solid var(--sidebar-border)' }}>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            width: '100%',
            padding: '0.45rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.83rem',
            fontFamily: 'var(--font-body)',
            color: 'var(--sidebar-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.12s, background 0.12s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.background = 'rgb(232 82 26 / 0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-muted)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <LogOut size={14} strokeWidth={1.75} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
