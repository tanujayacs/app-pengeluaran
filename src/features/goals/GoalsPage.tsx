// ============================================================
// Spendly — Savings Goals
// ============================================================
import { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { formatIDR, formatAmountInput, parseFormattedAmount, getPercentage, formatDateReadable } from '../../utils/formatters';
import { Plus, Trash2, ArrowDown, ArrowUp, Target } from 'lucide-react';

const goalIcons = ['Smartphone', 'Car', 'GraduationCap', 'Heart', 'Shield', 'Gift', 'Laptop', 'Landmark'];

export function GoalsPage() {
  const { savingsGoals, addGoal, depositToGoal, withdrawFromGoal, deleteGoal } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [depositModal, setDepositModal] = useState<{ id: number; type: 'deposit' | 'withdraw' } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Add form
  const [name, setName] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [currentStr, setCurrentStr] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('Smartphone');

  // Deposit/Withdraw form
  const [txnAmountStr, setTxnAmountStr] = useState('');

  const openAdd = () => {
    setName(''); setTargetStr(''); setCurrentStr(''); setDeadline(''); setIcon('Smartphone');
    setShowAdd(true);
  };

  const handleSave = async () => {
    const target = parseFormattedAmount(targetStr);
    const current = parseFormattedAmount(currentStr);
    if (!name.trim() || target <= 0) return;
    await addGoal({ name, targetAmount: target, currentAmount: current, deadline: deadline || undefined, icon });
    setShowAdd(false);
  };

  const handleDepositWithdraw = async () => {
    if (!depositModal) return;
    const amount = parseFormattedAmount(txnAmountStr);
    if (amount <= 0) return;
    if (depositModal.type === 'deposit') {
      await depositToGoal(depositModal.id, amount);
    } else {
      await withdrawFromGoal(depositModal.id, amount);
    }
    setDepositModal(null);
    setTxnAmountStr('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Savings Goals</h2>
        <button onClick={openAdd} className="flex items-center gap-2 btn-primary text-sm">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {savingsGoals.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-1">No savings goals yet</p>
          <p className="text-sm">Set a goal and start saving!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {savingsGoals.map(goal => {
            const percentage = getPercentage(goal.currentAmount, goal.targetAmount);
            return (
              <div key={goal.id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <DynamicIcon name={goal.icon} className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{goal.name}</p>
                      {goal.deadline && (
                        <p className="text-xs text-zinc-400">Deadline: {formatDateReadable(goal.deadline)}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setDeleteId(goal.id!)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Trash2 className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-primary-500">{formatIDR(goal.currentAmount)}</span>
                    <span className="text-zinc-400">{formatIDR(goal.targetAmount)}</span>
                  </div>
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 text-right">{percentage}% achieved</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setDepositModal({ id: goal.id!, type: 'deposit' }); setTxnAmountStr(''); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" /> Deposit
                  </button>
                  <button
                    onClick={() => { setDepositModal({ id: goal.id!, type: 'withdraw' }); setTxnAmountStr(''); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" /> Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Savings Goal" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Goal Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g., iPhone 16 Pro" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Target Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-400">Rp</span>
              <input type="text" inputMode="numeric" value={targetStr} onChange={e => setTargetStr(formatAmountInput(e.target.value))} className="input-field text-lg font-bold" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Current Savings</label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-400">Rp</span>
              <input type="text" inputMode="numeric" value={currentStr} onChange={e => setCurrentStr(formatAmountInput(e.target.value))} className="input-field text-lg font-bold" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Deadline (optional)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {goalIcons.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)} className={`p-2.5 rounded-xl transition-all ${icon === ic ? 'bg-primary-500/10 ring-2 ring-primary-500' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  <DynamicIcon name={ic} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="w-full btn-primary py-3 font-semibold">Create Goal</button>
        </div>
      </Modal>

      {/* Deposit/Withdraw Modal */}
      <Modal
        open={depositModal !== null}
        onClose={() => setDepositModal(null)}
        title={depositModal?.type === 'deposit' ? 'Deposit to Goal' : 'Withdraw from Goal'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-400">Rp</span>
              <input type="text" inputMode="numeric" value={txnAmountStr} onChange={e => setTxnAmountStr(formatAmountInput(e.target.value))} className="input-field text-xl font-bold" placeholder="0" autoFocus />
            </div>
          </div>
          <button onClick={handleDepositWithdraw} className="w-full btn-primary py-3 font-semibold">
            {depositModal?.type === 'deposit' ? 'Deposit' : 'Withdraw'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteGoal(deleteId)}
        title="Delete Goal"
        message="Are you sure you want to delete this savings goal?"
        confirmText="Delete"
        danger
      />
    </div>
  );
}
