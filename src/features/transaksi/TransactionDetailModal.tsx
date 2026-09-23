// ============================================================
// Spendly v2 — Transaction Detail Modal
// ============================================================
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/Modal';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import { formatIDR, formatDateIndo } from '../../utils/formatters';
import { Edit, Trash2, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import type { Transaction } from '../../types';

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onEdit: (txn: Transaction) => void;
}

export function TransactionDetailModal({ transaction, open, onClose, onEdit }: Props) {
  const { categories, wallets, deleteTransaction } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!transaction) return null;

  const cat = categories.find(c => c.id === transaction.categoryId);
  const wallet = wallets.find(w => w.id === transaction.walletId);
  const destWallet = transaction.destinationWalletId
    ? wallets.find(w => w.id === transaction.destinationWalletId)
    : null;

  const handleDelete = async () => {
    if (transaction.id) {
      await deleteTransaction(transaction.id);
      onClose();
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Detail Transaksi">
        <div className="space-y-4">
          {/* Amount */}
          <div className="text-center py-4">
            <p className={`text-3xl font-bold ${
              transaction.type === 'expense' ? 'text-rose-500' :
              transaction.type === 'income' ? 'text-emerald-500' : 'text-blue-500'
            }`}>
              {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
              Rp {formatIDR(transaction.amount)}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {transaction.type === 'expense' ? 'Pengeluaran' : transaction.type === 'income' ? 'Pemasukan' : 'Pindah Saldo'}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3 bg-zinc-50 rounded-xl p-4">
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">Judul</span>
              <span className="text-sm font-medium">{transaction.title || '-'}</span>
            </div>
            {cat && (
              <div className="flex justify-between">
                <span className="text-xs text-zinc-400">Kategori</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
                  {cat.name}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">Rekening</span>
              <span className="text-sm font-medium">{wallet?.name || '-'}</span>
            </div>
            {destWallet && (
              <div className="flex justify-between">
                <span className="text-xs text-zinc-400">Ke Rekening</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> {destWallet.name}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">Tanggal</span>
              <span className="text-sm font-medium">{formatDateIndo(transaction.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">Jam</span>
              <span className="text-sm font-medium">{transaction.time}</span>
            </div>
            {transaction.notes && (
              <div className="flex justify-between">
                <span className="text-xs text-zinc-400">Keterangan</span>
                <span className="text-sm font-medium text-right max-w-[60%]">{transaction.notes}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { onEdit(transaction); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-sm font-medium active:scale-[0.97] transition-all"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium active:scale-[0.97] transition-all"
            >
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Hapus Transaksi"
        message="Yakin ingin menghapus transaksi ini? Saldo rekening akan dikembalikan."
        confirmText="Hapus"
        danger
      />
    </>
  );
}
