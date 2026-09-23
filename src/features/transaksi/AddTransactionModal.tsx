// ============================================================
// Spendly v2 — Add Transaction Modal (with Title & Category Suggestions & Quick Add)
// ============================================================
import { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '../../components/Modal';
import { DynamicIcon } from '../../components/DynamicIcon';
import { useStore } from '../../hooks/useStore';
import { formatAmountInput, parseAmount, getTodayStr, getCurrentTime } from '../../utils/formatters';
import { ArrowRightLeft, Plus, Check } from 'lucide-react';
import type { Transaction, Category } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
  defaultType?: 'expense' | 'income' | 'transfer';
  defaultWalletId?: number;
}

export function AddTransactionModal({ open, onClose, editTransaction, defaultType = 'expense', defaultWalletId }: Props) {
  const {
    categories,
    wallets,
    addTransaction,
    updateTransaction,
    getTitleSuggestions,
    getCategorySuggestions,
    addCategory,
  } = useStore();

  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'wallet' | 'form'>(editTransaction ? 'form' : 'wallet');
  const [type, setType] = useState(defaultType);
  const [walletId, setWalletId] = useState(defaultWalletId || 0);
  const [destWalletId, setDestWalletId] = useState(0);
  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(0);
  const [categoryInput, setCategoryInput] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [time, setTime] = useState(getCurrentTime());
  const [notes, setNotes] = useState('');

  const isEditing = !!editTransaction;

  // Title suggestions from history
  const titleSuggestions = useMemo(() => getTitleSuggestions(), [getTitleSuggestions, open]);

  // Category suggestions from history
  const categorySuggestions = useMemo(() => {
    const list = getCategorySuggestions().filter(c => c.type === type);
    // If not enough from history, fallback to categories
    const fallback = categories.filter(c => c.type === type);
    const combined = [...list];
    fallback.forEach(f => {
      if (!combined.some(c => c.id === f.id)) combined.push(f);
    });
    return combined;
  }, [getCategorySuggestions, categories, type, open]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => type === 'transfer' ? false : c.type === type);
  }, [categories, type]);

  useEffect(() => {
    if (open) {
      if (editTransaction) {
        setStep('form');
        setType(editTransaction.type);
        setWalletId(editTransaction.walletId);
        setDestWalletId(editTransaction.destinationWalletId || 0);
        setAmountStr(formatAmountInput(String(editTransaction.amount)));
        setTitle(editTransaction.title);
        setSelectedCatId(editTransaction.categoryId);
        const cat = categories.find(c => c.id === editTransaction.categoryId);
        setCategoryInput(cat ? cat.name : '');
        setDate(editTransaction.date);
        setTime(editTransaction.time);
        setNotes(editTransaction.notes || '');
      } else {
        setStep(defaultWalletId ? 'form' : 'wallet');
        setType(defaultType);
        setWalletId(defaultWalletId || (wallets[0]?.id ?? 0));
        setDestWalletId(wallets[1]?.id ?? 0);
        setAmountStr('');
        setTitle('');
        setSelectedCatId(0);
        setCategoryInput('');
        setDate(getTodayStr());
        setTime(getCurrentTime());
        setNotes('');
      }
    }
  }, [open, editTransaction, defaultType, defaultWalletId, categories, wallets]);

  const selectWallet = (id: number) => {
    setWalletId(id);
    setStep('form');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectCategory = (cat: Category) => {
    setSelectedCatId(cat.id!);
    setCategoryInput(cat.name);
  };

  const handleQuickAddCategory = async () => {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === type);
    if (existing) {
      handleSelectCategory(existing);
      return;
    }
    const newId = await addCategory({
      name: trimmed,
      type: type === 'income' ? 'income' : 'expense',
      icon: 'Tag',
    });
    setSelectedCatId(newId);
    setCategoryInput(trimmed);
  };

  const handleSubmit = async () => {
    const amount = parseAmount(amountStr);
    if (amount <= 0 || walletId === 0) return;

    let finalCatId = selectedCatId;
    if (type !== 'transfer') {
      // If user typed category name but didn't click pill
      if (!finalCatId && categoryInput.trim()) {
        const found = categories.find(c => c.name.toLowerCase() === categoryInput.trim().toLowerCase() && c.type === type);
        if (found) {
          finalCatId = found.id!;
        } else {
          finalCatId = await addCategory({
            name: categoryInput.trim(),
            type: type === 'income' ? 'income' : 'expense',
            icon: 'Tag',
          });
        }
      }
      if (!finalCatId) return;
    }

    const txnData = {
      type,
      amount,
      categoryId: type === 'transfer' ? 0 : finalCatId,
      walletId,
      destinationWalletId: type === 'transfer' ? destWalletId : undefined,
      title: title.trim() || (type === 'transfer' ? 'Pindah Saldo' : (categories.find(c => c.id === finalCatId)?.name ?? '')),
      date,
      time,
      notes: notes.trim() || undefined,
    };

    if (isEditing && editTransaction?.id) {
      await updateTransaction(editTransaction.id, txnData);
    } else {
      await addTransaction(txnData);
    }
    onClose();
  };

  const selectedWallet = wallets.find(w => w.id === walletId);
  const isCustomCategoryInputNew = categoryInput.trim().length > 0 &&
    !categories.some(c => c.name.toLowerCase() === categoryInput.trim().toLowerCase() && c.type === type);

  // Step 1: Wallet selection
  if (step === 'wallet') {
    return (
      <Modal open={open} onClose={onClose} title="Pilih Rekening">
        <div className="space-y-2">
          {wallets.map(w => (
            <button
              key={w.id}
              onClick={() => selectWallet(w.id!)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${w.color}20` }}>
                <DynamicIcon name={w.icon} className="w-5 h-5" style={{ color: w.color }} />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold">{w.name}</p>
                <p className="text-xs text-zinc-400">{w.type === 'ewallet' ? 'E-Wallet' : w.type === 'bank' ? 'Bank' : w.type}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Transaksi' : type === 'income' ? 'Pemasukan' : type === 'transfer' ? 'Pindah Saldo' : 'Pengeluaran'}
    >
      <div className="space-y-4">
        {/* Date, Time, Wallet row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field text-xs py-2" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Jam</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input-field text-xs py-2" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Rekening</label>
            <button
              type="button"
              onClick={() => setStep('wallet')}
              className="input-field text-xs py-2 text-left truncate flex items-center gap-1.5"
            >
              {selectedWallet && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedWallet.color }} />}
              <span className="truncate">{selectedWallet?.name || 'Pilih'}</span>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Jumlah</label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-zinc-400">Rp</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={e => setAmountStr(formatAmountInput(e.target.value))}
              placeholder="0"
              className="input-field text-xl font-bold"
            />
          </div>
        </div>

        {/* Destination wallet for transfers */}
        {type === 'transfer' && (
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3" /> Ke Rekening Tujuan
            </label>
            <div className="flex flex-wrap gap-2">
              {wallets.filter(w => w.id !== walletId).map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setDestWalletId(w.id!)}
                  className={`pill ${destWalletId === w.id ? 'pill-active' : ''}`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Judul & Saran Judul */}
        {type !== 'transfer' && (
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Judul</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ketik atau pilih saran di bawah..."
              className="input-field"
            />
            {/* Saran Judul */}
            {titleSuggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-zinc-400 mb-1">Saran Judul:</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-0.5">
                  {titleSuggestions.slice(0, 8).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTitle(s)}
                      className={`pill text-[11px] ${title.toLowerCase() === s.toLowerCase() ? 'pill-active' : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kategori & Saran Kategori */}
        {type !== 'transfer' && (
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Kategori</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={categoryInput}
                onChange={e => {
                  setCategoryInput(e.target.value);
                  const match = categories.find(c => c.name.toLowerCase() === e.target.value.trim().toLowerCase() && c.type === type);
                  setSelectedCatId(match ? match.id! : 0);
                }}
                placeholder="Ketik atau pilih kategori di bawah..."
                className="input-field flex-1"
              />
              {isCustomCategoryInputNew && (
                <button
                  type="button"
                  onClick={handleQuickAddCategory}
                  className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              )}
            </div>

            {/* Saran Kategori */}
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-zinc-400">Saran Kategori:</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto py-0.5">
                {categorySuggestions.map(cat => {
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`flex items-center gap-1 pill text-[11px] ${isSelected ? 'pill-active' : ''}`}
                    >
                      <DynamicIcon name={cat.icon || 'Tag'} className="w-3 h-3" />
                      <span>{cat.name}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Keterangan */}
        <div>
          <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Keterangan (Opsional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Catatan tambahan..."
            className="input-field resize-none h-16 text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={parseAmount(amountStr) <= 0 || (type !== 'transfer' && !selectedCatId && !categoryInput.trim())}
          className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambahkan'}
        </button>
      </div>
    </Modal>
  );
}
