// ============================================================
// Spendly — Main App Entry
// ============================================================
import { useEffect } from 'react';
import { useStore } from './hooks/useStore';
import { seedDatabase } from './db';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { AddTransactionModal } from './features/transactions/AddTransactionModal';
import { Dashboard } from './features/dashboard/Dashboard';
import { TransactionList } from './features/transactions/TransactionList';
import { WalletsPage } from './features/wallets/WalletsPage';
import { BudgetPage } from './features/budget/BudgetPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { RecurringPage } from './features/recurring/RecurringPage';
import { GoalsPage } from './features/goals/GoalsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { Plus } from 'lucide-react';

function App() {
  const {
    activeTab, theme, showAddModal, setShowAddModal,
    editingTransaction, setEditingTransaction, loadAllData,
  } = useStore();

  // Initialize database and load data
  useEffect(() => {
    const init = async () => {
      await seedDatabase();
      await loadAllData();
    };
    init();
  }, [loadAllData]);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <TransactionList />;
      case 'wallets': return <WalletsPage />;
      case 'budget': return <BudgetPage />;
      case 'reports': return <ReportsPage />;
      case 'recurring': return <RecurringPage />;
      case 'goals': return <GoalsPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {renderPage()}
        </div>
      </main>

      {/* Desktop FAB (hidden on mobile since BottomNav has one) */}
      <button
        onClick={() => setShowAddModal(true)}
        className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 items-center justify-center hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-95 transition-all z-30"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Add/Edit Transaction Modal */}
      <AddTransactionModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTransaction(null);
        }}
        editTransaction={editingTransaction}
      />

      {/* Toast */}
      <Toast />
    </div>
  );
}

export default App;
