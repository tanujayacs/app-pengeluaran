// ============================================================
// Spendly v2 — Dexie.js Database + Seed Data
// ============================================================
import Dexie, { type Table } from 'dexie';
import type { Transaction, Wallet, Category, Debt, ExpenseTemplate, CustomRekapCard } from '../types';

export class SpendlyDB extends Dexie {
  transactions!: Table<Transaction, number>;
  wallets!: Table<Wallet, number>;
  categories!: Table<Category, number>;
  debts!: Table<Debt, number>;
  expenseTemplates!: Table<ExpenseTemplate, number>;
  customRekapCards!: Table<CustomRekapCard, number>;

  constructor() {
    super('SpendlyDB');
    this.version(3).stores({
      transactions: '++id, type, categoryId, walletId, date, createdAt',
      wallets: '++id, name, type',
      categories: '++id, name, type',
      debts: '++id, type, settled, createdAt',
      expenseTemplates: '++id, name',
      customRekapCards: '++id, createdAt',
    });
  }
}

export const db = new SpendlyDB();

// ============================================================
// Seed Data (Standard Categories only — No dummy wallets or transactions)
// ============================================================

const seedCategories: Omit<Category, 'id'>[] = [
  { name: 'Transportasi', type: 'expense', icon: 'Car' },
  { name: 'Groceries', type: 'expense', icon: 'ShoppingCart' },
  { name: 'Makan dan Minum', type: 'expense', icon: 'UtensilsCrossed' },
  { name: 'Kesehatan', type: 'expense', icon: 'Heart' },
  // Income
  { name: 'Gaji', type: 'income', icon: 'Banknote' },
  { name: 'Lainnya', type: 'income', icon: 'Wallet' },
];

// ============================================================
// Seeder — Clean Start (0 transactions, 0 wallets, standard categories)
// ============================================================
export async function seedDatabase(): Promise<void> {
  // If the browser still has the old demo/dummy transactions from previous build, clean them once
  const cleanDummyRan = localStorage.getItem('spendly_dummy_cleaned_v2');
  if (!cleanDummyRan) {
    try {
      const allTxns = await db.transactions.toArray();
      const dummyTitles = [
        'Gaji Bulanan', 'LRT Pergi', 'LRT Pulang', 'Busway Pergi',
        'Parkir Motor LRT Bekasi Barat', 'Warteg Siang', 'Kopi Kenangan',
        'Belanja Olshop', 'GYM Bank Mega',
      ];
      const hasOnlyDummyTxns = allTxns.length > 0 && allTxns.every(t => dummyTitles.includes(t.title));
      if (hasOnlyDummyTxns) {
        await db.transactions.clear();
      }

      const allWallets = await db.wallets.toArray();
      const dummyWalletNames = ['BCA', 'eMoney', 'ShopeePay', 'Mandiri'];
      const hasOnlyDummyWallets = allWallets.length > 0 && allWallets.every(w => dummyWalletNames.includes(w.name));
      if (hasOnlyDummyWallets) {
        await db.wallets.clear();
      }

      const allTemplates = await db.expenseTemplates.toArray();
      if (allTemplates.length === 1 && allTemplates[0].name === 'Commute Hari Kerja') {
        await db.expenseTemplates.clear();
      }
    } catch {
      /* ignore */
    }
    localStorage.setItem('spendly_dummy_cleaned_v2', 'true');
  }

  // Ensure standard categories exist
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd(seedCategories);
  }
}
