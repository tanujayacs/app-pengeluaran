// ============================================================
// Spendly v2 — Setting Page (with Theme, Category CRUD, Supabase Cloud Sync)
// ============================================================
import { useRef, useState, useEffect } from 'react';
import { useStore } from '../../hooks/useStore';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { DynamicIcon } from '../../components/DynamicIcon';
import { themeColors } from '../../utils/formatters';
import {
  pushToCloud,
  pullFromCloud,
  getLastSyncedString,
  checkCloudConnection,
} from '../../services/cloudSync';
import {
  Palette, Download, Upload, Trash2, Info, Lock,
  FileJson, FileSpreadsheet, Hash, Tags, Plus,
  Cloud, CloudUpload, CloudDownload, RefreshCw, Copy, Check,
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

const quickSqlScript = `-- Jalankan di SQL Editor Supabase:
create table if not exists spendly_sync (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table spendly_sync enable row level security;
create policy "Allow all on spendly_sync" on spendly_sync for all using (true) with check (true);`;

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

  // Cloud Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{ connected: boolean; tablesReady: boolean; error?: string } | null>(null);
  const [lastSyncedStr, setLastSyncedStr] = useState(getLastSyncedString());

  useEffect(() => {
    checkCloudConnection().then(status => setCloudStatus(status));
  }, []);

  const handlePushCloud = async () => {
    setIsSyncing(true);
    const res = await pushToCloud();
    setIsSyncing(false);
    if (res.success) {
      setLastSyncedStr(getLastSyncedString());
      setCloudStatus({ connected: true, tablesReady: true });
      showToast('Data berhasil dicadangkan ke Supabase Cloud! ☁️');
    } else {
      if (res.error?.includes('not found') || res.error?.includes('does not exist')) {
        setShowSqlModal(true);
      }
      showToast(res.error || 'Gagal sinkron ke cloud', 'error');
    }
  };

  const handlePullCloud = async () => {
    setIsRestoring(true);
    const res = await pullFromCloud();
    setIsRestoring(false);
    setShowRestoreConfirm(false);
    if (res.success) {
      setLastSyncedStr(getLastSyncedString());
      showToast(`Berhasil memulihkan ${res.count || 0} data dari Cloud! ✅`);
    } else {
      showToast(res.error || 'Gagal memulihkan dari cloud', 'error');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(quickSqlScript);
    setCopiedSql(true);
    showToast('Script SQL disalin ke clipboard');
    setTimeout(() => setCopiedSql(false), 2500);
  };

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
              <p className="text-[11px] text-zinc-400">Personal Finance with Cloud Backup</p>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-3 p-3 bg-zinc-50 rounded-xl">
            <Info className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Data tersimpan lokal di IndexedDB HP dan dapat disinkronkan ke Supabase Cloud secara aman.
            </p>
          </div>
        </div>

        {/* Cloud Sync & Backup Card */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800">Cloud Sync (Supabase)</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${cloudStatus?.tablesReady ? 'bg-emerald-500 animate-pulse' : cloudStatus?.connected ? 'bg-amber-500' : 'bg-zinc-400'}`} />
                  <span className="text-[10px] text-zinc-500">
                    {cloudStatus?.tablesReady
                      ? 'Terhubung & Siap'
                      : cloudStatus?.connected
                      ? 'Tabel belum dibuat'
                      : 'Memeriksa koneksi...'}
                  </span>
                </div>
              </div>
            </div>

            {cloudStatus && !cloudStatus.tablesReady && (
              <button
                onClick={() => setShowSqlModal(true)}
                className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-lg border border-amber-200 active:scale-95 transition-all"
              >
                Setup SQL
              </button>
            )}
          </div>

          <p className="text-[11px] text-zinc-400">
            Terakhir dicadangkan: <span className="text-zinc-600 font-medium">{lastSyncedStr}</span>
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handlePushCloud}
              disabled={isSyncing}
              className="btn-primary py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              <span>{isSyncing ? 'Mencadangkan...' : 'Cadangkan Data'}</span>
            </button>

            <button
              onClick={() => setShowRestoreConfirm(true)}
              disabled={isRestoring}
              className="py-2.5 px-3 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              {isRestoring ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudDownload className="w-3.5 h-3.5 text-zinc-600" />
              )}
              <span>{isRestoring ? 'Memulihkan...' : 'Pulihkan Data'}</span>
            </button>
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
          <p className="text-xs font-semibold text-zinc-500 mb-2">Manajemen File Backup</p>

          <button onClick={handleExportJSON} className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-50 active:bg-zinc-100 transition-colors">
            <FileJson className="w-4 h-4 text-emerald-500" />
            <div className="text-left flex-1">
              <p className="text-xs font-medium">Ekspor JSON</p>
              <p className="text-[10px] text-zinc-400">Backup lokal file JSON</p>
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
              <p className="text-xs font-medium">Impor File</p>
              <p className="text-[10px] text-zinc-400">Pulihkan dari file JSON</p>
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

      {/* SQL Setup Helper Modal */}
      <Modal open={showSqlModal} onClose={() => setShowSqlModal(false)} title="Setup Database Supabase">
        <div className="space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Agar fitur Cloud Sync aktif, jalankan script SQL ini 1 kali saja di **SQL Editor** Supabase kamu:
          </p>

          <div className="relative">
            <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-48">
              {quickSqlScript}
            </pre>
            <button
              onClick={handleCopySql}
              className="absolute top-2 right-2 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href="https://supabase.com/dashboard/project/cpbadvkgajzpxojvhfdv/sql"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <span>Buka SQL Editor Supabase</span>
              <span className="text-xs">↗</span>
            </a>
            <p className="text-[10px] text-zinc-400 text-center">
              Setelah paste dan klik "Run" di Supabase, kembali ke sini dan klik "Cadangkan Data".
            </p>
          </div>
        </div>
      </Modal>

      {/* Restore Confirm Dialog */}
      <ConfirmDialog
        open={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={handlePullCloud}
        title="Pulihkan dari Cloud"
        message="Ini akan menimpa data di perangkat ini dengan data cadangan terbaru dari Supabase Cloud. Lanjutkan?"
        confirmText="Pulihkan Sekarang"
      />

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
