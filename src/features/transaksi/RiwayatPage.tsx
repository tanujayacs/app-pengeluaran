// ============================================================
// Spendly v2 — Riwayat Page (Transaction History)
// ============================================================
import { useState, useMemo } from 'react';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import { formatIDR, formatDateGroup } from '../../utils/formatters';
import { ArrowLeft, Search, ChevronRight } from 'lucide-react';
import type { Transaction } from '../../types';

interface Props {
  onOpenDetail: (txn: Transaction) => void;
}

export function RiwayatPage({ onOpenDetail }: Props) {
  const { transactions, categories, wallets, setSubPage } = useStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return transactions;
    const s = search.toLowerCase();
    return transactions.filter(t =>
      t.title.toLowerCase().includes(s) || (t.notes || '').toLowerCase().includes(s)
    );
  }, [transactions, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, { total: number; txns: Transaction[] }>();
    filtered.forEach(t => {
      const existing = map.get(t.date);
      const amt = t.type === 'expense' ? -t.amount : t.type === 'income' ? t.amount : 0;
      if (existing) {
        existing.total += amt;
        existing.txns.push(t);
      } else {
        map.set(t.date, { total: amt, txns: [t] });
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const getCat = (id: number) => categories.find(c => c.id === id);
  const getWallet = (id: number) => wallets.find(w => w.id === id);

  return (
    <div>
      {/* Header */}
      <div className="header-bar">
        <button onClick={() => setSubPage(null)} className="p-2 -ml-2 active:opacity-70">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold">Riwayat</span>
        <div className="w-10" />
      </div>

      {/* Search */}
      <div className="p-3 bg-white border-b border-zinc-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pencarian"
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      {/* Grouped list */}
      <div>
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <p className="text-sm">Tidak ada transaksi</p>
          </div>
        ) : (
          grouped.map(([date, { total, txns }]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-zinc-800">{date.split('-')[2]}</span>
                  <div>
                    <span className="text-[10px] text-zinc-500">{date.split('-')[1]} {date.split('-')[0]}</span>
                    <span className="ml-1 text-[10px] bg-zinc-200 text-zinc-600 rounded px-1 py-0.5">
                      {formatDateGroup(date).split(' ').pop()}
                    </span>
                  </div>
                </div>
                <span className={`text-sm font-bold ${total < 0 ? 'text-zinc-800' : 'text-emerald-500'}`}>
                  {formatIDR(Math.abs(total))}
                </span>
              </div>

              {/* Transactions */}
              {txns.map(txn => {
                const cat = getCat(txn.categoryId);
                const wallet = getWallet(txn.walletId);
                return (
                  <div key={txn.id} className="txn-item" onClick={() => onOpenDetail(txn)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 truncate">
                        {txn.title || (cat?.name ?? 'Transaksi')}
                        {wallet ? ` · ${wallet.name}` : ''}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{cat?.name || 'Lainnya'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold ${
                        txn.type === 'expense' ? 'text-zinc-800' : 'text-emerald-500'
                      }`}>
                        {txn.type === 'expense' ? '-' : '+'}{formatIDR(txn.amount)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
