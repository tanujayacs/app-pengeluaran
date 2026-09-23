// ============================================================
// Spendly v2 — Template Management Page
// ============================================================
import { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/Modal';
import { formatIDR, formatAmountInput, parseAmount } from '../../utils/formatters';
import { ArrowLeft, Plus, Trash2, Edit, GripVertical } from 'lucide-react';
import type { ExpenseTemplate, TemplateItem } from '../../types';

export function TemplatePage() {
  const { templates, categories, wallets, addTemplate, updateTemplate, deleteTemplate, setSubPage, showToast } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExpenseTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseTemplate | null>(null);

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [items, setItems] = useState<(TemplateItem & { amountStr: string })[]>([]);

  const defaultCatId = categories.find(c => c.type === 'expense')?.id || (categories[0]?.id ?? 1);
  const defaultWalletId = wallets[0]?.id ?? 1;

  const openForm = (t?: ExpenseTemplate) => {
    if (t) {
      setEditing(t);
      setTemplateName(t.name);
      setItems(t.items.map(i => ({ ...i, amountStr: formatAmountInput(String(i.amount)) })));
    } else {
      setEditing(null);
      setTemplateName('');
      // Always start with 1 empty item ready so user doesn't see disabled form
      setItems([{
        title: '',
        amount: 0,
        categoryId: defaultCatId,
        walletId: defaultWalletId,
        amountStr: '',
      }]);
    }
    setShowForm(true);
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      title: '',
      amount: 0,
      categoryId: defaultCatId,
      walletId: defaultWalletId,
      amountStr: '',
    }]);
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      if (field === 'amountStr') {
        return { ...it, amountStr: formatAmountInput(value as string), amount: parseAmount(value as string) };
      }
      return { ...it, [field]: value };
    }));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      showToast('Masukkan nama template', 'error');
      return;
    }

    const cleanItems: TemplateItem[] = items
      .filter(i => i.title.trim() && parseAmount(i.amountStr) > 0)
      .map(i => ({
        title: i.title.trim(),
        amount: parseAmount(i.amountStr),
        categoryId: i.categoryId || defaultCatId,
        walletId: i.walletId || defaultWalletId,
      }));

    if (cleanItems.length === 0) {
      showToast('Lengkapi minimal 1 item dengan judul dan nominal yang valid', 'error');
      return;
    }

    try {
      if (editing?.id) {
        await updateTemplate(editing.id, { name: trimmedName, items: cleanItems });
      } else {
        await addTemplate({ name: trimmedName, items: cleanItems });
      }
      setShowForm(false);
      setEditing(null);
      setTemplateName('');
      setItems([]);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan template', 'error');
    }
  };

  const handleDelete = async () => {
    if (deleteTarget?.id) {
      await deleteTemplate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="header-bar">
        <button onClick={() => setSubPage(null)} className="p-2 -ml-2 active:opacity-70">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold">Template Pengeluaran</span>
        <button onClick={() => openForm()} className="p-2 -mr-2 active:opacity-70 flex items-center gap-1">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 pb-safe space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 bg-white rounded-2xl border border-zinc-100 p-6">
            <p className="text-sm font-medium">Belum ada template</p>
            <p className="text-xs mt-1 text-zinc-400">Buat template untuk pengeluaran rutin kamu</p>
            <button
              onClick={() => openForm()}
              className="mt-4 px-4 py-2 btn-primary text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Buat Template Baru
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {templates.map(t => {
              const total = t.items.reduce((s, i) => s + i.amount, 0);
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-800">{t.name}</p>
                    <p className="text-xs font-semibold text-rose-500 mt-0.5">
                      Rp {formatIDR(total)} <span className="text-zinc-400 font-normal">({t.items.length} item)</span>
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.items.map((item, idx) => (
                        <span key={idx} className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                          {item.title} ({formatIDR(item.amount)})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openForm(t)} className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 active:scale-90 transition-all text-zinc-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(t)} className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-90 transition-all text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Template' : 'Buat Template Baru'}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Nama Template</label>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="Contoh: Commute Hari Kerja, Liburan, dsb"
              className="input-field"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-zinc-400 font-medium">Daftar Item ({items.length})</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Item
              </button>
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    <input
                      type="text"
                      value={item.title}
                      onChange={e => updateItem(idx, 'title', e.target.value)}
                      placeholder="Judul item (contoh: LRT Pergi)"
                      className="input-field text-xs py-1.5 flex-1"
                    />
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="p-1.5 rounded-lg hover:bg-rose-100 active:scale-90 text-rose-500 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pl-5">
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.amountStr}
                        onChange={e => updateItem(idx, 'amountStr', e.target.value)}
                        placeholder="Nominal (Rp)"
                        className="input-field text-xs py-1.5 font-medium"
                      />
                    </div>
                    <div>
                      <select
                        value={item.categoryId}
                        onChange={e => updateItem(idx, 'categoryId', parseInt(e.target.value))}
                        className="input-field text-xs py-1.5"
                      >
                        {categories.filter(c => c.type === 'expense').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={item.walletId}
                        onChange={e => updateItem(idx, 'walletId', parseInt(e.target.value))}
                        className="input-field text-xs py-1.5"
                      >
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full btn-primary py-3 text-sm font-semibold shadow-md mt-2"
          >
            {editing ? 'Simpan Perubahan' : 'Buat Template'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Template"
        message={`Yakin ingin menghapus template "${deleteTarget?.name}"?`}
        confirmText="Hapus"
        danger
      />
    </div>
  );
}
