import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Search, Bell, MessageSquare, Command, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';
import ToastContainer from '../ui/ToastContainer';
import GuidePanel from '../ui/GuidePanel';
import ChatBot from '../ui/ChatBot';

const breadcrumbMap: Record<string, string> = {
  '/': 'Overview',
  '/inventory': 'Inventory',
  '/import-orders': 'Import Orders',
  '/wholesale': 'Wholesale',
  '/warehouse': 'Warehouse',
  '/suppliers': 'Suppliers',
  '/customers': 'Customers',
  '/reports': 'Reports',
};

export default function AppLayout() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();
  const currentPage = breadcrumbMap[location.pathname] ?? 'Page';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar onGuideOpen={() => setGuideOpen(true)} />

      <div className="ml-[280px] flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between h-14 px-6 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2 font-secondary text-sm">
            <span className="text-[var(--muted-foreground)]">Dashboard</span>
            <span className="text-[var(--muted-foreground)]">&gt;</span>
            <span className="text-[var(--primary)] font-medium">{currentPage}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-full h-9 px-3 w-[200px]">
              <Search size={14} className="text-[var(--muted-foreground)] shrink-0" />
              <span className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)] flex-1">Search...</span>
              <div className="flex items-center gap-1 bg-[var(--secondary)] rounded px-1.5 py-0.5">
                <Command size={10} className="text-[var(--muted-foreground)]" />
                <span className="font-primary text-[0.65rem] text-[var(--muted-foreground)]">K</span>
              </div>
            </div>
            <Bell size={18} className="text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors" />
            <MessageSquare size={18} className="text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors" onClick={() => setChatOpen(true)} />
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

      {/* Floating AI chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem',
            width: 52, height: 52,
            background: 'var(--primary)',
            border: 'none', borderRadius: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 100,
            boxShadow: '0 4px 20px rgba(255,132,0,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(255,132,0,0.45)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(255,132,0,0.35)';
          }}
          title="Ask AI"
        >
          <Sparkles size={22} color="white" strokeWidth={1.75} />
        </button>
      )}

      <ToastContainer />
      {guideOpen && <GuidePanel onClose={() => setGuideOpen(false)} />}
      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
    </div>
  );
}
