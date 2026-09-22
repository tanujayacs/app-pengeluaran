// ============================================================
// Spendly — Zustand Global Store
// ============================================================
import { create } from 'zustand';
import { db } from '../db';
import type { Transaction, Wallet, Category, Budget, RecurringTransaction, SavingsGoal, TabId, Theme } from '../types';
import { getCurrentMonth } from '../utils/formatters';

interface SpendlyState {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Data
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  savingsGoals: SavingsGoal[];

  // Modals
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (txn: Transaction | null) => void;

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Data loading
  loadAllData: () => Promise<void>;

  // Transaction CRUD
  addTransaction: (txn: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: number, txn: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;

  // Wallet
  addWallet: (wallet: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (id: number, wallet: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: number) => Promise<void>;

  // Budget
  saveBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;

  // Goals
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<void>;
  updateGoal: (id: number, goal: Partial<SavingsGoal>) => Promise<void>;
  depositToGoal: (id: number, amount: number) => Promise<void>;
  withdrawFromGoal: (id: number, amount: number) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;

  // Recurring
  addRecurring: (rec: Omit<RecurringTransaction, 'id'>) => Promise<void>;
  deleteRecurring: (id: number) => Promise<void>;
  toggleRecurring: (id: number) => Promise<void>;

  // Settings
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

export const useStore = create<SpendlyState>()((set, get) => ({
  // Navigation
  activeTab: 'dashboard' as TabId,
  setActiveTab: (tab: TabId) => set({ activeTab: tab }),

  // Theme
  theme: (localStorage.getItem('spendly-theme') as Theme) || 'light',
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('spendly-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    set({ theme: newTheme });
  },

  // Data
  transactions: [],
  wallets: [],
  categories: [],
  budgets: [],
  recurringTransactions: [],
  savingsGoals: [],

  // Modals
  showAddModal: false,
  setShowAddModal: (show: boolean) => set({ showAddModal: show }),
  editingTransaction: null,
  setEditingTransaction: (txn: Transaction | null) => set({ editingTransaction: txn }),

  // Toast
  toast: null,
  showToast: (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },

  // Load all data from IndexedDB
  loadAllData: async () => {
    const [transactions, wallets, categories, budgets, recurringTransactions, savingsGoals] = await Promise.all([
      db.transactions.orderBy('createdAt').reverse().toArray(),
      db.wallets.toArray(),
      db.categories.toArray(),
      db.budgets.where('month').equals(getCurrentMonth()).toArray(),
      db.recurringTransactions.toArray(),
      db.savingsGoals.toArray(),
    ]);
    set({ transactions, wallets, categories, budgets, recurringTransactions, savingsGoals });
  },

  // Transaction CRUD
  addTransaction: async (txn: Omit<Transaction, 'id' | 'createdAt'>) => {
    const fullTxn: Transaction = { ...txn, createdAt: Date.now() };
    await db.transactions.add(fullTxn);

    // Update wallet balance
    const wallet = await db.wallets.get(txn.walletId);
    if (wallet) {
      if (txn.type === 'expense') {
        await db.wallets.update(txn.walletId, { balance: wallet.balance - txn.amount });
      } else if (txn.type === 'income') {
        await db.wallets.update(txn.walletId, { balance: wallet.balance + txn.amount });
      } else if (txn.type === 'transfer' && txn.destinationWalletId) {
        await db.wallets.update(txn.walletId, { balance: wallet.balance - txn.amount });
        const destWallet = await db.wallets.get(txn.destinationWalletId);
        if (destWallet) {
          await db.wallets.update(txn.destinationWalletId, { balance: destWallet.balance + txn.amount });
        }
      }
    }

    await get().loadAllData();
    get().showToast('Transaction added successfully!');
  },

  updateTransaction: async (id: number, updates: Partial<Transaction>) => {
    // Reverse old transaction effect
    const oldTxn = await db.transactions.get(id);
    if (oldTxn) {
      const oldWallet = await db.wallets.get(oldTxn.walletId);
      if (oldWallet) {
        if (oldTxn.type === 'expense') {
          await db.wallets.update(oldTxn.walletId, { balance: oldWallet.balance + oldTxn.amount });
        } else if (oldTxn.type === 'income') {
          await db.wallets.update(oldTxn.walletId, { balance: oldWallet.balance - oldTxn.amount });
        } else if (oldTxn.type === 'transfer' && oldTxn.destinationWalletId) {
          await db.wallets.update(oldTxn.walletId, { balance: oldWallet.balance + oldTxn.amount });
          const oldDest = await db.wallets.get(oldTxn.destinationWalletId);
          if (oldDest) {
            await db.wallets.update(oldTxn.destinationWalletId, { balance: oldDest.balance - oldTxn.amount });
          }
        }
      }
    }

    // Apply new transaction
    const newTxn = { ...oldTxn, ...updates } as Transaction;
    await db.transactions.update(id, updates);

    const newWallet = await db.wallets.get(newTxn.walletId);
    if (newWallet) {
      if (newTxn.type === 'expense') {
        await db.wallets.update(newTxn.walletId, { balance: newWallet.balance - newTxn.amount });
      } else if (newTxn.type === 'income') {
        await db.wallets.update(newTxn.walletId, { balance: newWallet.balance + newTxn.amount });
      } else if (newTxn.type === 'transfer' && newTxn.destinationWalletId) {
        await db.wallets.update(newTxn.walletId, { balance: newWallet.balance - newTxn.amount });
        const destWallet = await db.wallets.get(newTxn.destinationWalletId);
        if (destWallet) {
          await db.wallets.update(newTxn.destinationWalletId, { balance: destWallet.balance + newTxn.amount });
        }
      }
    }

    await get().loadAllData();
    get().showToast('Transaction updated!');
  },

  deleteTransaction: async (id: number) => {
    const txn = await db.transactions.get(id);
    if (txn) {
      const wallet = await db.wallets.get(txn.walletId);
      if (wallet) {
        if (txn.type === 'expense') {
          await db.wallets.update(txn.walletId, { balance: wallet.balance + txn.amount });
        } else if (txn.type === 'income') {
          await db.wallets.update(txn.walletId, { balance: wallet.balance - txn.amount });
        } else if (txn.type === 'transfer' && txn.destinationWalletId) {
          await db.wallets.update(txn.walletId, { balance: wallet.balance + txn.amount });
          const destWallet = await db.wallets.get(txn.destinationWalletId);
          if (destWallet) {
            await db.wallets.update(txn.destinationWalletId, { balance: destWallet.balance - txn.amount });
          }
        }
      }
      await db.transactions.delete(id);
    }
    await get().loadAllData();
    get().showToast('Transaction deleted');
  },

  // Wallet CRUD
  addWallet: async (wallet: Omit<Wallet, 'id'>) => {
    await db.wallets.add(wallet);
    await get().loadAllData();
    get().showToast('Wallet added!');
  },

  updateWallet: async (id: number, wallet: Partial<Wallet>) => {
    await db.wallets.update(id, wallet);
    await get().loadAllData();
  },

  deleteWallet: async (id: number) => {
    await db.wallets.delete(id);
    await get().loadAllData();
    get().showToast('Wallet deleted');
  },

  // Budget
  saveBudget: async (budget: Omit<Budget, 'id'>) => {
    const existing = await db.budgets
      .where('[month+categoryId]')
      .equals([budget.month, budget.categoryId])
      .first();
    if (existing?.id) {
      await db.budgets.update(existing.id, { allocatedAmount: budget.allocatedAmount });
    } else {
      await db.budgets.add(budget);
    }
    await get().loadAllData();
    get().showToast('Budget saved!');
  },

  // Goals
  addGoal: async (goal: Omit<SavingsGoal, 'id'>) => {
    await db.savingsGoals.add(goal);
    await get().loadAllData();
    get().showToast('Goal created!');
  },

  updateGoal: async (id: number, goal: Partial<SavingsGoal>) => {
    await db.savingsGoals.update(id, goal);
    await get().loadAllData();
  },

  depositToGoal: async (id: number, amount: number) => {
    const goal = await db.savingsGoals.get(id);
    if (goal) {
      await db.savingsGoals.update(id, { currentAmount: goal.currentAmount + amount });
      await get().loadAllData();
      get().showToast(`Deposited to ${goal.name}`);
    }
  },

  withdrawFromGoal: async (id: number, amount: number) => {
    const goal = await db.savingsGoals.get(id);
    if (goal) {
      await db.savingsGoals.update(id, { currentAmount: Math.max(0, goal.currentAmount - amount) });
      await get().loadAllData();
      get().showToast(`Withdrawn from ${goal.name}`);
    }
  },

  deleteGoal: async (id: number) => {
    await db.savingsGoals.delete(id);
    await get().loadAllData();
    get().showToast('Goal deleted');
  },

  // Recurring
  addRecurring: async (rec: Omit<RecurringTransaction, 'id'>) => {
    await db.recurringTransactions.add(rec);
    await get().loadAllData();
    get().showToast('Recurring bill added!');
  },

  deleteRecurring: async (id: number) => {
    await db.recurringTransactions.delete(id);
    await get().loadAllData();
    get().showToast('Recurring bill deleted');
  },

  toggleRecurring: async (id: number) => {
    const rec = await db.recurringTransactions.get(id);
    if (rec) {
      await db.recurringTransactions.update(id, { active: !rec.active });
      await get().loadAllData();
    }
  },

  // Export/Import
  exportData: async () => {
    const data = {
      transactions: await db.transactions.toArray(),
      wallets: await db.wallets.toArray(),
      categories: await db.categories.toArray(),
      budgets: await db.budgets.toArray(),
      recurringTransactions: await db.recurringTransactions.toArray(),
      savingsGoals: await db.savingsGoals.toArray(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData: async (json: string) => {
    try {
      const data = JSON.parse(json) as Record<string, unknown[]>;
      await db.transaction('rw', [db.transactions, db.wallets, db.categories, db.budgets, db.recurringTransactions, db.savingsGoals], async () => {
        await db.transactions.clear();
        await db.wallets.clear();
        await db.categories.clear();
        await db.budgets.clear();
        await db.recurringTransactions.clear();
        await db.savingsGoals.clear();
        if (data.transactions) await db.transactions.bulkAdd(data.transactions as Transaction[]);
        if (data.wallets) await db.wallets.bulkAdd(data.wallets as Wallet[]);
        if (data.categories) await db.categories.bulkAdd(data.categories as Category[]);
        if (data.budgets) await db.budgets.bulkAdd(data.budgets as Budget[]);
        if (data.recurringTransactions) await db.recurringTransactions.bulkAdd(data.recurringTransactions as RecurringTransaction[]);
        if (data.savingsGoals) await db.savingsGoals.bulkAdd(data.savingsGoals as SavingsGoal[]);
      });
      await get().loadAllData();
      get().showToast('Data imported successfully!');
    } catch {
      get().showToast('Failed to import data', 'error');
    }
  },

  resetDatabase: async () => {
    await db.transactions.clear();
    await db.wallets.clear();
    await db.categories.clear();
    await db.budgets.clear();
    await db.recurringTransactions.clear();
    await db.savingsGoals.clear();
    window.location.reload();
  },
}));
