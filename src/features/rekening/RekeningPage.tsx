// ============================================================
// Spendly v2 — Rekening Page (Wallet Management)
// ============================================================
import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/Modal';
import { DynamicIcon } from '../../components/DynamicIcon';
import { useStore } from '../../hooks/useStore';
import { formatIDR, formatAmountInput, parseAmount } from '../../utils/formatters';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Wallet } from '../../types';

const walletTypes = [
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'cash', label: 'Tunai' },
  { value: 'card', label: 'Kartu' },
] as const;

const walletIcons = ['Landmark', 'CreditCard', 'Smartphone', 'Wallet', 'Banknote', 'Shield'];
const walletColors = ['#0066AE', '#003D79', '#EE4D2D', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#EC4899'];

export function RekeningPage() {
  const { wallets, addWallet, updateWallet, deleteWallet } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Wallet['type']>('bank');
  const [balanceStr, setBalanceStr] = useState('');
  const [color, setColor] = useState(walletColors[0]);
  const [icon, setIcon] = useState(walletIcons[0]);

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  const openForm = (wallet?: Wallet) => {
    if (wallet) {
      setEditing(wallet);
      setName(wallet.name);
      setType(wallet.type);
      setBalanceStr(formatAmountInput(String(wallet.balance)));
      setColor(wallet.color);
      setIcon(wallet.icon);
    } else {
      setEditing(null);
      setName('');
      setType('bank');
      setBalanceStr('');
      setColor(walletColors[0]);
      setIcon(walletIcons[0]);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), type, balance: parseAmount(balanceStr), color, icon };
    if (editing?.id) {
      await updateWallet(editing.id, data);
    } else {
      await addWallet(data);
    }
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteTarget?.id) {
      await deleteWallet(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="header-bar">
        <span className="text-sm font-semibold">Rekening</span>
        <button onClick={() => openForm()} className="p-2 -mr-2 active:opacity-70">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Total balance */}
      <div className="p-4 bg-white border-b border-zinc-100">
        <p className="text-xs text-zinc-400 font-medium">Total Saldo</p>
        <p className="text-2xl font-bold mt-0.5">Rp {formatIDR(totalBalance)}</p>
      </div>

      {/* Wallet list */}
      <div className="bg-white">
        {wallets.map(w => (
          <div key={w.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${w.color}15` }}>
              <DynamicIcon name={w.icon} className="w-5 h-5" style={{ color: w.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{w.name}</p>
              <p className="text-xs text-zinc-400">{walletTypes.find(t => t.value === w.type)?.label || w.type}</p>
            </div>
            <p className="text-sm font-bold mr-2">Rp {formatIDR(w.balance)}</p>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openForm(w)} className="p-1.5 rounded-lg hover:bg-zinc-100 active:scale-90 transition-all">
                <Edit className="w-3.5 h-3.5 text-zinc-400" />
              </button>
              <button onClick={() => setDeleteTarget(w)} className="p-1.5 rounded-lg hover:bg-rose-50 active:scale-90 transition-all">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Rekening' : 'Tambah Rekening'}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Nama Rekening</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: BCA" className="input-field" />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Tipe</label>
            <div className="flex flex-wrap gap-2">
              {walletTypes.map(t => (
                <button key={t.value} onClick={() => setType(t.value)} className={`pill ${type === t.value ? 'pill-active' : ''}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Saldo Awal</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-400">Rp</span>
              <input type="text" inputMode="numeric" value={balanceStr} onChange={e => setBalanceStr(formatAmountInput(e.target.value))} placeholder="0" className="input-field" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Warna</label>
            <div className="flex flex-wrap gap-2">
              {walletColors.map(c => (
                <button
                  key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-xl border-2 transition-all ${color === c ? 'border-zinc-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Ikon</label>
            <div className="flex flex-wrap gap-2">
              {walletIcons.map(ic => (
                <button
                  key={ic} onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${icon === ic ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-zinc-200 bg-zinc-50'}`}
                >
                  <DynamicIcon name={ic} className="w-5 h-5" style={{ color: icon === ic ? 'var(--color-primary)' : '#94a3b8' }} />
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={!name.trim()} className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-40">
            {editing ? 'Simpan Perubahan' : 'Tambah Rekening'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Rekening"
        message={`Yakin ingin menghapus rekening "${deleteTarget?.name}"?`}
        confirmText="Hapus"
        danger
      />
    </div>
  );
}
