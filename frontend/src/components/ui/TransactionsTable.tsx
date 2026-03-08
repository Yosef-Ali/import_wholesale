import { Search, MoreHorizontal, Info, ArrowUpDown } from 'lucide-react';
import { useSalesInvoices } from '../../api/hooks/useOrders';
import { fmtETB } from '../../utils/format';
const STATUS_STYLES: Record<string, string> = {
  Paid:         'bg-[var(--color-success)] text-[var(--color-success-foreground)]',
  Unpaid:       'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]',
  Overdue:      'bg-[var(--color-error)] text-[var(--color-error-foreground)]',
  'Partly Paid':'bg-[var(--color-info)] text-[var(--color-info-foreground)]',
  Cancelled:    'bg-[var(--secondary)] text-[var(--muted-foreground)]',
  Draft:        'bg-[var(--secondary)] text-[var(--muted-foreground)]',
};

const DOT_STYLES: Record<string, string> = {
  Paid:         'bg-[var(--color-success-foreground)]',
  Unpaid:       'bg-[var(--color-warning-foreground)]',
  Overdue:      'bg-[var(--color-error-foreground)]',
  'Partly Paid':'bg-[var(--color-info-foreground)]',
  Cancelled:    'bg-[var(--muted-foreground)]',
  Draft:        'bg-[var(--muted-foreground)]',
};

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_STYLES[status] ?? STATUS_STYLES.Draft;
  const dot   = DOT_STYLES[status]   ?? DOT_STYLES.Draft;
  return (
    <span className={`font-secondary text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

export default function TransactionsTable() {
  const { data: invoices = [], isLoading } = useSalesInvoices();
  const recent = invoices.slice(0, 8);

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">

      {/* Table Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-primary text-xs font-medium text-[var(--muted-foreground)] tracking-widest uppercase">
            Recent Invoices
          </span>
          <Info size={14} className="text-[var(--muted-foreground)]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-full h-9 px-3 w-[200px]">
            <Search size={14} className="text-[var(--muted-foreground)]" />
            <span className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)]">Search invoices...</span>
          </div>
          <MoreHorizontal size={18} className="text-[var(--muted-foreground)]" />
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center bg-[var(--background)] border-b border-[var(--border)] h-11 text-[0.8125rem] font-primary font-medium text-[var(--muted-foreground)]">
        <div className="w-[160px] px-5 flex items-center gap-1">INVOICE <ArrowUpDown size={12} /></div>
        <div className="flex-1 px-3 flex items-center gap-1">CUSTOMER <ArrowUpDown size={12} /></div>
        <div className="w-[110px] px-3 flex items-center gap-1">DATE <ArrowUpDown size={12} /></div>
        <div className="w-[130px] px-3 flex items-center gap-1">AMOUNT <ArrowUpDown size={12} /></div>
        <div className="w-[130px] px-3 flex items-center gap-1">OUTSTANDING <ArrowUpDown size={12} /></div>
        <div className="w-[130px] px-3 flex items-center gap-1">STATUS <ArrowUpDown size={12} /></div>
        <div className="w-[48px] px-3" />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-24">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Data Rows */}
      {!isLoading && recent.map((inv) => (
        <div
          key={inv.name}
          className="flex items-center border-b border-[var(--border)] h-[52px] text-sm font-secondary text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
        >
          <div className="w-[160px] px-5 font-primary text-[0.8125rem] text-[var(--muted-foreground)] truncate">{inv.name}</div>
          <div className="flex-1 px-3 truncate">{inv.customer_name || inv.customer}</div>
          <div className="w-[110px] px-3 text-[var(--muted-foreground)] text-xs">{inv.posting_date}</div>
          <div className="w-[130px] px-3 font-mono text-[0.8125rem] font-semibold">{fmtETB(inv.grand_total || 0)}</div>
          <div className="w-[130px] px-3 font-mono text-[0.8125rem]">
            {inv.outstanding_amount > 0
              ? <span className="text-amber-600">{fmtETB(inv.outstanding_amount)}</span>
              : <span className="text-[var(--color-success-foreground)]">—</span>
            }
          </div>
          <div className="w-[130px] px-3"><StatusBadge status={inv.status || 'Draft'} /></div>
          <div className="w-[48px] px-3 flex justify-center">
            <MoreHorizontal size={16} className="text-[var(--muted-foreground)]" />
          </div>
        </div>
      ))}

      {/* Empty */}
      {!isLoading && recent.length === 0 && (
        <div className="flex items-center justify-center h-24 text-sm font-secondary text-[var(--muted-foreground)]">
          No invoices found
        </div>
      )}
    </div>
  );
}
