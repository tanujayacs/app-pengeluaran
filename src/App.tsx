// ============================================================
// Spendly v2 — Main App
// ============================================================
import { useEffect, useState } from 'react';
import { useStore } from './hooks/useStore';
import { seedDatabase } from './db';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { themeColors } from './utils/formatters';

// Feature pages
import { TransaksiPage } from './features/transaksi/TransaksiPage';
import { AddTransactionModal } from './features/transaksi/AddTransactionModal';
import { RiwayatPage } from './features/transaksi/RiwayatPage';
import { TemplateApplyModal } from './features/transaksi/TemplateApplyModal';
import { TransactionDetailModal } from './features/transaksi/TransactionDetailModal';
import { RekeningPage } from './features/rekening/RekeningPage';
import { RekapPage } from './features/rekap/RekapPage';
import { HutangPage } from './features/hutang/HutangPage';
import { SettingPage } from './features/setting/SettingPage';
import { TemplatePage } from './features/setting/TemplatePage';

import { Plus, X, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, FileText } from 'lucide-react';
import type { Transaction } from './types';

function App() {
  const { activeTab, subPage, settings, loadAllData } = useStore();

  // FAB state
  const [fabOpen, setFabOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Detail & edit state
  const [detailTxn, setDetailTxn] = useState<Transaction | null>(null);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);

  useEffect(() => {
    const init = async () => {
      await seedDatabase();
      await loadAllData();
    };
    init();
    // Apply theme color on mount
    const t = themeColors[settings.themeColor] || themeColors.blue;
    document.documentElement.style.setProperty('--color-primary', t.primary);
    document.documentElement.style.setProperty('--color-primary-light', t.light);
    document.documentElement.style.setProperty('--color-primary-dark', t.dark);
  }, []);

  const openAdd = (type: 'expense' | 'income' | 'transfer') => {
    setAddType(type);
    setFabOpen(false);
    setShowAddModal(true);
  };

  const openTemplate = () => {
    setFabOpen(false);
    setShowTemplateModal(true);
  };

  const handleEditFromDetail = (txn: Transaction) => {
    setDetailTxn(null);
    setEditTxn(txn);
    setAddType(txn.type);
    setShowAddModal(true);
  };

  const renderPage = () => {
    // Sub pages
    if (subPage === 'riwayat') return <RiwayatPage onOpenDetail={setDetailTxn} />;
    if (subPage === 'template') return <TemplatePage />;

    switch (activeTab) {
      case 'transaksi': return <TransaksiPage onOpenDetail={setDetailTxn} />;
      case 'rekening': return <RekeningPage />;
      case 'rekap': return <RekapPage />;
      case 'hutang': return <HutangPage />;
      case 'setting': return <SettingPage />;
      default: return <TransaksiPage onOpenDetail={setDetailTxn} />;
    }
  };

  const showFAB = activeTab === 'transaksi' && !subPage;

  return (
    <div className="h-[100dvh] max-w-[480px] mx-auto flex flex-col bg-bg overflow-hidden relative shadow-2xl">
      {/* Main Content — Scrollable container */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div key={subPage ? `sub-${subPage}` : `tab-${activeTab}`} className="tab-content-animate min-h-full">
          {renderPage()}
        </div>
      </main>

      {/* FAB Overlay */}
      {showFAB && fabOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 animate-fade-in backdrop-blur-[1px]"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* FAB Options with spacious gap */}
      {showFAB && fabOpen && (
        <div
          className="fixed z-50 space-y-2.5 animate-slide-up"
          style={{
            bottom: 'calc(146px + env(safe-area-inset-bottom, 12px))',
            right: 'calc((100vw - min(100vw, 480px)) / 2 + 16px)',
          }}
        >
          <button onClick={() => openAdd('expense')} className="fab-option w-48 justify-start">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4 text-rose-500" />
            </div>
            <span className="font-semibold text-zinc-700">Pengeluaran</span>
          </button>
          <button onClick={() => openAdd('income')} className="fab-option w-48 justify-start">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="font-semibold text-zinc-700">Pemasukan</span>
          </button>
          <button onClick={() => openAdd('transfer')} className="fab-option w-48 justify-start">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-semibold text-zinc-700">Pindah Saldo</span>
          </button>
          <button onClick={openTemplate} className="fab-option w-48 justify-start">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
            <span className="font-semibold text-zinc-700">Template</span>
          </button>
        </div>
      )}

      {/* FAB Button */}
      {showFAB && (
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`fixed z-50 fab-button transition-transform duration-200 ${fabOpen ? 'rotate-45' : ''}`}
          style={{
            bottom: 'calc(76px + env(safe-area-inset-bottom, 12px))',
            right: 'calc((100vw - min(100vw, 480px)) / 2 + 16px)',
          }}
        >
          {fabOpen ? <X className="w-7 h-7" strokeWidth={2.5} /> : <Plus className="w-7 h-7" strokeWidth={2.5} />}
        </button>
      )}

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <AddTransactionModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setEditTxn(null); }}
        editTransaction={editTxn}
        defaultType={addType}
      />

      <TemplateApplyModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
      />

      <TransactionDetailModal
        transaction={detailTxn}
        open={!!detailTxn}
        onClose={() => setDetailTxn(null)}
        onEdit={handleEditFromDetail}
      />

      {/* Toast */}
      <Toast />
    </div>
  );
}

export default App;
