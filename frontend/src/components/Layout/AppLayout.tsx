import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Search, Bell, Command, Sparkles, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import GuidePanel from '../ui/GuidePanel';
import ChatBot from '../ui/ChatBot';

const breadcrumbMap: Record<string, string> = {
  '/': 'Overview',
  '/inventory': 'Inventory',
  '/import-orders': 'Import Orders',
  '/intake': 'Shipment Intake',
  '/wholesale': 'Wholesale',
  '/warehouse': 'Warehouse',
  '/suppliers': 'Suppliers',
  '/customers': 'Customers',
  '/reports': 'Reports',
  '/users':   'User Management',
};

export default function AppLayout() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPage = breadcrumbMap[location.pathname] ?? 'Page';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar
        onGuideOpen={() => setGuideOpen(true)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:ml-[280px] flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between h-14 px-4 lg:px-6 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2 font-secondary text-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-1.5 -ml-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] bg-transparent border-none cursor-pointer transition-colors"
            >
              <Menu size={18} />
            </button>
            <span className="text-[var(--muted-foreground)]">Dashboard</span>
            <span className="text-[var(--muted-foreground)]">&gt;</span>
            <span className="text-[var(--primary)] font-medium">{currentPage}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-full h-9 px-3 w-[200px]">
              <Search size={14} className="text-[var(--muted-foreground)] shrink-0" />
              <span className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)] flex-1">Search...</span>
              <div className="flex items-center gap-1 bg-[var(--secondary)] rounded px-1.5 py-0.5">
                <Command size={10} className="text-[var(--muted-foreground)]" />
                <span className="font-primary text-[0.65rem] text-[var(--muted-foreground)]">K</span>
              </div>
            </div>
            <Bell size={18} className="text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors" />
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 h-8 px-3 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-all cursor-pointer group"
              title="Ask AI"
            >
              <Sparkles size={14} className="text-[var(--primary)] group-hover:scale-110 transition-transform" />
              <span className="font-secondary text-xs font-semibold text-[var(--primary)]">Ask AI</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center shrink-0">
              <span className="font-secondary text-xs font-semibold text-[var(--primary-foreground)]">SP</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {guideOpen && <GuidePanel onClose={() => setGuideOpen(false)} />}
      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
    </div>
  );
}
