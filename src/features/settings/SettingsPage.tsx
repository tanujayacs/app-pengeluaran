// ============================================================
// Spendly — Settings Page
// ============================================================
import { useState, useRef } from 'react';
import { useStore } from '../../hooks/useStore';
import { ConfirmDialog } from '../../components/Modal';
import {
  Download, Upload, FileJson, FileSpreadsheet,
  Moon, Sun, Trash2, Leaf, Info,
} from 'lucide-react';

export function SettingsPage() {
  const { theme, toggleTheme, exportData, importData, resetDatabase, transactions, showToast } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExportJSON = async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendly-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported as JSON!');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Type', 'Amount', 'Merchant', 'Notes'];
    const rows = transactions.map(t =>
      [t.date, t.time, t.type, t.amount, `"${t.merchant}"`, `"${t.notes || ''}"`].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendly-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported as CSV!');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importData(text);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-bold">Settings</h2>

      {/* App Info */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Spendly</h3>
            <p className="text-xs text-zinc-400">Offline-First Expense Tracker v1.0</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 bg-primary-50 dark:bg-primary-950/30 rounded-xl">
          <Info className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
          <p className="text-xs text-primary-700 dark:text-primary-300">
            Your data is stored locally on this device using IndexedDB. No data is sent to any server.
            Export your data regularly to avoid data loss.
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4">Appearance</h3>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
            <div className="text-left">
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-zinc-400">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
            </div>
          </div>
          <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${theme === 'dark' ? 'bg-primary-500' : 'bg-zinc-300'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`} />
          </div>
        </button>
      </div>

      {/* Data Management */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4">Data Management</h3>
        <div className="space-y-3">
          <button onClick={handleExportJSON} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
            <FileJson className="w-5 h-5 text-emerald-500" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Export as JSON</p>
              <p className="text-xs text-zinc-400">Full backup including all settings</p>
            </div>
            <Download className="w-4 h-4 text-zinc-400" />
          </button>

          <button onClick={handleExportCSV} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
            <FileSpreadsheet className="w-5 h-5 text-sky-500" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Export as CSV</p>
              <p className="text-xs text-zinc-400">Transaction data for spreadsheets</p>
            </div>
            <Download className="w-4 h-4 text-zinc-400" />
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
            <Upload className="w-5 h-5 text-indigo-500" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Import JSON Backup</p>
              <p className="text-xs text-zinc-400">Restore from a previous backup</p>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-5 border-rose-200 dark:border-rose-800/50">
        <h3 className="text-sm font-semibold text-rose-500 mb-4">Danger Zone</h3>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
        >
          <Trash2 className="w-5 h-5 text-rose-500" />
          <div className="text-left flex-1">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Reset All Data</p>
            <p className="text-xs text-rose-400 dark:text-rose-500">Permanently delete all data and start fresh</p>
          </div>
        </button>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetDatabase}
        title="Reset All Data"
        message="This will permanently delete ALL your transactions, wallets, budgets, and settings. This action cannot be undone. Are you sure?"
        confirmText="Reset Everything"
        danger
      />
    </div>
  );
}
