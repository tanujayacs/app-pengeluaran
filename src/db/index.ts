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
// Seed Data
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

const seedWallets: Omit<Wallet, 'id'>[] = [
  { name: 'BCA', type: 'bank', balance: 5000000, color: '#0066AE', icon: 'Landmark' },
  { name: 'eMoney', type: 'ewallet', balance: 200000, color: '#F59E0B', icon: 'CreditCard' },
  { name: 'ShopeePay', type: 'ewallet', balance: 150000, color: '#EE4D2D', icon: 'Smartphone' },
  { name: 'Mandiri', type: 'bank', balance: 3000000, color: '#003D79', icon: 'Landmark' },
];

const seedTemplates: Omit<ExpenseTemplate, 'id'>[] = [
  {
    name: 'Commute Hari Kerja',
    items: [
      { title: 'LRT Pergi', amount: 10000, categoryId: 1, walletId: 1 },
      { title: 'LRT Pulang', amount: 17600, categoryId: 1, walletId: 1 },
      { title: 'Busway Pergi', amount: 3500, categoryId: 1, walletId: 1 },
      { title: 'Parkir Motor LRT Bekasi Barat', amount: 8000, categoryId: 1, walletId: 1 },
    ],
  },
];

function generateSeedTransactions(): Omit<Transaction, 'id'>[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = `${y}-${pad(m + 1)}`;
  const txns: Omit<Transaction, 'id'>[] = [];

  // Gaji
  txns.push({
    type: 'income', amount: 8000000, categoryId: 5, walletId: 1,
    title: 'Gaji Bulanan', date: `${month}-01`, time: '09:00',
    notes: 'Gaji bulan ini', createdAt: new Date(y, m, 1).getTime(),
  });

  const expenses: { amount: number; catId: number; walletId: number; title: string; day: number; time: string; notes?: string }[] = [
    { amount: 10000, catId: 1, walletId: 1, title: 'LRT Pergi', day: 2, time: '06:30' },
    { amount: 17600, catId: 1, walletId: 1, title: 'LRT Pulang', day: 2, time: '18:00' },
    { amount: 3500, catId: 1, walletId: 1, title: 'Busway Pergi', day: 2, time: '07:00' },
    { amount: 8000, catId: 1, walletId: 1, title: 'Parkir Motor LRT Bekasi Barat', day: 2, time: '06:15' },
    { amount: 15000, catId: 3, walletId: 2, title: 'Warteg Siang', day: 2, time: '12:30', notes: 'Sayur Tahu + Tempe + Kentang' },
    { amount: 28000, catId: 3, walletId: 3, title: 'Kopi Kenangan', day: 3, time: '08:15', notes: 'Es Kopi Susu Kenangan' },
    { amount: 10000, catId: 1, walletId: 1, title: 'LRT Pergi', day: 3, time: '06:30' },
    { amount: 17600, catId: 1, walletId: 1, title: 'LRT Pulang', day: 3, time: '18:00' },
    { amount: 3500, catId: 1, walletId: 1, title: 'Busway Pergi', day: 3, time: '07:00' },
    { amount: 8000, catId: 1, walletId: 1, title: 'Parkir Motor LRT Bekasi Barat', day: 3, time: '06:15' },
    { amount: 103663, catId: 2, walletId: 1, title: 'Belanja Olshop', day: 4, time: '20:00', notes: 'Shopee' },
    { amount: 100000, catId: 4, walletId: 4, title: 'GYM Bank Mega', day: 5, time: '07:00' },
    { amount: 10000, catId: 3, walletId: 2, title: 'Warteg Siang', day: 5, time: '12:00' },
  ];

  const maxDay = Math.min(now.getDate(), 20);
  expenses.forEach(exp => {
    if (exp.day <= maxDay) {
      txns.push({
        type: 'expense', amount: exp.amount, categoryId: exp.catId, walletId: exp.walletId,
        title: exp.title,
        date: `${month}-${pad(exp.day)}`,
        time: exp.time, notes: exp.notes, createdAt: new Date(y, m, exp.day).getTime(),
      });
    }
  });

  return txns;
}

// ============================================================
// Seeder — runs once when DB is empty
// ============================================================
export async function seedDatabase(): Promise<void> {
  const count = await db.wallets.count();
  if (count > 0) return;

  await db.transaction('rw', [db.wallets, db.categories, db.transactions, db.debts, db.expenseTemplates], async () => {
    await db.categories.bulkAdd(seedCategories);
    await db.wallets.bulkAdd(seedWallets);
    await db.transactions.bulkAdd(generateSeedTransactions());
    await db.expenseTemplates.bulkAdd(seedTemplates);
  });
}
