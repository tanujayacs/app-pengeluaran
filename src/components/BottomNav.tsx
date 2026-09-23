// ============================================================
// Spendly v2 — Bottom Navigation (5 Tabs, Fixed Footer)
// ============================================================
import { BookOpen, CreditCard, BarChart3, HandCoins, Settings } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import type { TabId } from '../types';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'transaksi', label: 'Transaksi', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'rekening', label: 'Rekening', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'rekap', label: 'Rekap', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'hutang', label: 'Hutang', icon: <HandCoins className="w-5 h-5" /> },
  { id: 'setting', label: 'Setting', icon: <Settings className="w-5 h-5" /> },
];

export function BottomNav() {
  const { activeTab, setActiveTab, subPage } = useStore();

  if (subPage) return null; // Hide on sub-pages

  return (
    <footer className="shrink-0 w-full max-w-[480px] bg-white/95 backdrop-blur-xl border-t border-zinc-200 z-30 select-none">
      <div className="flex items-center justify-around pt-1 pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab flex-1 ${activeTab === tab.id ? 'nav-tab-active font-semibold' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      {/* iPhone Home Indicator space / safe area */}
      <div className="h-[env(safe-area-inset-bottom,8px)] min-h-[6px] w-full" />
    </footer>
  );
}
