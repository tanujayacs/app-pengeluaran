// ============================================================
// Spendly v2 — Toast Notification
// ============================================================
import { useStore } from '../hooks/useStore';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] max-w-[440px] w-[calc(100%-2rem)] animate-slide-up">
      <div className="bg-white rounded-xl shadow-lg border border-zinc-100 px-4 py-3 flex items-center gap-3">
        {icons[toast.type]}
        <p className="text-sm font-medium text-zinc-700 flex-1">{toast.message}</p>
      </div>
    </div>
  );
}
