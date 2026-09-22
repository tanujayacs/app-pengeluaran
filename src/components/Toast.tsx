// ============================================================
// Spendly — Toast Notification Component
// ============================================================
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export function Toast() {
  const toast = useStore(s => s.toast);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-sky-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    error: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
    info: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[toast.type]}`}>
        {icons[toast.type]}
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={() => useStore.setState({ toast: null })} className="ml-2 opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
