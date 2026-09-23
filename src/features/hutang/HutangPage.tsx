// ============================================================
// Spendly v2 — Hutang Page (Debt Tracking)
// ============================================================
import { useState, useMemo } from 'react';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/Modal';
import { useStore } from '../../hooks/useStore';
import { formatIDR, formatAmountInput, parseAmount, getTodayStr, formatDateIndo } from '../../utils/formatters';
import { Plus, Check, RotateCcw, Trash2, Edit } from 'lucide-react';
import type { Debt } from '../../types';

type DebtTab = 'receivable' | 'payable';

export function HutangPage() {
  const { debts, addDebt, updateDebt, deleteDebt, toggleDebtSettled } = useStore();
  const [activeTab, setActiveTab] = useState<DebtTab>('receivable');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [notes, setNotes] = useState('');

  const filteredDebts = useMemo(() =>
    debts.filter(d => d.type === activeTab).sort((a, b) => {
      if (a.settled !== b.settled) return a.settled ? 1 : -1;
      return b.createdAt - a.createdAt;
    }),
    [debts, activeTab]
  );

  const totalReceivable = debts.filter(d => d.type === 'receivable' && !d.settled).reduce((s, d) => s + d.amount, 0);
  const totalPayable = debts.filter(d => d.type === 'payable' && !d.settled).reduce((s, d) => s + d.amount, 0);

  const openForm = (debt?: Debt) => {
    if (debt) {
      setEditing(debt);
      setName(debt.name);
      setAmountStr(formatAmountInput(String(debt.amount)));
      setDate(debt.date);
      setNotes(debt.notes || '');
    } else {
      setEditing(null);
      setName('');
      setAmountStr('');
      setDate(getTodayStr());
      setNotes('');
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const amount = parseAmount(amountStr);
    if (!name.trim() || amount <= 0) return;
    const data = { name: name.trim(), type: activeTab, amount, date, notes: notes || undefined, settled: false };
    if (editing?.id) {
      await updateDebt(editing.id, data);
    } else {
      await addDebt(data);
    }
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteTarget?.id) {
      await deleteDebt(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="header-bar">
        <span className="text-sm font-semibold">Hutang</span>
        <button onClick={() => openForm()} className="p-2 -mr-2 active:opacity-70">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="summary-card">
          <p className="text-[10px] text-zinc-400">Aku Dihutangi</p>
          <p className="text-sm font-bold text-emerald-500">Rp {formatIDR(totalReceivable)}</p>
        </div>
        <div className="summary-card">
          <p className="text-[10px] text-zinc-400">Aku Berhutang</p>
          <p className="text-sm font-bold text-rose-500">Rp {formatIDR(totalPayable)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-zinc-100">
        <button
          onClick={() => setActiveTab('receivable')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'receivable' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-zinc-400'
          }`}
        >
          Aku Dihutangi
        </button>
        <button
          onClick={() => setActiveTab('payable')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'payable' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-zinc-400'
          }`}
        >
          Aku Berhutang
        </button>
      </div>

      {/* Debt list */}
      <div className="bg-white">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <p className="text-sm">Belum ada catatan hutang</p>
            <p className="text-xs mt-1">Ketuk + untuk menambahkan</p>
          </div>
        ) : (
          filteredDebts.map(debt => (
            <div
              key={debt.id}
              className={`flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 ${debt.settled ? 'opacity-50' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${debt.settled ? 'line-through text-zinc-400' : ''}`}>{debt.name}</p>
                  {debt.settled && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-medium">Lunas</span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatDateIndo(debt.date)}{debt.notes ? ` · ${debt.notes}` : ''}
                </p>
              </div>
              <p className={`text-sm font-bold shrink-0 ${
                activeTab === 'receivable' ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                Rp {formatIDR(debt.amount)}
              </p>
              <div className="flex gap-0.5 shrink-0">
                <button
                  onClick={() => debt.id && toggleDebtSettled(debt.id)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 active:scale-90 transition-all"
                  title={debt.settled ? 'Tandai belum lunas' : 'Tandai lunas'}
                >
                  {debt.settled ? <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> : <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
                <button onClick={() => openForm(debt)} className="p-1.5 rounded-lg hover:bg-zinc-100 active:scale-90 transition-all">
                  <Edit className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <button onClick={() => setDeleteTarget(debt)} className="p-1.5 rounded-lg hover:bg-rose-50 active:scale-90 transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Hutang' : 'Tambah Hutang'}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Nama</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama orang" className="input-field" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Jumlah</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-400">Rp</span>
              <input type="text" inputMode="numeric" value={amountStr} onChange={e => setAmountStr(formatAmountInput(e.target.value))} placeholder="0" className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Keterangan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsional..." className="input-field resize-none h-16 text-sm" />
          </div>
          <button onClick={handleSubmit} disabled={!name.trim() || parseAmount(amountStr) <= 0} className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-40">
            {editing ? 'Simpan Perubahan' : 'Tambah Hutang'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Hutang"
        message={`Yakin ingin menghapus hutang "${deleteTarget?.name}"?`}
        confirmText="Hapus"
        danger
      />
    </div>
  );
}
