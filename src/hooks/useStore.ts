// ============================================================
// Spendly v2 — Zustand Store (Revised)
// ============================================================
import { create } from 'zustand';
import { db } from '../db';
import type { Transaction, Wallet, Category, Debt, ExpenseTemplate, CustomRekapCard, TabId, AppSettings } from '../types';
import { themeColors } from '../utils/formatters';

const defaultSettings: AppSettings = {
  themeColor: 'blue',
  language: 'id',
  showDecimal: false,
  monthStartDate: 1,
  showAccumulatedBalance: false,
};

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem('spendly-settings');
    if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaultSettings;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem('spendly-settings', JSON.stringify(settings));
  applyThemeColor(settings.themeColor);
}

function applyThemeColor(color: string) {
  const theme = themeColors[color] || themeColors.blue;
  document.documentElement.style.setProperty('--color-primary', theme.primary);
  document.documentElement.style.setProperty('--color-primary-light', theme.light);
  document.documentElement.style.setProperty('--color-primary-dark', theme.dark);
}

interface SpendlyState {
  activeTab: TabId;
  prevTab: TabId | null;
  setActiveTab: (tab: TabId) => void;
  subPage: string | null;
  setSubPage: (page: string | null) => void;

  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  debts: Debt[];
  templates: ExpenseTemplate[];
  customRekapCards: CustomRekapCard[];

  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  showFAB: boolean;
  setShowFAB: (show: boolean) => void;

  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  loadAllData: () => Promise<void>;

