// ============================================================
// Spendly v2 — Template Apply Modal
// ============================================================
import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { useStore } from '../../hooks/useStore';
import { formatIDR, formatAmountInput, parseAmount, getTodayStr, getCurrentTime } from '../../utils/formatters';
import { Check } from 'lucide-react';
import type { ExpenseTemplate, TemplateItem } from '../../types';

interface EditableItem extends TemplateItem {
  enabled: boolean;
  amountStr: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TemplateApplyModal({ open, onClose }: Props) {
  const { templates, wallets, addBatchTransactions, setSubPage } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState<ExpenseTemplate | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedTemplate(null);
      setItems([]);
    }
  }, [open]);

  const selectTemplate = (t: ExpenseTemplate) => {
    setSelectedTemplate(t);
    setItems(t.items.map(item => ({
      ...item,
      enabled: true,
      amountStr: formatAmountInput(String(item.amount)),
    })));
  };

  const toggleItem = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, enabled: !it.enabled } : it));
  };

  const updateItemAmount = (idx: number, val: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, amountStr: formatAmountInput(val) } : it));
  };

  const total = items.filter(i => i.enabled).reduce((s, i) => s + parseAmount(i.amountStr), 0);

  const handleApply = async () => {
    const today = getTodayStr();
    const now = getCurrentTime();
    const txns = items
      .filter(i => i.enabled && parseAmount(i.amountStr) > 0)
      .map(i => ({
        type: 'expense' as const,
        amount: parseAmount(i.amountStr),
        categoryId: i.categoryId,
        walletId: i.walletId,
        title: i.title,
        date: today,
        time: now,
      }));

    if (txns.length > 0) {
      await addBatchTransactions(txns);
      onClose();
    }
  };

  // Template selection
  if (!selectedTemplate) {
    return (
      <Modal open={open} onClose={onClose} title="Pilih Template">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <p className="text-sm">Belum ada template</p>
            <p className="text-xs mt-1">Buat template pengeluaran rutin kamu</p>
            <button
              onClick={() => { onClose(); setSubPage('template'); }}
              className="mt-3 px-4 py-2 btn-primary text-xs font-semibold"
            >
              + Buat Template Baru
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map(t => {
              const templateTotal = t.items.reduce((s, i) => s + i.amount, 0);
              return (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className="w-full text-left p-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 active:scale-[0.98] transition-all"
                >
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-zinc-400 mt-1">{t.items.length} item · Rp {formatIDR(templateTotal)}</p>
                </button>
              );
            })}
            <button
              onClick={() => { onClose(); setSubPage('template'); }}
              className="w-full text-center py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-dashed border-blue-200 mt-2"
            >
              + Kelola / Tambah Template
            </button>
          </div>
        )}
      </Modal>
    );
  }

  // Edit items before apply
  return (
    <Modal open={open} onClose={onClose} title={selectedTemplate.name}>
      <div className="space-y-3">
        {items.map((item, idx) => {
          const wallet = wallets.find(w => w.id === item.walletId);
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                item.enabled ? 'bg-white border-zinc-200' : 'bg-zinc-50 border-zinc-100 opacity-50'
              }`}
            >
              <button
                onClick={() => toggleItem(idx)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  item.enabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-zinc-300'
                }`}
              >
                {item.enabled && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-[10px] text-zinc-400">{wallet?.name || ''}</p>
              </div>
              <div className="shrink-0 w-24">
                <input
                  type="text"
                  inputMode="numeric"
                  value={item.amountStr}
                  onChange={e => updateItemAmount(idx, e.target.value)}
                  disabled={!item.enabled}
                  className="input-field text-right text-xs py-1.5 px-2 disabled:opacity-40"
                />
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <span className="text-sm text-zinc-500">Total</span>
          <span className="text-lg font-bold">Rp {formatIDR(total)}</span>
        </div>

        <button
          onClick={handleApply}
          disabled={total <= 0}
          className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-40"
        >
          Tambahkan {items.filter(i => i.enabled).length} Transaksi
        </button>
      </div>
    </Modal>
  );
}
