import { useState, useMemo } from 'react';
import { 
  Package, Search, Filter, Plus, FileDown, Ship,
  Clock, ArrowRight, MapPin, Calendar as CalendarIcon, Hash
} from 'lucide-react';
import { usePurchaseOrders, useImportShipments } from '../../api/hooks/useOrders';
import { fmtETB, fmtETBCompact } from '../../utils/format';
import StatCard from '../../components/ui/StatCard';
import NewShipmentDrawer from './NewShipmentDrawer';
import ShipmentDetailDrawer from './ShipmentDetailDrawer';

// Status Badges
function ShipmentBadge({ status }: { status: string }) {
  let bg = 'bg-[var(--secondary)]';
  let text = 'text-[var(--muted-foreground)]';
  
  if (!!status?.match(/Transit|Shipped/i)) { bg = 'bg-blue-500/10'; text = 'text-blue-500'; }
  if (!!status?.match(/Completed|Cleared|Warehouse/i)) { bg = 'bg-[var(--color-success)]/10'; text = 'text-[var(--color-success-foreground)]'; }
  if (!!status?.match(/Ordered/i)) { bg = 'bg-amber-500/10'; text = 'text-amber-500'; }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-secondary font-bold uppercase tracking-wider ${bg} ${text}`}>
      {status}
    </span>
  );
}

function POBadge({ status }: { status: string }) {
  let bg = 'bg-[var(--secondary)]';
  let text = 'text-[var(--muted-foreground)]';
  
  if (status === 'Draft') { bg = 'bg-[var(--secondary)]'; text = 'text-[var(--muted-foreground)]'; }
  if (status === 'To Receive and Bill' || status === 'To Receive') { bg = 'bg-amber-500/10'; text = 'text-amber-500'; }
  if (status === 'Completed' || status === 'Closed') { bg = 'bg-[var(--color-success)]/10'; text = 'text-[var(--color-success-foreground)]'; }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-secondary font-bold uppercase tracking-wider ${bg} ${text}`}>
      {status}
    </span>
  );
}

