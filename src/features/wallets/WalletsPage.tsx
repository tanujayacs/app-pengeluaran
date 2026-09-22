// ============================================================
// Spendly — Wallets Management
// ============================================================
import { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { formatIDR } from '../../utils/formatters';
import { Plus, Trash2, Edit, ArrowRightLeft } from 'lucide-react';

const walletTypes = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'card', label: 'Card' },
] as const;

const walletIcons = ['Wallet', 'Landmark', 'Smartphone', 'CreditCard'];
const walletColors = ['#22C55E', '#0066AE', '#00AED6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];

export function WalletsPage() {
  const { wallets, addWallet, updateWallet, deleteWallet, setShowAddModal } = useStore();
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [editWallet, setEditWallet] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'ewallet' | 'card'>('bank');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(walletColors[0]);
  const [icon, setIcon] = useState(walletIcons[0]);

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  const openAdd = () => {
    setName(''); setType('bank'); setBalance(''); setColor(walletColors[0]); setIcon(walletIcons[0]);
    setEditWallet(null);
    setShowAddWallet(true);
  };

  const openEdit = (id: number) => {
    const w = wallets.find(w => w.id === id);
    if (!w) return;
    setName(w.name); setType(w.type); setBalance(String(w.balance)); setColor(w.color); setIcon(w.icon);
    setEditWallet(id);
    setShowAddWallet(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editWallet) {
      await updateWallet(editWallet, { name, type, color, icon });
    } else {
      await addWallet({ name, type, balance: parseInt(balance) || 0, color, icon });
    }
    setShowAddWallet(false);
  };

  const handleTransfer = () => {
    // Opens the add transaction modal in transfer mode
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Wallets</h2>
        <div className="flex gap-2">
          <button onClick={handleTransfer} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> Transfer
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Wallet
          </button>
        </div>
      </div>

      {/* Total balance card */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl p-6 text-white">
        <p className="text-zinc-400 text-sm font-medium">Total Balance</p>
        <p className="text-3xl font-bold mt-1">{formatIDR(totalBalance)}</p>
        <p className="text-xs text-zinc-500 mt-2">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Wallet cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map(w => (
          <div key={w.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${w.color}15` }}>
                  <DynamicIcon name={w.icon} className="w-5 h-5" style={{ color: w.color }} />
                </div>
                <div>
                  <p className="font-semibold">{w.name}</p>
                  <p className="text-xs text-zinc-400 capitalize">{w.type === 'ewallet' ? 'E-Wallet' : w.type}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(w.id!)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Edit className="w-4 h-4 text-zinc-400" />
                </button>
                <button onClick={() => setDeleteConfirm(w.id!)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Trash2 className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: w.color }}>{formatIDR(w.balance)}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Wallet Modal */}
      <Modal open={showAddWallet} onClose={() => setShowAddWallet(false)} title={editWallet ? 'Edit Wallet' : 'Add Wallet'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Wallet name" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Type</label>
            <div className="flex gap-2">
              {walletTypes.map(t => (
                <button key={t.value} onClick={() => setType(t.value)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${type === t.value ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {!editWallet && (
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Initial Balance</label>
              <input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="input-field" placeholder="0" />
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Color</label>
            <div className="flex gap-2">
              {walletColors.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary-500' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Icon</label>
            <div className="flex gap-2">
              {walletIcons.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)} className={`p-2.5 rounded-xl transition-all ${icon === ic ? 'bg-primary-500/10 ring-2 ring-primary-500' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  <DynamicIcon name={ic} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="w-full btn-primary py-3 font-semibold">{editWallet ? 'Update Wallet' : 'Add Wallet'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm !== null && deleteWallet(deleteConfirm)}
        title="Delete Wallet"
        message="Are you sure? This will remove the wallet and its balance tracking."
        confirmText="Delete"
        danger
      />
    </div>
  );
}
