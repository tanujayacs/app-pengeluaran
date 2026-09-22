// ============================================================
// Spendly — Core Domain Types
// ============================================================

export interface Transaction {
  id?: number;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  categoryId: number;
  walletId: number;
  destinationWalletId?: number;
  merchant: string;
  date: string; // ISO format: YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  tags?: string[];
  createdAt: number;
}

export interface Wallet {
  id?: number;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'card';
  balance: number;
  color: string;
  icon: string;
}

export interface Category {
  id?: number;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface Budget {
  id?: number;
  month: string; // YYYY-MM
  categoryId: number;
  allocatedAmount: number;
}

export interface RecurringTransaction {
  id?: number;
  name: string;
  amount: number;
  categoryId: number;
  walletId: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  active: boolean;
}

export interface SavingsGoal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
}

// Navigation
export type TabId = 'dashboard' | 'transactions' | 'wallets' | 'budget' | 'reports' | 'recurring' | 'goals' | 'settings';

// Theme
export type Theme = 'light' | 'dark';