export default function PurchaseOrderList() {
  const { data: orders = [], isLoading: ordersLoading } = usePurchaseOrders();
  const { data: shipments = [], isLoading: shipmentsLoading } = useImportShipments();
  
  const [activeTab, setActiveTab] = useState<'shipments'|'pos'>('shipments');
  const [search, setSearch] = useState('');
  
  // Drawer States
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);

  // KPIs
  const activePOs = orders.filter(o => o.status !== 'Completed' && o.status !== 'Closed' && o.status !== 'Draft').length;
  const inTransit = shipments.filter(s => s.status?.includes('Transit') || s.status?.includes('Port') || s.status?.includes('Shipped')).length;
  const totalLanded = shipments.reduce((acc, s) => acc + (s.total_landed_cost || 0), 0);
  const pendingClearance = shipments.filter(s => s.status?.includes('Pending Clearance') || s.status?.includes('Customs')).length;

  // Filtering
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.shipment_title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [shipments, search]);

  const filteredPOs = useMemo(() => {
    return orders.filter(o => 
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  return (
    <div className="flex flex-col gap-0">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-6 mb-0 shrink-0">
        <div>
          <h1 className="font-secondary text-2xl font-bold text-[var(--foreground)] m-0">Import Orders</h1>
          <p className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)] mt-1 mb-0">Manage overseas purchases and track inbound shipments</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-full px-4 py-2 font-secondary text-sm font-medium border-none cursor-pointer hover:bg-[var(--border)] transition-colors">
            <FileDown size={14} /> Export
          </button>
          <button 
            onClick={() => setIsNewDrawerOpen(true)}
            className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> New Shipment
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 shrink-0">
        <StatCard title="In-Transit" value={inTransit.toString()} change="Shipments on water" delay="0.04s" bars={[8, 16, 24, 20]} />
        <StatCard title="Pending Clearance" value={pendingClearance.toString()} change="Awaiting customs" delay="0.08s" bars={[16, 24, 12, 28]} />
        <StatCard title="Active POs" value={activePOs.toString()} change="Awaiting fulfillment" delay="0.12s" bars={[24, 12, 8, 16]} />
        <StatCard title="Total Landed Cost" value={fmtETBCompact(totalLanded)} change="Cumulative value" delay="0.16s" bars={[12, 20, 16, 28]} />
      </div>

      {/* ── Tabs & Toolbar ── */}
      <div className="flex items-center justify-between px-6 border-y border-[var(--border)] bg-[var(--background)] shrink-0 gap-8 h-12">
        <div className="flex items-center h-full">
          <button 
            onClick={() => setActiveTab('shipments')}
            className={`px-4 py-3 h-full font-secondary text-sm font-medium transition-colors border-b-2 bg-transparent cursor-pointer ${activeTab === 'shipments' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
          >
            Import Shipments
          </button>
          <button 
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-3 h-full font-secondary text-sm font-medium transition-colors border-b-2 bg-transparent cursor-pointer ${activeTab === 'pos' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
          >
            Purchase Orders
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab === 'shipments' ? 'shipments...' : 'orders...'}`}
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
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col flex-1 shadow-sm">
          {(activeTab === 'shipments' ? shipmentsLoading : ordersLoading) && (
            <div className="absolute inset-0 bg-[#00000020] backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <div className="overflow-auto flex-1 h-full">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[var(--background)]">
                <tr className="border-b border-[var(--border)] h-10">
                  {activeTab === 'shipments' ? (
                    <>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary w-10"></th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary whitespace-nowrap">Shipment Info</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Supplier & Origin</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Timeline</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Landed Cost</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary w-10"></th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary whitespace-nowrap">Order Info</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Supplier</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Details</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Total (ETB)</th>
                      <th className="px-4 py-2 text-[0.6875rem] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-primary">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {activeTab === 'shipments' && filteredShipments.map((s) => (
                  <tr 
                    key={s.name} 
                    onClick={() => setSelectedShipment(s.name)}
                    className="group hover:bg-[var(--secondary)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                        <Ship size={18} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-primary text-[0.9375rem] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{s.shipment_title || s.name}</span>
                        <span className="font-secondary text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                          <Hash size={12}/> {s.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-secondary text-sm text-[var(--foreground)]">{s.supplier_name}</span>
                        <span className="font-secondary text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                          <MapPin size={12} /> {s.origin_country || 'Unknown Origin'} <ArrowRight size={10} /> {s.destination_warehouse || 'DJI'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-secondary text-sm text-[var(--foreground)] flex items-center gap-1">
                          <CalendarIcon size={12} className="text-[var(--muted-foreground)]"/> {s.order_date || 'N/A'}
                        </span>
                        <span className="font-secondary text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                          <Clock size={12}/> ETA: {s.eta || 'TBD'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-[var(--secondary)] px-2 py-1 rounded text-[var(--foreground)]">
                        {fmtETB(s.total_landed_cost || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ShipmentBadge status={s.status || 'Draft'} />
                    </td>
                  </tr>
                ))}
                
                {activeTab === 'pos' && filteredPOs.map((o) => (
                  <tr 
                    key={o.name}
                    onClick={() => window.open(`http://localhost:8081/app/purchase-order/${o.name}`, '_blank')}
                    className="group hover:bg-[var(--secondary)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--secondary)] text-[var(--muted-foreground)] flex items-center justify-center">
                        <Package size={18} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-primary text-[0.9375rem] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-secondary text-sm text-[var(--foreground)]">{o.supplier_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-secondary text-sm text-[var(--foreground)] flex items-center gap-1">
                          <CalendarIcon size={12} className="text-[var(--muted-foreground)]"/> {o.transaction_date}
                        </span>
                        <span className="font-secondary text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                          <Clock size={12}/> Req: {o.schedule_date || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-[var(--secondary)] px-2 py-1 rounded text-[var(--foreground)]">
                        {fmtETB(o.grand_total || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <POBadge status={o.status || 'Draft'} />
                    </td>
                  </tr>
                ))}

                {((activeTab === 'shipments' && filteredShipments.length === 0) || (activeTab === 'pos' && filteredPOs.length === 0)) && (
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
      {isNewDrawerOpen && (
        <NewShipmentDrawer onClose={() => setIsNewDrawerOpen(false)} />
      )}
      
      {selectedShipment && (
        <ShipmentDetailDrawer editName={selectedShipment} onClose={() => setSelectedShipment(null)} />
      )}
    </div>
  );
}
