// ============================================================
// Spendly — Transaction List Page
// ============================================================
import { useState, useMemo } from 'react';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import { ConfirmDialog } from '../../components/Modal';
import { formatIDR, getRelativeDateLabel } from '../../utils/formatters';
import {
  Search, Filter, ArrowDownLeft, ArrowUpRight, ArrowRightLeft,
  MoreVertical, Edit, Copy, Trash2, X,
} from 'lucide-react';
import type { Transaction } from '../../types';

export function TransactionList() {
  const { transactions, categories, wallets, setShowAddModal, setEditingTransaction, addTransaction, deleteTransaction } = useStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [filterCategoryId, setFilterCategoryId] = useState<number>(0);
  const [filterWalletId, setFilterWalletId] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      if (search) {
        const s = search.toLowerCase();
        if (!txn.merchant.toLowerCase().includes(s) && !(txn.notes || '').toLowerCase().includes(s)) return false;
      }
      if (filterType !== 'all' && txn.type !== filterType) return false;
      if (filterCategoryId && txn.categoryId !== filterCategoryId) return false;
      if (filterWalletId && txn.walletId !== filterWalletId) return false;
      return true;
    });
  }, [transactions, search, filterType, filterCategoryId, filterWalletId]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; label: string; transactions: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    filteredTransactions.forEach(txn => {
      if (!map.has(txn.date)) map.set(txn.date, []);
      map.get(txn.date)!.push(txn);
    });

    map.forEach((txns, date) => {
      groups.push({ date, label: getRelativeDateLabel(date), transactions: txns });
    });

    return groups.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions]);

  const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Transfer';
  const getCategoryIcon = (id: number) => categories.find(c => c.id === id)?.icon || 'ArrowRightLeft';
  const getCategoryColor = (id: number) => categories.find(c => c.id === id)?.color || '#6366F1';
  const getWalletName = (id: number) => wallets.find(w => w.id === id)?.name || '';

  const typeIcon = (type: string) => {
    if (type === 'expense') return <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />;
    if (type === 'income') return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />;
    return <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const handleDuplicate = async (txn: Transaction) => {
    const { id, createdAt, ...rest } = txn;
    await addTransaction(rest);
    setActiveMenu(null);
  };

  const handleEdit = (txn: Transaction) => {
    setEditingTransaction(txn);
    setShowAddModal(true);
    setActiveMenu(null);
  };

  const hasActiveFilters = filterType !== 'all' || filterCategoryId !== 0 || filterWalletId !== 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Transactions</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            hasActiveFilters
              ? 'bg-primary-500/10 text-primary-600'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-500" />
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search merchant or notes..."
          className="input-field pl-10"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 space-y-3 animate-slide-up">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Type</label>
            <div className="flex gap-2">
              {(['all', 'expense', 'income', 'transfer'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterType === t ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Category</label>
            <select value={filterCategoryId} onChange={e => setFilterCategoryId(Number(e.target.value))} className="input-field text-sm">
              <option value={0}>All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Wallet</label>
            <select value={filterWalletId} onChange={e => setFilterWalletId(Number(e.target.value))} className="input-field text-sm">
              <option value={0}>All Wallets</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterType('all'); setFilterCategoryId(0); setFilterWalletId(0); }}
              className="text-xs text-rose-500 font-medium hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Transaction groups */}
      {groupedTransactions.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-lg mb-1">No transactions found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map(group => (
            <div key={group.date}>
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{group.label}</h3>
                <span className="text-xs text-zinc-400">
                  {formatIDR(group.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
              <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
                {group.transactions.map(txn => (
                  <div key={txn.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors relative">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${getCategoryColor(txn.categoryId)}15` }}
                    >
                      <DynamicIcon name={txn.type === 'transfer' ? 'ArrowRightLeft' : getCategoryIcon(txn.categoryId)} className="w-5 h-5" style={{ color: getCategoryColor(txn.categoryId) }} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{txn.merchant || getCategoryName(txn.categoryId)}</p>
                        {typeIcon(txn.type)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span>{getCategoryName(txn.categoryId)}</span>
                        <span>·</span>
                        <span>{getWalletName(txn.walletId)}</span>
                        {txn.type === 'transfer' && txn.destinationWalletId && (
                          <>
                            <span>→</span>
                            <span>{getWalletName(txn.destinationWalletId)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${
                        txn.type === 'expense' ? 'text-rose-500' :
                        txn.type === 'income' ? 'text-emerald-500' : 'text-indigo-500'
                      }`}>
                        {txn.type === 'expense' ? '-' : txn.type === 'income' ? '+' : ''}{formatIDR(txn.amount)}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{txn.time}</p>
                    </div>

                    {/* Menu button */}
                    <button
                      onClick={() => setActiveMenu(activeMenu === txn.id ? null : txn.id!)}
                      className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 shrink-0"
                    >
                      <MoreVertical className="w-4 h-4 text-zinc-400" />
                    </button>

                    {/* Dropdown menu */}
                    {activeMenu === txn.id && (
                      <div className="absolute right-12 top-2 z-10 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 min-w-[140px] animate-scale-in">
                        <button onClick={() => handleEdit(txn)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleDuplicate(txn)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">
                          <Copy className="w-4 h-4" /> Duplicate
                        </button>
                        <button onClick={() => { setDeleteConfirm(txn); setActiveMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm?.id && deleteTransaction(deleteConfirm.id)}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${deleteConfirm?.type} of ${formatIDR(deleteConfirm?.amount || 0)} from ${deleteConfirm?.merchant}? This will adjust your wallet balance.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
