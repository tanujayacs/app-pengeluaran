// ============================================================
// Spendly v2 — Setting Page (with Simple Auth, Cloud Sync, Themes, & Categories)
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
  getCurrentUser,
  registerUser,
  loginUser,
  updateProfile,
  logoutUser,
  deleteAccount,
  cleanUsernameInput,
} from '../../services/authService';
import {
  Palette, Download, Upload, Trash2, Info, Lock,
  FileJson, FileSpreadsheet, Hash, Tags, Plus,
  Cloud, CloudUpload, CloudDownload, RefreshCw, Copy, Check,
  UserCircle2, Edit3, LogOut, KeyRound, Eye, EyeOff, Smartphone, ShieldCheck,
  Heart, Coffee, ExternalLink,
} from 'lucide-react';
import type { ThemeColor, Category, UserProfile } from '../../types';

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

  // User Profile & Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Edit Profile modal state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Dialog confirms
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);

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

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('spendly_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('spendly_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // --- Auth Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    const res = await loginUser(authUsername, authPassword);
    setAuthLoading(false);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setShowAuthModal(false);
      showToast(`Selamat datang kembali, ${res.user.displayName || res.user.username}! 👋`);
      setLastSyncedStr(getLastSyncedString());
    } else {
      setAuthError(res.error || 'Gagal masuk akun');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (authPassword !== authConfirmPassword) {
      setAuthError('Konfirmasi password tidak cocok.');
      return;
    }
    setAuthLoading(true);
    const res = await registerUser(authUsername, authPassword, authDisplayName);
    setAuthLoading(false);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setShowAuthModal(false);
      showToast(`Akun @${res.user.username} berhasil dibuat & disinkronkan! 🚀`);
      setLastSyncedStr(getLastSyncedString());
    } else {
      setAuthError(res.error || 'Gagal mendaftarkan akun');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (editNewPassword && editNewPassword !== editConfirmPassword) {
      setEditError('Konfirmasi password baru tidak cocok.');
      return;
    }
    setEditLoading(true);
    const res = await updateProfile({
      displayName: editDisplayName,
      oldPassword: editOldPassword || undefined,
      newPassword: editNewPassword || undefined,
    });
    setEditLoading(false);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setShowEditProfileModal(false);
      showToast('Profil & password berhasil diperbarui! ✨');
    } else {
      setEditError(res.error || 'Gagal memperbarui profil');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setShowLogoutConfirm(false);
    showToast('Kamu telah keluar akun');
  };

  const handleDeleteAccount = async () => {
    const res = await deleteAccount();
    setShowDeleteAccountConfirm(false);
    setShowEditProfileModal(false);
    if (res.success) {
      setCurrentUser(null);
      showToast('Akun profil telah dihapus dari cloud');
    } else {
      showToast(res.error || 'Gagal menghapus akun', 'error');
    }
  };

  // --- Cloud Sync Handlers ---
  const handlePushCloud = async () => {
    setIsSyncing(true);
    const res = await pushToCloud(currentUser?.username);
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
    const res = await pullFromCloud(currentUser?.username);
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
        {/* User Account / Profile Card */}
        {currentUser ? (
          <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                  style={{ backgroundColor: currentUser.avatarColor || 'var(--color-primary)' }}
                >
                  {(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-zinc-900 leading-tight">
                      {currentUser.displayName}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">@{currentUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditDisplayName(currentUser.displayName);
                  setEditOldPassword('');
                  setEditNewPassword('');
                  setEditConfirmPassword('');
                  setEditError(null);
                  setShowEditProfileModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Edit Profil</span>
              </button>
            </div>

            <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                <span>Perangkat ini terhubung ke cloud</span>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 active:opacity-75 transition-opacity"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ganti Akun / Keluar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 rounded-2xl p-4 border border-blue-100 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                <UserCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-zinc-800">Akun Pengguna (Sinkronisasi)</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                  Gunakan username & password untuk membedakan data antar perangkat (HP / Laptop) & sinkronkan otomatis.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setAuthTab('login');
                setAuthUsername('');
                setAuthPassword('');
                setAuthDisplayName('');
                setAuthConfirmPassword('');
                setAuthError(null);
                setShowAuthModal(true);
              }}
              className="w-full btn-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Masuk atau Daftar Akun</span>
            </button>
          </div>
        )}

        {/* Cloud Sync & Backup Card */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-zinc-800">Cloud Sync (Supabase)</p>
                  {currentUser && (
                    <span className="text-[10px] text-blue-600 font-mono font-medium bg-blue-50 px-1.5 py-0.2 rounded">
                      @{currentUser.username}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${cloudStatus?.tablesReady ? 'bg-emerald-500 animate-pulse' : cloudStatus?.connected ? 'bg-amber-500' : 'bg-zinc-400'}`} />
                  <span className="text-[10px] text-zinc-500">
                    {cloudStatus?.tablesReady
                      ? (currentUser ? `Tersambung ke akun @${currentUser.username}` : 'Terhubung & Siap (Mode Tamu)')
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

        {/* Donation / Saweria Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 rounded-2xl p-4 border border-amber-200/70 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-zinc-800">Dukung Aplikasi Ini ☕</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200/80">
                  Saweria
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                Suka dengan Spendly? Kamu bisa dukung pengembangan aplikasi ini lewat Saweria!
              </p>
            </div>
          </div>

          <a
            href="https://saweria.co/littlexierra"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Coffee className="w-4 h-4" />
            <span>Traktir Kopi di Saweria</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80 ml-0.5" />
          </a>
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

      {/* Auth Modal (Masuk / Daftar Akun) */}
      <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)} title="Akun Pengguna">
        <div className="space-y-4">
          {/* Segmented Tab */}
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => { setAuthTab('login'); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                authTab === 'login' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}
            >
              Masuk Akun
            </button>
            <button
              onClick={() => { setAuthTab('register'); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                authTab === 'register' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}
            >
              Buat Akun Baru
            </button>
          </div>

          {authError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <p className="leading-snug">{authError}</p>
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={e => setAuthUsername(cleanUsernameInput(e.target.value))}
                  placeholder="misal: tanu_123"
                  className="input-field w-full text-xs font-mono py-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="input-field w-full text-xs py-2 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2 text-[11px] text-blue-700 leading-snug">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Saat masuk, data cadangan terbaru dari cloud akun ini akan langsung dimuat di perangkat ini.</span>
              </div>

              <button
                type="submit"
                disabled={authLoading || !authUsername || !authPassword}
                className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-sm"
              >
                {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>{authLoading ? 'Memeriksa...' : 'Masuk Sekarang'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Nama Tampilan</label>
                <input
                  type="text"
                  required
                  value={authDisplayName}
                  onChange={e => setAuthDisplayName(e.target.value)}
                  placeholder="Nama panggilan, misal: Tanu Jaya"
                  className="input-field w-full text-xs py-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Username Unik</label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={e => setAuthUsername(cleanUsernameInput(e.target.value))}
                  placeholder="huruf kecil, misal: tanu21"
                  className="input-field w-full text-xs font-mono py-2"
                />
                <p className="text-[10px] text-zinc-400 mt-1">Username dipakai untuk membedakan slot data kamu di cloud.</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="input-field w-full text-xs py-2 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Konfirmasi Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={authConfirmPassword}
                  onChange={e => setAuthConfirmPassword(e.target.value)}
                  placeholder="Ulangi password di atas"
                  className="input-field w-full text-xs py-2"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-start gap-2 text-[11px] text-zinc-600 leading-snug">
                <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>Simpel tanpa verifikasi email! Data di perangkat ini akan langsung dicadangkan ke akun barumu.</span>
              </div>

              <button
                type="submit"
                disabled={authLoading || !authUsername || !authPassword || !authConfirmPassword}
                className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-sm"
              >
                {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{authLoading ? 'Membuat Akun...' : 'Buat Akun & Sinkronkan'}</span>
              </button>
            </form>
          )}
        </div>
      </Modal>

      {/* Edit Profile Modal (CRUD Profil) */}
      <Modal open={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} title="Edit Profil & Password">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {editError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <p className="leading-snug">{editError}</p>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-zinc-600 block mb-1">Username Akun</label>
            <div className="p-2.5 bg-zinc-100 rounded-xl text-xs font-mono font-bold text-zinc-700 flex items-center justify-between">
              <span>@{currentUser?.username}</span>
              <span className="text-[10px] text-zinc-400 font-sans font-normal">(Identitas cloud permanen)</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-600 block mb-1">Nama Tampilan</label>
            <input
              type="text"
              required
              value={editDisplayName}
              onChange={e => setEditDisplayName(e.target.value)}
              placeholder="Nama panggilan kamu"
              className="input-field w-full text-xs py-2"
            />
          </div>

          <div className="pt-2 border-t border-zinc-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-800">Ubah Password (Opsional)</p>
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="text-[10px] text-blue-600 font-semibold flex items-center gap-1"
              >
                {showEditPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>

            <div>
              <label className="text-[10px] font-medium text-zinc-500 block mb-1">Password Lama</label>
              <input
                type={showEditPassword ? 'text' : 'password'}
                value={editOldPassword}
                onChange={e => setEditOldPassword(e.target.value)}
                placeholder="Diperlukan jika ingin ganti password"
                className="input-field w-full text-xs py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-zinc-500 block mb-1">Password Baru</label>
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  minLength={4}
                  value={editNewPassword}
                  onChange={e => setEditNewPassword(e.target.value)}
                  placeholder="Min 4 karakter"
                  className="input-field w-full text-xs py-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-zinc-500 block mb-1">Konfirmasi Baru</label>
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editConfirmPassword}
                  onChange={e => setEditConfirmPassword(e.target.value)}
                  placeholder="Ulangi baru"
                  className="input-field w-full text-xs py-2"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditProfileModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 active:scale-95 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {editLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowDeleteAccountConfirm(true)}
              className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
            >
              Hapus Profil Akun Ini dari Cloud
            </button>
          </div>
        </form>
      </Modal>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Ganti Akun / Keluar?"
        message={`Kamu sedang masuk sebagai @${currentUser?.username}. Data cadangan kamu tetap tersimpan aman di cloud. Kamu bisa masuk kembali kapan saja di perangkat ini atau perangkat lain.`}
        confirmText="Keluar Akun"
        danger
      />

      {/* Delete Account Confirm Dialog */}
      <ConfirmDialog
        open={showDeleteAccountConfirm}
        onClose={() => setShowDeleteAccountConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Hapus Akun Cloud?"
        message={`Hapus profil akun @${currentUser?.username} dari cloud? Akun ini tidak akan bisa login lagi.`}
        confirmText="Hapus Akun"
        danger
      />

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
        message={`Ini akan menimpa data di perangkat ini dengan data cadangan terbaru dari cloud (${currentUser ? `@${currentUser.username}` : 'slot utama'}). Lanjutkan?`}
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
