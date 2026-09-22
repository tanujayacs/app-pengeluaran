// ============================================================
// Spendly — Dexie.js Database Schema & Seed Data
// ============================================================
import Dexie, { type Table } from 'dexie';
import type { Transaction, Wallet, Category, Budget, RecurringTransaction, SavingsGoal } from '../types';

export class SpendlyDB extends Dexie {
  transactions!: Table<Transaction, number>;
  wallets!: Table<Wallet, number>;
  categories!: Table<Category, number>;
  budgets!: Table<Budget, number>;
  recurringTransactions!: Table<RecurringTransaction, number>;
  savingsGoals!: Table<SavingsGoal, number>;

  constructor() {
    super('SpendlyDB');
    this.version(1).stores({
      transactions: '++id, type, categoryId, walletId, date, createdAt',
      wallets: '++id, name, type',
      categories: '++id, name, type',
      budgets: '++id, month, categoryId, [month+categoryId]',
      recurringTransactions: '++id, active, nextDueDate',
      savingsGoals: '++id, name',
    });
  }
}

export const db = new SpendlyDB();

// ============================================================
// Seed Data — Indonesian locale realistic data
// ============================================================

const seedCategories: Omit<Category, 'id'>[] = [
  // Expense categories
  { name: 'Food & Drink', type: 'expense', color: '#F97316', icon: 'UtensilsCrossed', isDefault: true },
  { name: 'Coffee', type: 'expense', color: '#92400E', icon: 'Coffee', isDefault: true },
  { name: 'Transport', type: 'expense', color: '#3B82F6', icon: 'Car', isDefault: true },
  { name: 'Groceries', type: 'expense', color: '#22C55E', icon: 'ShoppingCart', isDefault: true },
  { name: 'Shopping', type: 'expense', color: '#EC4899', icon: 'ShoppingBag', isDefault: true },
  { name: 'Bills', type: 'expense', color: '#EF4444', icon: 'Receipt', isDefault: true },
  { name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: 'Gamepad2', isDefault: false },
  { name: 'Health', type: 'expense', color: '#14B8A6', icon: 'Heart', isDefault: false },
  { name: 'Education', type: 'expense', color: '#6366F1', icon: 'GraduationCap', isDefault: false },
  { name: 'Subscription', type: 'expense', color: '#F43F5E', icon: 'Repeat', isDefault: false },
  // Income categories
  { name: 'Salary', type: 'income', color: '#10B981', icon: 'Banknote', isDefault: true },
  { name: 'Freelance', type: 'income', color: '#06B6D4', icon: 'Laptop', isDefault: true },
  { name: 'Investment', type: 'income', color: '#F59E0B', icon: 'TrendingUp', isDefault: false },
  { name: 'Gift', type: 'income', color: '#D946EF', icon: 'Gift', isDefault: false },
];

const seedWallets: Omit<Wallet, 'id'>[] = [
  { name: 'BCA', type: 'bank', balance: 8500000, color: '#0066AE', icon: 'Landmark' },
  { name: 'Cash', type: 'cash', balance: 750000, color: '#22C55E', icon: 'Wallet' },
  { name: 'GoPay', type: 'ewallet', balance: 320000, color: '#00AED6', icon: 'Smartphone' },
];

