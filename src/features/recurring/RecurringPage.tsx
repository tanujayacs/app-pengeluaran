// ============================================================
// Spendly — Recurring Transactions
// ============================================================
import { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { formatIDR, formatAmountInput, parseFormattedAmount, formatDateReadable } from '../../utils/formatters';
import { Plus, Trash2, ToggleLeft, ToggleRight, Clock, AlertCircle } from 'lucide-react';

export function RecurringPage() {
  const { recurringTransactions, categories, wallets, addRecurring, deleteRecurring, toggleRecurring } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [walletId, setWalletId] = useState<number>(0);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [nextDueDate, setNextDueDate] = useState('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const openAdd = () => {
    setName(''); setAmountStr(''); setCategoryId(expenseCategories[0]?.id || 0);
    setWalletId(wallets[0]?.id || 0); setFrequency('monthly'); setNextDueDate('');
    setShowAdd(true);
  };

  const handleSave = async () => {
    const amount = parseFormattedAmount(amountStr);
    if (!name.trim() || amount <= 0 || !nextDueDate) return;
    await addRecurring({ name, amount, categoryId, walletId, frequency, nextDueDate, active: true });
    setShowAdd(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Recurring Bills</h2>
        <button onClick={openAdd} className="flex items-center gap-2 btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Bill
        </button>
      </div>

      {/* Summary */}
      {recurringTransactions.length > 0 && (
        <div className="card p-4">
          <p className="text-xs text-zinc-500 font-medium">Monthly Recurring Total</p>
          <p className="text-xl font-bold mt-1">
            {formatIDR(recurringTransactions.filter(r => r.active && r.frequency === 'monthly').reduce((s, r) => s + r.amount, 0))}
          </p>
        </div>
      )}

      {/* Recurring list */}
      <div className="space-y-3">
        {recurringTransactions.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg mb-1">No recurring bills</p>
            <p className="text-sm">Add your monthly subscriptions and bills</p>
          </div>
        ) : (
          recurringTransactions.map(rec => {
            const cat = categories.find(c => c.id === rec.categoryId);
            const wallet = wallets.find(w => w.id === rec.walletId);
            const isDue = rec.nextDueDate <= today;

            return (
              <div key={rec.id} className={`card p-4 ${!rec.active ? 'opacity-50' : ''} ${isDue && rec.active ? 'ring-2 ring-amber-500/50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat?.color || '#94A3B8'}15` }}>
                    <DynamicIcon name={cat?.icon || 'Receipt'} className="w-5 h-5" style={{ color: cat?.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{rec.name}</p>
                      {isDue && rec.active && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <span className="capitalize">{rec.frequency}</span>
                      <span>·</span>
                      <span>{wallet?.name || ''}</span>
                      <span>·</span>
                      <span>Due: {formatDateReadable(rec.nextDueDate)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-rose-500">{formatIDR(rec.amount)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleRecurring(rec.id!)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      {rec.active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-zinc-400" />
                      )}
                    </button>
                    <button onClick={() => setDeleteId(rec.id!)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Trash2 className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Recurring Bill" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g., Spotify Premium" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-400">Rp</span>
              <input type="text" inputMode="numeric" value={amountStr} onChange={e => setAmountStr(formatAmountInput(e.target.value))} className="input-field text-lg font-bold" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Category</label>
            <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} className="input-field">
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Wallet</label>
            <select value={walletId} onChange={e => setWalletId(Number(e.target.value))} className="input-field">
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(f => (
                <button key={f} onClick={() => setFrequency(f)} className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${frequency === f ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Next Due Date</label>
            <input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className="input-field" />
          </div>
          <button onClick={handleSave} className="w-full btn-primary py-3 font-semibold">Add Recurring Bill</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteRecurring(deleteId)}
        title="Delete Recurring Bill"
        message="Are you sure you want to remove this recurring bill?"
        confirmText="Delete"
        danger
      />
    </div>
  );
}
