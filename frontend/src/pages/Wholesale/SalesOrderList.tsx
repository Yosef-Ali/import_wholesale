import { useState, useMemo } from 'react';
import { 
  ShoppingCart, Search, Filter, Plus, FileDown, 
  FileText, Calendar as CalendarIcon, Clock, MoveRight
} from 'lucide-react';
import { useSalesOrders, useSalesInvoices } from '../../api/hooks/useOrders';
import { fmtETB, fmtETBCompact } from '../../utils/format';
import StatCard from '../../components/ui/StatCard';
import PageSkeleton from '../../components/ui/PageSkeleton';
import NewSalesOrderDrawer from './NewSalesOrderDrawer';
import NewSalesInvoiceDrawer from './NewSalesInvoiceDrawer';
import SalesOrderDetailDrawer from './SalesOrderDetailDrawer';
import SalesInvoiceDetailDrawer from './SalesInvoiceDetailDrawer';

// Status Badges
function StatusBadge({ status, bg = 'bg-[var(--secondary)]', text = 'text-[var(--muted-foreground)]' }: { status: string; bg?: string; text?: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-secondary font-bold uppercase tracking-wider ${bg} ${text}`}>{status}</span>;
}

function SOBadge({ status }: { status: string }) {
  let bg = 'bg-[var(--secondary)]', text = 'text-[var(--muted-foreground)]';
  if (status?.match(/To Deliver and Bill|To Deliver|To Bill/i)) { bg = 'bg-amber-500/10'; text = 'text-amber-500'; }
  if (status?.match(/Completed|Closed/i)) { bg = 'bg-[var(--color-success)]/10'; text = 'text-[var(--color-success-foreground)]'; }
  if (status?.match(/Overdue/i)) { bg = 'bg-[var(--color-destructive)]/10'; text = 'text-[var(--color-destructive)]'; }
  return <StatusBadge status={status} bg={bg} text={text} />;
}

function InvoiceBadge({ status }: { status: string }) {
  let bg = 'bg-[var(--secondary)]', text = 'text-[var(--muted-foreground)]';
  if (status?.match(/Unpaid/i)) { bg = 'bg-amber-500/10'; text = 'text-amber-500'; }
  if (status?.match(/Paid/i)) { bg = 'bg-[var(--color-success)]/10'; text = 'text-[var(--color-success-foreground)]'; }
  if (status?.match(/Overdue/i)) { bg = 'bg-[var(--color-destructive)]/10'; text = 'text-[var(--color-destructive)]'; }
  return <StatusBadge status={status} bg={bg} text={text} />;
}

export default function SalesOrderList() {
  const { data: orders = [], isLoading: ordersLoading } = useSalesOrders();
  const { data: invoices = [], isLoading: invoicesLoading } = useSalesInvoices();
  
  const isLoading = ordersLoading || invoicesLoading;
  
  const [activeTab, setActiveTab] = useState<'invoices'|'orders'>('invoices');
  const [search, setSearch] = useState('');
  
  // Drawer States
  const [isNewSODrawerOpen, setIsNewSODrawerOpen] = useState(false);
  const [isNewSIDrawerOpen, setIsNewSIDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  // KPIs
  const unpaidInvoices = useMemo(() => invoices.filter((i: any) => i.status === 'Unpaid' || i.status === 'Partly Paid').reduce((acc: number, i: any) => acc + (i.outstanding_amount || 0), 0), [invoices]);
  const overdueCount = useMemo(() => invoices.filter((i: any) => i.status === 'Overdue').length, [invoices]);
  const activeSOs = useMemo(() => orders.filter(o => o.status !== 'Completed' && o.status !== 'Closed' && o.status !== 'Draft').length, [orders]);
  const totalSales = useMemo(() => invoices.filter((i: any) => i.status !== 'Draft' && i.status !== 'Cancelled').reduce((acc: number, i: any) => acc + (i.grand_total || 0), 0), [invoices]);

  // Filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i: any) => 
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.customer_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [invoices, search]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-0">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-6 mb-0 shrink-0">
        <div>
          <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">Wholesale Sales</h1>
          <p className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)] mt-1 mb-0">Manage customer orders and sales invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-full px-4 py-2 font-secondary text-sm font-medium border-none cursor-pointer hover:bg-[var(--border)] transition-colors">
            <FileDown size={14} /> Export
          </button>
          <button 
            onClick={() => activeTab === 'invoices' ? setIsNewSIDrawerOpen(true) : setIsNewSODrawerOpen(true)}
            className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> {activeTab === 'invoices' ? 'New Invoice' : 'New Order'}
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 shrink-0">
        <StatCard title="Unpaid Invoices" value={fmtETBCompact(unpaidInvoices)} change="Outstanding balance" delay="0.04s" bars={[24, 16, 8, 20]} />
        <StatCard title="Overdue Invoices" value={overdueCount.toString()} change="Requires follow-up" delay="0.08s" bars={[8, 12, 16, 28]} />
        <StatCard title="Active Orders" value={activeSOs.toString()} change="In progress" delay="0.12s" bars={[16, 24, 20, 12]} />
        <StatCard title="Total Sales" value={fmtETBCompact(totalSales)} change="All time invoiced" delay="0.16s" bars={[12, 20, 24, 32]} />
      </div>

      {/* ── Tabs & Toolbar ── */}
      <div className="flex items-center justify-between px-6 border-y border-[var(--border)] bg-[var(--background)] shrink-0 gap-8 h-12">
        <div className="flex items-center h-full">
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-3 h-full font-secondary text-sm font-medium transition-colors border-b-2 bg-transparent cursor-pointer ${activeTab === 'invoices' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
          >
            Sales Invoices
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 h-full font-secondary text-sm font-medium transition-colors border-b-2 bg-transparent cursor-pointer ${activeTab === 'orders' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
          >
            Sales Orders
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab === 'invoices' ? 'invoices...' : 'orders...'}`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-xs font-secondary text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-full px-4 py-1.5 font-secondary text-xs font-medium border-none cursor-pointer hover:bg-[var(--border)] transition-colors">
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="flex flex-col flex-1 px-6 pb-6 relative h-full">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col flex-1 shadow-sm mt-4">
          <div className="overflow-auto flex-1 h-full">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[var(--background)]">
                <tr className="border-b border-[var(--border)] h-10">
                  {activeTab === 'invoices' ? (
                    <>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary w-10"></th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Invoice Info</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Customer</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Timeline</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary text-right">Amount (ETB)</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary w-10"></th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Order Info</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Customer</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Timeline</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary text-right">Total (ETB)</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {activeTab === 'invoices' && filteredInvoices.map((i: any) => (
                  <tr 
                    key={i.name} 
                    onClick={() => setSelectedInvoice(i.name)}
                    className="group hover:bg-[var(--secondary)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                        <FileText size={18} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-primary text-[0.9375rem] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{i.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-secondary text-sm text-[var(--foreground)]">{i.customer_name || i.customer}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-secondary text-sm text-[var(--foreground)] flex items-center gap-1">
                          <CalendarIcon size={12} className="text-[var(--muted-foreground)]"/> {i.posting_date || 'N/A'}
                        </span>
                        <span className="font-secondary text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                          <Clock size={12}/> Due: {i.due_date || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-sm font-medium text-[var(--foreground)]">
                          {fmtETB(i.grand_total || 0)}
                        </span>
                        {i.outstanding_amount > 0 && (
                          <span className="font-mono text-xs text-amber-500 mt-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Bal: {fmtETB(i.outstanding_amount)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceBadge status={i.status || 'Draft'} />
                    </td>
                  </tr>
                ))}
                
                {activeTab === 'orders' && filteredOrders.map((o: any) => (
                  <tr 
                    key={o.name}
                    onClick={() => setSelectedOrder(o.name)}
                    className="group hover:bg-[var(--secondary)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                        <ShoppingCart size={18} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-primary text-[0.9375rem] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-secondary text-sm text-[var(--foreground)]">{o.customer_name || o.customer}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-secondary text-sm text-[var(--foreground)] flex items-center gap-1">
                          <CalendarIcon size={12} className="text-[var(--muted-foreground)]"/> {o.transaction_date || 'N/A'}
                        </span>
                        <span className="font-secondary text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                          <MoveRight size={12}/> Del: {o.delivery_date || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-xs bg-[var(--secondary)] px-2 py-1 rounded text-[var(--foreground)] inline-block">
                        {fmtETB(o.grand_total || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SOBadge status={o.status || 'Draft'} />
                    </td>
                  </tr>
                ))}

                {((activeTab === 'invoices' && filteredInvoices.length === 0) || (activeTab === 'orders' && filteredOrders.length === 0)) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm font-secondary text-[var(--muted-foreground)]">
                      No records found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Drawers */}
      {isNewSODrawerOpen && <NewSalesOrderDrawer onClose={() => setIsNewSODrawerOpen(false)} />}
      {isNewSIDrawerOpen && <NewSalesInvoiceDrawer onClose={() => setIsNewSIDrawerOpen(false)} />}
      {selectedOrder && <SalesOrderDetailDrawer editName={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {selectedInvoice && <SalesInvoiceDetailDrawer editName={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>
  );
}
