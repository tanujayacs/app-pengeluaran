// ============================================================
// Spendly — Desktop Sidebar Navigation
// ============================================================
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, PieChart,
  BarChart3, Repeat, Target, Settings, Moon, Sun, Leaf,
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import type { TabId } from '../types';

const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight className="w-5 h-5" /> },
  { id: 'wallets', label: 'Wallets', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'budget', label: 'Budget', icon: <PieChart className="w-5 h-5" /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'recurring', label: 'Recurring', icon: <Repeat className="w-5 h-5" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar() {
  const { activeTab, setActiveTab, theme, toggleTheme } = useStore();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Spendly</h1>
          <p className="text-[11px] text-zinc-400 -mt-0.5">Finance Tracker</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full sidebar-item ${activeTab === item.id ? 'sidebar-item-active' : ''}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 py-4 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={toggleTheme} className="w-full sidebar-item">
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>
    </aside>
  );
}