function generateSeedTransactions(): Omit<Transaction, 'id'>[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const txns: Omit<Transaction, 'id'>[] = [];

  // Income: Salary on the 1st
  txns.push({
    type: 'income', amount: 8000000, categoryId: 11, walletId: 1,
    merchant: 'PT Teknologi Nusantara', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
    time: '09:00', notes: 'Gaji bulan ini', createdAt: new Date(currentYear, currentMonth, 1).getTime(),
  });

  // Expenses spread over the month
  const expenses = [
    { amount: 28000, catId: 2, walletId: 3, merchant: 'Kopi Kenangan', day: 2, time: '08:15', notes: 'Es Kopi Susu Kenangan' },
    { amount: 25000, catId: 3, walletId: 3, merchant: 'Grab', day: 2, time: '07:30', notes: 'Grab ke kantor' },
    { amount: 45000, catId: 1, walletId: 2, merchant: 'Warteg Bahari', day: 3, time: '12:30', notes: 'Makan siang' },
    { amount: 150000, catId: 4, walletId: 1, merchant: 'Indomaret', day: 4, time: '18:00', notes: 'Belanja mingguan' },
    { amount: 35000, catId: 2, walletId: 3, merchant: 'Starbucks', day: 5, time: '09:00', notes: 'Caramel Macchiato' },
    { amount: 500000, catId: 6, walletId: 1, merchant: 'PLN', day: 5, time: '10:00', notes: 'Listrik bulan ini' },
    { amount: 30000, catId: 3, walletId: 3, merchant: 'Gojek', day: 6, time: '08:00', notes: 'GoRide ke mall' },
    { amount: 250000, catId: 5, walletId: 1, merchant: 'Uniqlo', day: 7, time: '15:00', notes: 'Kaos polos 2 pcs' },
    { amount: 55000, catId: 1, walletId: 2, merchant: 'McDonalds', day: 8, time: '19:30', notes: 'PaNas 2 + McFlurry' },
    { amount: 28000, catId: 2, walletId: 3, merchant: 'Kopi Kenangan', day: 9, time: '08:30', notes: 'Avocado Coffee' },
    { amount: 200000, catId: 4, walletId: 1, merchant: 'Alfamart', day: 10, time: '17:00', notes: 'Kebutuhan rumah' },
    { amount: 75000, catId: 7, walletId: 1, merchant: 'CGV Cinemas', day: 11, time: '20:00', notes: 'Nonton film' },
    { amount: 22000, catId: 3, walletId: 3, merchant: 'Grab', day: 12, time: '07:45', notes: 'Grab ke kantor' },
    { amount: 40000, catId: 1, walletId: 2, merchant: 'Hokben', day: 13, time: '12:15', notes: 'Super Bowl' },
    { amount: 180000, catId: 4, walletId: 1, merchant: 'Superindo', day: 14, time: '16:00', notes: 'Belanja mingguan' },
    { amount: 28000, catId: 2, walletId: 2, merchant: 'Fore Coffee', day: 15, time: '09:15', notes: 'Butterscotch Latte' },
    { amount: 100000, catId: 10, walletId: 1, merchant: 'Spotify', day: 15, time: '00:00', notes: 'Langganan Premium' },
    { amount: 50000, catId: 1, walletId: 2, merchant: 'Bakmi GM', day: 16, time: '13:00', notes: 'Bakmi Special' },
    { amount: 300000, catId: 8, walletId: 1, merchant: 'Apotek K-24', day: 17, time: '14:00', notes: 'Vitamin & obat' },
    { amount: 28000, catId: 2, walletId: 3, merchant: 'Kopi Kenangan', day: 18, time: '08:00', notes: 'Brown Sugar Latte' },
    { amount: 35000, catId: 3, walletId: 3, merchant: 'Gojek', day: 19, time: '18:00', notes: 'GoRide pulang' },
    { amount: 65000, catId: 1, walletId: 1, merchant: 'Pizza Hut', day: 20, time: '19:00', notes: 'Pizza Medium' },
  ];

  const maxDay = Math.min(now.getDate(), 22);

  expenses.forEach(exp => {
    if (exp.day <= maxDay) {
      txns.push({
        type: 'expense', amount: exp.amount, categoryId: exp.catId, walletId: exp.walletId,
        merchant: exp.merchant,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(exp.day).padStart(2, '0')}`,
        time: exp.time, notes: exp.notes, createdAt: new Date(currentYear, currentMonth, exp.day).getTime(),
      });
    }
  });

  return txns;
}

const seedBudgets: Omit<Budget, 'id'>[] = (() => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return [
    { month, categoryId: 1, allocatedAmount: 800000 },
    { month, categoryId: 2, allocatedAmount: 300000 },
    { month, categoryId: 3, allocatedAmount: 500000 },
    { month, categoryId: 4, allocatedAmount: 600000 },
    { month, categoryId: 5, allocatedAmount: 500000 },
    { month, categoryId: 6, allocatedAmount: 1000000 },
  ];
})();

const seedRecurring: Omit<RecurringTransaction, 'id'>[] = [
  { name: 'Spotify Premium', amount: 100000, categoryId: 10, walletId: 1, frequency: 'monthly', nextDueDate: '2026-10-15', active: true },
  { name: 'Listrik PLN', amount: 500000, categoryId: 6, walletId: 1, frequency: 'monthly', nextDueDate: '2026-10-05', active: true },
  { name: 'Internet IndiHome', amount: 350000, categoryId: 6, walletId: 1, frequency: 'monthly', nextDueDate: '2026-10-10', active: true },
];

const seedGoals: Omit<SavingsGoal, 'id'>[] = [
  { name: 'iPhone 16 Pro', targetAmount: 20000000, currentAmount: 5500000, deadline: '2027-03-01', icon: 'Smartphone' },
  { name: 'Emergency Fund', targetAmount: 50000000, currentAmount: 12000000, icon: 'Shield' },
];

// ============================================================
// Database Seeder — runs only on first app load
// ============================================================
export async function seedDatabase(): Promise<void> {
  const walletCount = await db.wallets.count();
  if (walletCount > 0) return; // Already seeded

  await db.transaction('rw', [db.wallets, db.categories, db.transactions, db.budgets, db.recurringTransactions, db.savingsGoals], async () => {
    await db.categories.bulkAdd(seedCategories);
    await db.wallets.bulkAdd(seedWallets);
    await db.transactions.bulkAdd(generateSeedTransactions());
    await db.budgets.bulkAdd(seedBudgets);
    await db.recurringTransactions.bulkAdd(seedRecurring);
    await db.savingsGoals.bulkAdd(seedGoals);
  });
}
