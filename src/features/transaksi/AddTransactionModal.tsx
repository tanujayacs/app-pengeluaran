// ============================================================
// Spendly v2 — Add & Edit Transaction Modal
// ============================================================
import { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '../../components/Modal';
import { DynamicIcon } from '../../components/DynamicIcon';
import { useStore } from '../../hooks/useStore';
import { formatAmountInput, parseAmount, getTodayStr, getCurrentTime } from '../../utils/formatters';
import { ArrowRightLeft } from 'lucide-react';
import type { Transaction } from '../../types';

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
  const [categoryName, setCategoryName] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [time, setTime] = useState(getCurrentTime());
  const [notes, setNotes] = useState('');

  const isEditing = !!editTransaction;

  // Title recommendations based on previous transactions
  const titleSuggestions = useMemo(() => {
    if (type === 'transfer') return [];
    return getTitleSuggestions(type);
  }, [getTitleSuggestions, type, open, editTransaction]);

  // Category recommendations based on previous transactions
  const categorySuggestions = useMemo(() => {
    if (type === 'transfer') return [];
    return getCategorySuggestions(type);
  }, [getCategorySuggestions, type, open, editTransaction]);

  useEffect(() => {
    if (open) {
      if (editTransaction) {
        setStep('form');
        setType(editTransaction.type);
        setWalletId(editTransaction.walletId);
        setDestWalletId(editTransaction.destinationWalletId || 0);
        setAmountStr(formatAmountInput(String(editTransaction.amount)));
        setTitle(editTransaction.title);
        const cat = categories.find(c => c.id === editTransaction.categoryId);
        setCategoryName(cat ? cat.name : '');
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
        setCategoryName('');
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

  const handleSubmit = async () => {
    const amount = parseAmount(amountStr);
    if (amount <= 0 || walletId === 0) return;

    let finalCatId = 0;
    if (type !== 'transfer') {
      const trimmedCat = categoryName.trim();
      if (!trimmedCat) return;

      const existing = categories.find(
        c => c.name.toLowerCase() === trimmedCat.toLowerCase() && c.type === type
      );
      if (existing?.id) {
        finalCatId = existing.id;
      } else {
        finalCatId = await addCategory({
          name: trimmedCat,
          type: type === 'income' ? 'income' : 'expense',
          icon: 'Tag',
        });
      }
    }

    const txnData = {
      type,
      amount,
      categoryId: type === 'transfer' ? 0 : finalCatId,
      walletId,
      destinationWalletId: type === 'transfer' ? destWalletId : undefined,
      title: title.trim() || (type === 'transfer' ? 'Pindah Saldo' : categoryName.trim()),
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

        {/* Judul & Rekomendasi Judul */}
        {type !== 'transfer' && (
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Judul</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ketik atau pilih di bawah..."
              className="input-field"
            />
            {titleSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {titleSuggestions.map(s => (
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
            )}
          </div>
        )}

        {/* Kategori & Rekomendasi Kategori */}
        {type !== 'transfer' && (
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Kategori</label>
            <input
              type="text"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              placeholder="Ketik atau pilih di bawah..."
              className="input-field"
            />
            {categorySuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {categorySuggestions.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryName(cat)}
                    className={`pill text-[11px] ${categoryName.toLowerCase() === cat.toLowerCase() ? 'pill-active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
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
          disabled={parseAmount(amountStr) <= 0 || (type !== 'transfer' && !categoryName.trim())}
          className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambahkan'}
        </button>
      </div>
    </Modal>
  );
}
