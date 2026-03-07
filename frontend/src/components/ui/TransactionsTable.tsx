import { Search, Plus, MoreHorizontal, Info, ArrowUpDown } from 'lucide-react';

interface Transaction {
  id: string;
  customer: string;
  product: string;
  status: 'Success' | 'Pending' | 'Refunded';
  qty: number;
  unitPrice: string;
  totalRevenue: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: '#04910', customer: 'Ryan Korsgaard', product: 'Ergo Office Chair', status: 'Success', qty: 12, unitPrice: '$3,450', totalRevenue: '$41,400' },
  { id: '#04911', customer: 'Madelyn Lubin', product: 'Sunset Desk 02', status: 'Success', qty: 20, unitPrice: '$2,980', totalRevenue: '$89,200' },
  { id: '#04912', customer: 'Abram Bergson', product: 'Eco Bookshelf', status: 'Pending', qty: 22, unitPrice: '$1,750', totalRevenue: '$75,900' },
  { id: '#04913', customer: 'Phillip Mango', product: 'Green Leaf Desk', status: 'Refunded', qty: 24, unitPrice: '$1,950', totalRevenue: '$19,500' },
];

function StatusBadge({ status }: { status: Transaction['status'] }) {
  const styles = {
    Success: 'bg-[var(--color-success)] text-[var(--color-success-foreground)]',
    Pending: 'bg-[var(--color-error)] text-[var(--color-error-foreground)]',
    Refunded: 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
  };

  return (
    <span className={`font-secondary text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'Success' ? 'bg-[var(--color-success-foreground)]' :
        status === 'Pending' ? 'bg-[var(--color-error-foreground)]' :
        'bg-[var(--muted-foreground)]'
      }`} />
      {status}
    </span>
  );
}

export default function TransactionsTable() {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-primary text-xs font-medium text-[var(--muted-foreground)] tracking-widest uppercase">
            Recent Transactions
          </span>
          <Info size={14} className="text-[var(--muted-foreground)]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-full h-9 px-3 w-[200px]">
            <Search size={14} className="text-[var(--muted-foreground)]" />
            <span className="font-secondary text-[0.8125rem] text-[var(--muted-foreground)]">Search transactions...</span>
          </div>
          <button className="flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-4 py-2 font-primary text-sm font-medium">
            <Plus size={14} />
            Add Transaction
          </button>
          <MoreHorizontal size={18} className="text-[var(--muted-foreground)]" />
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center bg-[var(--background)] border-b border-[var(--border)] h-11 text-[0.8125rem] font-primary font-medium text-[var(--muted-foreground)]">
        <div className="w-12 flex items-center justify-center">
          <div className="w-4 h-4 border border-[var(--border)] rounded" />
        </div>
        <div className="w-20 px-3 flex items-center gap-1">ID <ArrowUpDown size={12} /></div>
        <div className="flex-1 px-3 flex items-center gap-1">CUSTOMER <ArrowUpDown size={12} /></div>
        <div className="flex-1 px-3 flex items-center gap-1">PRODUCT <ArrowUpDown size={12} /></div>
        <div className="w-[110px] px-3 flex items-center gap-1">STATUS <ArrowUpDown size={12} /></div>
        <div className="w-[70px] px-3 flex items-center gap-1">QTY <ArrowUpDown size={12} /></div>
        <div className="w-[110px] px-3 flex items-center gap-1">UNIT PRICE <ArrowUpDown size={12} /></div>
        <div className="w-[130px] px-3 flex items-center gap-1">TOTAL REVENUE <ArrowUpDown size={12} /></div>
        <div className="w-[60px] px-3 text-center">ACTIONS</div>
      </div>

      {/* Data Rows */}
      {TRANSACTIONS.map((tx) => (
        <div key={tx.id} className="flex items-center border-b border-[var(--border)] h-[52px] text-sm font-secondary text-[var(--foreground)]">
          <div className="w-12 flex items-center justify-center">
            <div className="w-4 h-4 border border-[var(--border)] rounded" />
          </div>
          <div className="w-20 px-3 font-primary text-[0.8125rem] text-[var(--muted-foreground)]">{tx.id}</div>
          <div className="flex-1 px-3">{tx.customer}</div>
          <div className="flex-1 px-3">{tx.product}</div>
          <div className="w-[110px] px-3"><StatusBadge status={tx.status} /></div>
          <div className="w-[70px] px-3 text-center">{tx.qty}</div>
          <div className="w-[110px] px-3">{tx.unitPrice}</div>
          <div className="w-[130px] px-3 font-semibold">{tx.totalRevenue}</div>
          <div className="w-[60px] px-3 flex justify-center">
            <MoreHorizontal size={16} className="text-[var(--muted-foreground)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
