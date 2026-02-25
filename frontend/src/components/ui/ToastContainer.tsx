import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />,
  error:   <XCircle    className="w-5 h-5 text-red-500   shrink-0" />,
  info:    <Info       className="w-5 h-5 text-blue-500  shrink-0" />,
};

const styles = {
  success: 'border-green-200 bg-green-50',
  error:   'border-red-200   bg-red-50',
  info:    'border-blue-200  bg-blue-50',
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md text-sm text-slate-800 ${styles[t.type]}`}
        >
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
