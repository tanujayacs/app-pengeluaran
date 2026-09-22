// ============================================================
// Spendly — Mobile Bottom Navigation
// ============================================================
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, BarChart3, Plus, MoreHorizontal,
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import type { TabId } from '../types';
import { useState } from 'react';
import { PieChart, Repeat, Target, Settings } from 'lucide-react';

const mainNavItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'transactions', label: 'History', icon: <ArrowLeftRight className="w-5 h-5" /> },
  // Center = FAB
  { id: 'wallets', label: 'Wallets', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
];

const moreItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'budget', label: 'Budget', icon: <PieChart className="w-5 h-5" /> },
  { id: 'recurring', label: 'Recurring', icon: <Repeat className="w-5 h-5" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export function BottomNav() {
  const { activeTab, setActiveTab, setShowAddModal } = useStore();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 animate-fade-in md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-20 left-4 right-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-3 animate-slide-up">
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowMore(false); }}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors ${
                    activeTab === item.id ? 'bg-primary-500/10 text-primary-500' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {item.icon}
                  <span className="text-[11px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
        <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around py-2">
            {/* First two items */}
            {mainNavItems.slice(0, 2).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item py-1.5 px-3 ${activeTab === item.id ? 'nav-item-active' : ''}`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}

            {/* Center FAB */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </button>

            {/* Last two items */}
            {mainNavItems.slice(2).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item py-1.5 px-3 ${activeTab === item.id ? 'nav-item-active' : ''}`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}

            {/* More button */}
            <button
              onClick={() => setShowMore(!showMore)}
              className={`nav-item py-1.5 px-3 ${['budget', 'recurring', 'goals', 'settings'].includes(activeTab) ? 'nav-item-active' : ''}`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