  // Transaction
  addTransaction: (txn: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  addBatchTransactions: (txns: Omit<Transaction, 'id' | 'createdAt'>[]) => Promise<void>;
  updateTransaction: (id: number, txn: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;

  // Wallet
  addWallet: (wallet: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (id: number, wallet: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: number) => Promise<void>;

  // Category
  addCategory: (cat: Omit<Category, 'id'>) => Promise<number>;
  deleteCategory: (id: number) => Promise<void>;

  // Debt
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<void>;
  updateDebt: (id: number, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: number) => Promise<void>;
  toggleDebtSettled: (id: number) => Promise<void>;

  // Template
  addTemplate: (template: Omit<ExpenseTemplate, 'id'>) => Promise<void>;
  updateTemplate: (id: number, template: Partial<ExpenseTemplate>) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;

  // Custom Rekap
  addRekapCard: (card: Omit<CustomRekapCard, 'id' | 'createdAt'>) => Promise<void>;
  deleteRekapCard: (id: number) => Promise<void>;

  // Suggestions
  getTitleSuggestions: () => string[];
  getCategorySuggestions: () => Category[];

  // Export/Import
  exportData: () => Promise<string>;
  exportCSV: () => string;
  importData: (json: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

export const useStore = create<SpendlyState>()((set, get) => ({
  activeTab: 'transaksi' as TabId,
  prevTab: null as TabId | null,
  setActiveTab: (tab: TabId) => set(s => ({ prevTab: s.activeTab, activeTab: tab, subPage: null })),
  subPage: null,
  setSubPage: (page: string | null) => set({ subPage: page }),

  transactions: [],
  wallets: [],
  categories: [],
  debts: [],
  templates: [],
  customRekapCards: [],

  settings: loadSettings(),
  updateSettings: (partial: Partial<AppSettings>) => {
    const newSettings = { ...get().settings, ...partial };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  showFAB: false,
  setShowFAB: (show: boolean) => set({ showFAB: show }),

  toast: null,
  showToast: (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 2500);
  },

  loadAllData: async () => {
    const [transactions, wallets, categories, debts, templates, customRekapCards] = await Promise.all([
      db.transactions.orderBy('createdAt').reverse().toArray(),
      db.wallets.toArray(),
      db.categories.toArray(),
      db.debts.orderBy('createdAt').reverse().toArray(),
      db.expenseTemplates.toArray(),
      db.customRekapCards.orderBy('createdAt').reverse().toArray(),
    ]);
    set({ transactions, wallets, categories, debts, templates, customRekapCards });
  },

  // === TRANSACTION ===
  addTransaction: async (txn: Omit<Transaction, 'id' | 'createdAt'>) => {
    await db.transactions.add({ ...txn, createdAt: Date.now() });
    const wallet = await db.wallets.get(txn.walletId);
    if (wallet) {
      if (txn.type === 'expense') await db.wallets.update(txn.walletId, { balance: wallet.balance - txn.amount });
      else if (txn.type === 'income') await db.wallets.update(txn.walletId, { balance: wallet.balance + txn.amount });
      else if (txn.type === 'transfer' && txn.destinationWalletId) {
        await db.wallets.update(txn.walletId, { balance: wallet.balance - txn.amount });
        const dest = await db.wallets.get(txn.destinationWalletId);
        if (dest) await db.wallets.update(txn.destinationWalletId, { balance: dest.balance + txn.amount });
      }
    }
    await get().loadAllData();
    get().showToast('Transaksi ditambahkan');
  },

  addBatchTransactions: async (txns: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    for (const txn of txns) {
      await db.transactions.add({ ...txn, createdAt: Date.now() });
      const wallet = await db.wallets.get(txn.walletId);
      if (wallet && txn.type === 'expense') await db.wallets.update(txn.walletId, { balance: wallet.balance - txn.amount });
    }
    await get().loadAllData();
    get().showToast(`${txns.length} transaksi ditambahkan`);
  },

  updateTransaction: async (id: number, updates: Partial<Transaction>) => {
    const oldTxn = await db.transactions.get(id);
    if (oldTxn) {
      const oldW = await db.wallets.get(oldTxn.walletId);
      if (oldW) {
        if (oldTxn.type === 'expense') await db.wallets.update(oldTxn.walletId, { balance: oldW.balance + oldTxn.amount });
        else if (oldTxn.type === 'income') await db.wallets.update(oldTxn.walletId, { balance: oldW.balance - oldTxn.amount });
        else if (oldTxn.type === 'transfer' && oldTxn.destinationWalletId) {
          await db.wallets.update(oldTxn.walletId, { balance: oldW.balance + oldTxn.amount });
          const oldD = await db.wallets.get(oldTxn.destinationWalletId);
          if (oldD) await db.wallets.update(oldTxn.destinationWalletId, { balance: oldD.balance - oldTxn.amount });
        }
      }
      const newTxn = { ...oldTxn, ...updates } as Transaction;
      await db.transactions.update(id, updates);
      const newW = await db.wallets.get(newTxn.walletId);
      if (newW) {
        if (newTxn.type === 'expense') await db.wallets.update(newTxn.walletId, { balance: newW.balance - newTxn.amount });
        else if (newTxn.type === 'income') await db.wallets.update(newTxn.walletId, { balance: newW.balance + newTxn.amount });
        else if (newTxn.type === 'transfer' && newTxn.destinationWalletId) {
          await db.wallets.update(newTxn.walletId, { balance: newW.balance - newTxn.amount });
          const dest = await db.wallets.get(newTxn.destinationWalletId);
          if (dest) await db.wallets.update(newTxn.destinationWalletId, { balance: dest.balance + newTxn.amount });
        }
      }
    }
    await get().loadAllData();
    get().showToast('Transaksi diperbarui');
  },

  deleteTransaction: async (id: number) => {
    const txn = await db.transactions.get(id);
    if (txn) {
      const w = await db.wallets.get(txn.walletId);
      if (w) {
        if (txn.type === 'expense') await db.wallets.update(txn.walletId, { balance: w.balance + txn.amount });
        else if (txn.type === 'income') await db.wallets.update(txn.walletId, { balance: w.balance - txn.amount });
        else if (txn.type === 'transfer' && txn.destinationWalletId) {
          await db.wallets.update(txn.walletId, { balance: w.balance + txn.amount });
          const d = await db.wallets.get(txn.destinationWalletId);
          if (d) await db.wallets.update(txn.destinationWalletId, { balance: d.balance - txn.amount });
        }
      }
      await db.transactions.delete(id);
    }
    await get().loadAllData();
    get().showToast('Transaksi dihapus');
  },

  // === WALLET ===
  addWallet: async (wallet: Omit<Wallet, 'id'>) => { await db.wallets.add(wallet); await get().loadAllData(); get().showToast('Rekening ditambahkan'); },
  updateWallet: async (id: number, wallet: Partial<Wallet>) => { await db.wallets.update(id, wallet); await get().loadAllData(); get().showToast('Rekening diperbarui'); },
  deleteWallet: async (id: number) => { await db.wallets.delete(id); await get().loadAllData(); get().showToast('Rekening dihapus'); },

  // === CATEGORY ===
  addCategory: async (cat: Omit<Category, 'id'>): Promise<number> => {
    const id = await db.categories.add(cat);
    await get().loadAllData();
    return id as number;
  },
  deleteCategory: async (id: number) => { await db.categories.delete(id); await get().loadAllData(); get().showToast('Kategori dihapus'); },

  // === DEBT ===
  addDebt: async (debt: Omit<Debt, 'id' | 'createdAt'>) => { await db.debts.add({ ...debt, createdAt: Date.now() }); await get().loadAllData(); get().showToast('Hutang ditambahkan'); },
  updateDebt: async (id: number, debt: Partial<Debt>) => { await db.debts.update(id, debt); await get().loadAllData(); get().showToast('Hutang diperbarui'); },
  deleteDebt: async (id: number) => { await db.debts.delete(id); await get().loadAllData(); get().showToast('Hutang dihapus'); },
  toggleDebtSettled: async (id: number) => {
    const debt = await db.debts.get(id);
    if (debt) {
      const settled = !debt.settled;
      await db.debts.update(id, { settled, settledDate: settled ? new Date().toISOString().split('T')[0] : undefined });
      await get().loadAllData();
      get().showToast(settled ? 'Ditandai lunas' : 'Ditandai belum lunas');
    }
  },

  // === TEMPLATE ===
  addTemplate: async (template: Omit<ExpenseTemplate, 'id'>) => { await db.expenseTemplates.add(template); await get().loadAllData(); get().showToast('Template ditambahkan'); },
  updateTemplate: async (id: number, template: Partial<ExpenseTemplate>) => { await db.expenseTemplates.update(id, template); await get().loadAllData(); get().showToast('Template diperbarui'); },
  deleteTemplate: async (id: number) => { await db.expenseTemplates.delete(id); await get().loadAllData(); get().showToast('Template dihapus'); },

  // === CUSTOM REKAP ===
  addRekapCard: async (card: Omit<CustomRekapCard, 'id' | 'createdAt'>) => { await db.customRekapCards.add({ ...card, createdAt: Date.now() }); await get().loadAllData(); get().showToast('Custom rekap ditambahkan'); },
  deleteRekapCard: async (id: number) => { await db.customRekapCards.delete(id); await get().loadAllData(); get().showToast('Custom rekap dihapus'); },

  // === SUGGESTIONS ===
  getTitleSuggestions: (): string[] => {
    const titleCount = new Map<string, number>();
    get().transactions.forEach((t: Transaction) => {
      if (t.title && t.type === 'expense') titleCount.set(t.title, (titleCount.get(t.title) || 0) + 1);
    });
    return Array.from(titleCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([title]) => title);
  },

  getCategorySuggestions: (): Category[] => {
    const catCount = new Map<number, number>();
    get().transactions.forEach((t: Transaction) => {
      if (t.type === 'expense' && t.categoryId) catCount.set(t.categoryId, (catCount.get(t.categoryId) || 0) + 1);
    });
    const sorted = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1]);
    return sorted.map(([id]) => get().categories.find(c => c.id === id)).filter(Boolean) as Category[];
  },

  // === EXPORT/IMPORT ===
  exportData: async () => {
    const data = {
      transactions: await db.transactions.toArray(),
      wallets: await db.wallets.toArray(),
      categories: await db.categories.toArray(),
      debts: await db.debts.toArray(),
      expenseTemplates: await db.expenseTemplates.toArray(),
      customRekapCards: await db.customRekapCards.toArray(),
      settings: get().settings,
    };
    return JSON.stringify(data, null, 2);
  },

  exportCSV: (): string => {
    const headers = ['Tanggal', 'Jam', 'Tipe', 'Jumlah', 'Judul', 'Keterangan'];
    const rows = get().transactions.map((t: Transaction) =>
      [t.date, t.time, t.type, t.amount, `"${t.title}"`, `"${t.notes || ''}"`].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  },

  importData: async (json: string) => {
    try {
      const data = JSON.parse(json) as Record<string, unknown[]>;
      await db.transaction('rw', [db.transactions, db.wallets, db.categories, db.debts, db.expenseTemplates, db.customRekapCards], async () => {
        await db.transactions.clear(); await db.wallets.clear(); await db.categories.clear();
        await db.debts.clear(); await db.expenseTemplates.clear(); await db.customRekapCards.clear();
        if (data.transactions) await db.transactions.bulkAdd(data.transactions as Transaction[]);
        if (data.wallets) await db.wallets.bulkAdd(data.wallets as Wallet[]);
        if (data.categories) await db.categories.bulkAdd(data.categories as Category[]);
        if (data.debts) await db.debts.bulkAdd(data.debts as Debt[]);
        if (data.expenseTemplates) await db.expenseTemplates.bulkAdd(data.expenseTemplates as ExpenseTemplate[]);
        if (data.customRekapCards) await db.customRekapCards.bulkAdd(data.customRekapCards as CustomRekapCard[]);
      });
      await get().loadAllData();
      get().showToast('Data berhasil diimpor!');
    } catch {
      get().showToast('Gagal mengimpor data', 'error');
    }
  },

  resetDatabase: async () => {
    await db.transactions.clear(); await db.wallets.clear(); await db.categories.clear();
    await db.debts.clear(); await db.expenseTemplates.clear(); await db.customRekapCards.clear();
    localStorage.removeItem('spendly-settings');
    window.location.reload();
  },
}));
