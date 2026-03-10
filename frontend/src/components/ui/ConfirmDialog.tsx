import { AlertTriangle, X } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }: Props) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={onCancel} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 pt-6 pb-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-primary text-base font-bold text-[var(--foreground)]">{title}</h3>
              <p className="font-secondary text-sm text-[var(--muted-foreground)] mt-1">{message}</p>
            </div>
            <button onClick={onCancel} className="p-1 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>
          <div className="px-6 pb-5 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-secondary font-medium rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-secondary font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Deleting…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
