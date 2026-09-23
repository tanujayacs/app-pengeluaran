// ============================================================
// Spendly v2 — Transaksi Page (Home)
// ============================================================
import { useState, useMemo } from 'react';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import { DatePickerDialog } from '../../components/DatePickerDialog';
import { formatIDR, formatDateIndo, getTodayStr, offsetDate } from '../../utils/formatters';
import { ChevronLeft, ChevronRight, History, ChevronRight as Arrow } from 'lucide-react';
import type { Transaction } from '../../types';

interface TransaksiPageProps {
  onOpenDetail: (txn: Transaction) => void;
}

export function TransaksiPage({ onOpenDetail }: TransaksiPageProps) {
  const { transactions, categories, wallets, setSubPage } = useStore();
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filter transactions for selected date
  const dayTransactions = useMemo(() =>
    transactions.filter(t => t.date === selectedDate).sort((a, b) => {
      if (a.time < b.time) return 1;
      if (a.time > b.time) return -1;
      return 0;
    }),
    [transactions, selectedDate]
  );

  const pemasukan = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const pengeluaran = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const selisih = pengeluaran - pemasukan;

  const getCat = (id: number) => categories.find(c => c.id === id);
  const getWallet = (id: number) => wallets.find(w => w.id === id);

  return (
    <div>
      {/* Header */}
      <div className="header-bar">
        <button
          type="button"
          onClick={() => setSelectedDate(prev => offsetDate(prev, -1))}
          className="p-2 -ml-2 active:opacity-70 transition-opacity"
          title="Hari Sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowDatePicker(true)}
          className="text-sm font-semibold active:opacity-70 px-2 py-1 rounded-lg transition-opacity flex items-center gap-1 cursor-pointer"
          title="Klik untuk memilih tanggal"
        >
          <span>{formatDateIndo(selectedDate)}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedDate(prev => offsetDate(prev, 1))}
            className="p-2 active:opacity-70 transition-opacity"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setSubPage('riwayat')}
            className="p-2 active:opacity-70 transition-opacity"
            title="Riwayat Transaksi"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 p-3">
        <div className="summary-card">
          <p className="text-[10px] text-zinc-400 font-medium">Pemasukan</p>
          <p className="text-sm font-bold text-emerald-500">{formatIDR(pemasukan)}</p>
        </div>
        <div className="summary-card">
          <p className="text-[10px] text-zinc-400 font-medium">Pengeluaran</p>
          <p className="text-sm font-bold text-rose-500">{formatIDR(pengeluaran)}</p>
        </div>
        <div className="summary-card">
          <p className="text-[10px] text-zinc-400 font-medium">Selisih</p>
          <p className={`text-sm font-bold ${selisih > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatIDR(selisih)}</p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white">
        {dayTransactions.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <p className="text-base mb-1">Belum ada transaksi</p>
            <p className="text-xs">Ketuk + untuk menambahkan</p>
          </div>
        ) : (
          dayTransactions.map(txn => {
            const cat = getCat(txn.categoryId);
            const wallet = getWallet(txn.walletId);
            return (
              <div key={txn.id} className="txn-item" onClick={() => onOpenDetail(txn)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate">
                    {txn.title || (cat?.name ?? 'Transaksi')}
                    {wallet ? ` · ${wallet.name}` : ''}
                  </p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {cat?.name || 'Lainnya'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-bold ${
                    txn.type === 'expense' ? 'text-zinc-800' :
                    txn.type === 'income' ? 'text-emerald-500' : 'text-blue-500'
                  }`}>
                    {txn.type === 'expense' ? '-' : txn.type === 'income' ? '+' : ''}{formatIDR(txn.amount)}
                  </span>
                  <Arrow className="w-4 h-4 text-zinc-300" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Date Picker Dialog */}
      <DatePickerDialog
        open={showDatePicker}
        value={selectedDate}
        onSelect={d => setSelectedDate(d)}
        onClose={() => setShowDatePicker(false)}
      />
    </div>
  );
}
