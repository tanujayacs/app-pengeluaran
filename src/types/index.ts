// ============================================================
// Spendly v2 — Core Domain Types
// ============================================================

export interface Transaction {
  id?: number;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  categoryId: number;
  walletId: number;
  destinationWalletId?: number;
  title: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  notes?: string;
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
  icon: string;
}

export interface Debt {
  id?: number;
  name: string;
  type: 'receivable' | 'payable'; // dihutangi / berhutang
  amount: number;
  date: string;
  notes?: string;
  settled: boolean;
  settledDate?: string;
  createdAt: number;
}

export interface ExpenseTemplate {
  id?: number;
  name: string;
  items: TemplateItem[];
}

export interface TemplateItem {
  title: string;
  amount: number;
  categoryId: number;
  walletId: number;
}

export interface AppSettings {
  themeColor: ThemeColor;
  language: 'id' | 'en';
  showDecimal: boolean;
  monthStartDate: number;
  showAccumulatedBalance: boolean;
}

export interface CustomRekapCard {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: number;
}

// Theme
export type ThemeColor = 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'pink' | 'teal';
export type TabId = 'transaksi' | 'rekening' | 'rekap' | 'hutang' | 'setting';
export type Theme = 'light' | 'dark';
