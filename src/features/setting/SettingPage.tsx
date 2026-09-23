// ============================================================
// Spendly v2 — Setting Page (with Theme, Category CRUD, Templates, Data)
// ============================================================
import { useRef, useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { DynamicIcon } from '../../components/DynamicIcon';
import { themeColors } from '../../utils/formatters';
import {
  Palette, Download, Upload, Trash2, Info, Lock,
  FileJson, FileSpreadsheet, Hash, Tags, Plus,
} from 'lucide-react';
import type { ThemeColor, Category } from '../../types';

const availableColors: { value: ThemeColor; label: string }[] = [
  { value: 'blue', label: 'Biru' },
  { value: 'green', label: 'Hijau' },
  { value: 'red', label: 'Merah' },
  { value: 'purple', label: 'Ungu' },
  { value: 'orange', label: 'Oranye' },
  { value: 'pink', label: 'Pink' },
  { value: 'teal', label: 'Teal' },
];

const exclusiveColors = [
  { label: 'Gold', color: '#D4AF37' },
  { label: 'Titanium', color: '#878681' },
  { label: 'Rose Gold', color: '#B76E79' },
];

export function SettingPage() {
  const {
    settings,
    updateSettings,
    categories,
    addCategory,
    deleteCategory,
    exportData,
    exportCSV,
    importData,
    resetDatabase,
    showToast,
    setSubPage,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Category management modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);

  const handleExportJSON = async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendly-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data diekspor sebagai JSON');
  };

  const handleExportCSV = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendly-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data diekspor sebagai CSV');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importData(text);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    await addCategory({
      name,
      type: newCatType,
      icon: 'Tag',
    });
    setNewCatName('');
    showToast(`Kategori "${name}" ditambahkan`);
  };

  return (
    <div>
      {/* Header */}
      <div className="header-bar">
        <span className="text-sm font-semibold">Pengaturan</span>
        <div className="w-5" />
      </div>

      <div className="p-3 space-y-3 pb-safe">
        {/* App Info */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
              <span className="text-white text-xl font-bold">S</span>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-800">Spendly</p>
              <p className="text-[11px] text-zinc-400">Offline Personal Finance v2.1</p>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-3 p-3 bg-zinc-50 rounded-xl">
            <Info className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Data disimpan 100% offline di perangkat kamu menggunakan IndexedDB lokal.
            </p>
          </div>
        </div>

        {/* Angka Desimal */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-zinc-400" />
              <div>
                <p className="text-sm font-medium">Angka Desimal</p>
                <p className="text-[10px] text-zinc-400">Tampilkan angka di belakang koma</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ showDecimal: !settings.showDecimal })}
              className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${settings.showDecimal ? 'bg-[var(--color-primary)]' : 'bg-zinc-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.showDecimal ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tampilan Warna */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Palette className="w-4 h-4 text-zinc-400" />
            <p className="text-sm font-medium">Warna Tema</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {availableColors.map(c => (
              <button
                key={c.value}
                onClick={() => updateSettings({ themeColor: c.value })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all active:scale-95 ${
                  settings.themeColor === c.value ? 'border-zinc-800 font-semibold' : 'border-transparent bg-zinc-50 text-zinc-600'
                }`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColors[c.value].primary }} />
                {c.label}
              </button>
            ))}
          </div>

          {/* Exclusive colors */}
          <p className="text-[10px] text-zinc-400 font-medium mb-2">Warna Eksklusif 🔒</p>
          <div className="flex flex-wrap gap-2">
            {exclusiveColors.map(c => (
              <button
                key={c.label}
                onClick={() => showToast('Fitur premium — coming soon! 😉', 'info')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-50 border-2 border-transparent opacity-60"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label}
                <Lock className="w-2.5 h-2.5 text-zinc-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Kelola Kategori */}
        <button
          onClick={() => setShowCategoryModal(true)}
          className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex items-center justify-between active:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Tags className="w-4 h-4 text-zinc-400" />
            <div className="text-left">
              <p className="text-sm font-medium">Kelola Kategori</p>
              <p className="text-[10px] text-zinc-400">Tambah atau hapus kategori ({categories.length} kategori)</p>
            </div>
          </div>
          <span className="text-zinc-300 font-bold">›</span>
        </button>

        {/* Template Management */}
        <button
          onClick={() => setSubPage('template')}
          className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex items-center justify-between active:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileJson className="w-4 h-4 text-zinc-400" />
            <div className="text-left">
              <p className="text-sm font-medium">Template Pengeluaran</p>
              <p className="text-[10px] text-zinc-400">Kelola template pengeluaran cepat</p>
            </div>
          </div>
          <span className="text-zinc-300 font-bold">›</span>
        </button>

        {/* Data Management */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-zinc-500 mb-2">Manajemen Data</p>

          <button onClick={handleExportJSON} className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-50 active:bg-zinc-100 transition-colors">
            <FileJson className="w-4 h-4 text-emerald-500" />
            <div className="text-left flex-1">
              <p className="text-xs font-medium">Ekspor JSON</p>
              <p className="text-[10px] text-zinc-400">Backup lengkap semua data</p>
            </div>
            <Download className="w-4 h-4 text-zinc-400" />
          </button>

          <button onClick={handleExportCSV} className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-50 active:bg-zinc-100 transition-colors">
            <FileSpreadsheet className="w-4 h-4 text-sky-500" />
            <div className="text-left flex-1">
              <p className="text-xs font-medium">Ekspor CSV</p>
              <p className="text-[10px] text-zinc-400">Data transaksi untuk Excel / Google Sheets</p>
            </div>
            <Download className="w-4 h-4 text-zinc-400" />
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-50 active:bg-zinc-100 transition-colors">
            <Upload className="w-4 h-4 text-indigo-500" />
            <div className="text-left flex-1">
              <p className="text-xs font-medium">Impor Data</p>
              <p className="text-[10px] text-zinc-400">Pulihkan dari file backup JSON</p>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-50 active:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <div className="text-left flex-1">
              <p className="text-xs font-medium text-rose-600">Reset Semua Data</p>
              <p className="text-[10px] text-rose-400">Hapus semua transaksi dan mulai dari awal</p>
            </div>
          </button>
        </div>
      </div>

      {/* Category CRUD Modal */}
      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Kelola Kategori">
        <div className="space-y-4">
          {/* Add Category Form */}
          <div className="bg-zinc-50 rounded-xl p-3 space-y-2 border border-zinc-200/80">
            <p className="text-xs font-bold text-zinc-700">Tambah Kategori Baru</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Nama kategori..."
                className="input-field flex-1 text-xs py-2"
              />
              <select
                value={newCatType}
                onChange={e => setNewCatType(e.target.value as 'expense' | 'income')}
                className="input-field w-32 text-xs py-2"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </div>
            <button
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="w-full btn-primary py-2 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Kategori
            </button>
          </div>

          {/* List Categories */}
          <div>
            <p className="text-xs font-bold text-zinc-700 mb-2">Daftar Kategori ({categories.length})</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <DynamicIcon name={cat.icon || 'Tag'} className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-800">{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.type === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {cat.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                    </span>
                  </div>
                  <button
                    onClick={() => setDeleteCatTarget(cat)}
                    className="p-1 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-500 active:scale-90 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Category Confirm */}
      <ConfirmDialog
        open={!!deleteCatTarget}
        onClose={() => setDeleteCatTarget(null)}
        onConfirm={async () => {
          if (deleteCatTarget?.id) {
            await deleteCategory(deleteCatTarget.id);
            setDeleteCatTarget(null);
          }
        }}
        title="Hapus Kategori"
        message={`Hapus kategori "${deleteCatTarget?.name}"? Transaksi yang menggunakan kategori ini tetap tersimpan.`}
        confirmText="Hapus"
        danger
      />

      {/* Reset DB Confirm */}
      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetDatabase}
        title="Reset Semua Data"
        message="Ini akan menghapus SEMUA transaksi, rekening, hutang, dan pengaturan secara permanen. Yakin?"
        confirmText="Reset"
        danger
      />
    </div>
  );
}
