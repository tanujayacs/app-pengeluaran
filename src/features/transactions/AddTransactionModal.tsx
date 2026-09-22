// ============================================================
// Spendly — Add/Edit Transaction Modal
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { Modal } from '../../components/Modal';
import { DynamicIcon } from '../../components/DynamicIcon';
import { useStore } from '../../hooks/useStore';
import { formatAmountInput, parseFormattedAmount, getTodayStr, getCurrentTime } from '../../utils/formatters';
import { ArrowRightLeft, ChevronDown } from 'lucide-react';
import type { Transaction } from '../../types';

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

type TxnType = 'expense' | 'income' | 'transfer';

export function AddTransactionModal({ open, onClose, editTransaction }: AddTransactionModalProps) {
  const { categories, wallets, addTransaction, updateTransaction } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<TxnType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [walletId, setWalletId] = useState<number>(0);
  const [destinationWalletId, setDestinationWalletId] = useState<number>(0);
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [time, setTime] = useState(getCurrentTime());
  const [notes, setNotes] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const isEditing = !!editTransaction;

  // Initialize form
  useEffect(() => {
    if (open) {
      if (editTransaction) {
        setType(editTransaction.type);
        setAmountStr(formatAmountInput(String(editTransaction.amount)));
        setCategoryId(editTransaction.categoryId);
        setWalletId(editTransaction.walletId);
        setDestinationWalletId(editTransaction.destinationWalletId || 0);
        setMerchant(editTransaction.merchant);
        setDate(editTransaction.date);
        setTime(editTransaction.time);
        setNotes(editTransaction.notes || '');
      } else {
        setType('expense');
        setAmountStr('');
        setCategoryId(0);
        setWalletId(wallets[0]?.id || 0);
        setDestinationWalletId(wallets[1]?.id || 0);
        setMerchant('');
        setDate(getTodayStr());
        setTime(getCurrentTime());
        setNotes('');
        setShowAllCategories(false);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, editTransaction, wallets]);

  const filteredCategories = categories.filter(c =>
    type === 'transfer' ? false : c.type === type
  );

  const defaultCategories = filteredCategories.filter(c => c.isDefault);
  const displayCategories = showAllCategories ? filteredCategories : defaultCategories;

  const handleAmountChange = (value: string) => {
    setAmountStr(formatAmountInput(value));
  };

  const handleSubmit = async () => {
    const amount = parseFormattedAmount(amountStr);
    if (amount <= 0) return;
    if (type !== 'transfer' && categoryId === 0) return;
    if (walletId === 0) return;

    const txnData = {
      type,
      amount,
      categoryId: type === 'transfer' ? 0 : categoryId,
      walletId,
      destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
      merchant: merchant || (type === 'transfer' ? 'Transfer' : ''),
      date,
      time,
      notes: notes || undefined,
    };

    if (isEditing && editTransaction?.id) {
      await updateTransaction(editTransaction.id, txnData);
    } else {
      await addTransaction(txnData);
    }
    onClose();
  };

  const typeOptions: { value: TxnType; label: string; color: string }[] = [
    { value: 'expense', label: 'Expense', color: 'bg-rose-500' },
    { value: 'income', label: 'Income', color: 'bg-emerald-500' },
    { value: 'transfer', label: 'Transfer', color: 'bg-indigo-500' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
      size="md"
    >
      <div className="space-y-5">
        {/* Type selector */}
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          {typeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setType(opt.value); setCategoryId(0); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                type === opt.value
                  ? `${opt.color} text-white shadow-sm`
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div className="text-center py-2">
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Amount</label>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-2xl font-bold text-zinc-400">Rp</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="0"
              className="text-4xl font-bold text-center bg-transparent outline-none w-48 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
            />
          </div>
        </div>

        {/* Category picker (not for transfers) */}
        {type !== 'transfer' && (
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {displayCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id!)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    categoryId === cat.id
                      ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <DynamicIcon name={cat.icon} className="w-4 h-4" style={{ color: cat.color }} />
                  {cat.name}
                </button>
              ))}
              {!showAllCategories && filteredCategories.length > defaultCategories.length && (
                <button
                  onClick={() => setShowAllCategories(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  More <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Wallet picker */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">
            {type === 'transfer' ? 'From Wallet' : 'Wallet'}
          </label>
          <div className="flex flex-wrap gap-2">
            {wallets.map(w => (
              <button
                key={w.id}
                onClick={() => setWalletId(w.id!)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  walletId === w.id
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-950/30'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <DynamicIcon name={w.icon} className="w-4 h-4" style={{ color: w.color }} />
                {w.name}
              </button>
            ))}
          </div>
        </div>

        {/* Destination wallet for transfers */}
        {type === 'transfer' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">To Wallet</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {wallets.filter(w => w.id !== walletId).map(w => (
                <button
                  key={w.id}
                  onClick={() => setDestinationWalletId(w.id!)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    destinationWalletId === w.id
                      ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <DynamicIcon name={w.icon} className="w-4 h-4" style={{ color: w.color }} />
                  {w.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Merchant / description */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">
            {type === 'transfer' ? 'Description' : 'Merchant'}
          </label>
          <input
            type="text"
            value={merchant}
            onChange={e => setMerchant(e.target.value)}
            placeholder={type === 'transfer' ? 'Transfer description...' : 'Where did you spend?'}
            className="input-field"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add a note..."
            className="input-field resize-none h-20"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={parseFormattedAmount(amountStr) <= 0}
          className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isEditing ? 'Update Transaction' : 'Add Transaction'}
        </button>
      </div>
    </Modal>
  );
}
