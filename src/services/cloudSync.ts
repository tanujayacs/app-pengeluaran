// ============================================================
// Spendly v2 — Supabase Cloud Sync Service
// ============================================================
import { supabase } from '../lib/supabase';
import { db } from '../db';
import { useStore } from '../hooks/useStore';
import type { Transaction, Wallet, Category, Debt, ExpenseTemplate, CustomRekapCard, AppSettings } from '../types';

export interface SyncPayload {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  debts: Debt[];
  expenseTemplates: ExpenseTemplate[];
  customRekapCards: CustomRekapCard[];
  settings: AppSettings;
  exportedAt: string;
}

/** Check if Supabase connection and tables are ready */
export async function checkCloudConnection(): Promise<{ connected: boolean; tablesReady: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('spendly_sync').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('not found') || error.message?.includes('does not exist')) {
        return { connected: true, tablesReady: false, error: 'Tabel database di Supabase belum dibuat.' };
      }
      return { connected: false, tablesReady: false, error: error.message };
    }
    return { connected: true, tablesReady: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghubungi server';
    return { connected: false, tablesReady: false, error: msg };
  }
}

/** Push all local IndexedDB data to Supabase Cloud */
export async function pushToCloud(): Promise<{ success: boolean; error?: string }> {
  try {
    const [transactions, wallets, categories, debts, expenseTemplates, customRekapCards] = await Promise.all([
      db.transactions.toArray(),
      db.wallets.toArray(),
      db.categories.toArray(),
      db.debts.toArray(),
      db.expenseTemplates.toArray(),
      db.customRekapCards.toArray(),
    ]);

    const settings = useStore.getState().settings;

    const payload: SyncPayload = {
      transactions,
      wallets,
      categories,
      debts,
      expenseTemplates,
      customRekapCards,
      settings,
      exportedAt: new Date().toISOString(),
    };

    // 1. Save atomic full snapshot to spendly_sync
    const { error: syncError } = await supabase.from('spendly_sync').upsert({
      id: 'main',
      data: payload,
      updated_at: new Date().toISOString(),
    });

    if (syncError) {
      return { success: false, error: syncError.message };
    }

    // 2. Also populate structured tables if they exist
    try {
      if (wallets.length > 0) {
        await supabase.from('wallets').upsert(
          wallets.map(w => ({
            id: w.id,
            name: w.name,
            type: w.type,
            balance: w.balance,
            color: w.color,
            icon: w.icon,
          }))
        );
      }

      if (categories.length > 0) {
        await supabase.from('categories').upsert(
          categories.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            icon: c.icon,
          }))
        );
      }

      if (transactions.length > 0) {
        await supabase.from('transactions').upsert(
          transactions.map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            category_id: t.categoryId,
            wallet_id: t.walletId,
            destination_wallet_id: t.destinationWalletId || null,
            title: t.title,
            date: t.date,
            time: t.time,
            notes: t.notes || null,
            created_at: t.createdAt,
          }))
        );
      }
    } catch {
      // Non-blocking if structured tables are not yet run
    }

    localStorage.setItem('spendly_last_synced', new Date().toISOString());
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal sinkron ke cloud';
    return { success: false, error: msg };
  }
}

/** Pull latest data from Supabase Cloud and restore locally */
export async function pullFromCloud(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('spendly_sync')
      .select('data')
      .eq('id', 'main')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.data) {
      return { success: false, error: 'Belum ada data cadangan di cloud.' };
    }

    const payload = data.data as SyncPayload;

    await db.transaction(
      'rw',
      [db.transactions, db.wallets, db.categories, db.debts, db.expenseTemplates, db.customRekapCards],
      async () => {
        await Promise.all([
          db.transactions.clear(),
          db.wallets.clear(),
          db.categories.clear(),
          db.debts.clear(),
          db.expenseTemplates.clear(),
          db.customRekapCards.clear(),
        ]);

        if (payload.wallets?.length) await db.wallets.bulkAdd(payload.wallets);
        if (payload.categories?.length) await db.categories.bulkAdd(payload.categories);
        if (payload.transactions?.length) await db.transactions.bulkAdd(payload.transactions);
        if (payload.debts?.length) await db.debts.bulkAdd(payload.debts);
        if (payload.expenseTemplates?.length) await db.expenseTemplates.bulkAdd(payload.expenseTemplates);
        if (payload.customRekapCards?.length) await db.customRekapCards.bulkAdd(payload.customRekapCards);
      }
    );

    if (payload.settings) {
      useStore.getState().updateSettings(payload.settings);
    }

    await useStore.getState().loadAllData();
    localStorage.setItem('spendly_last_synced', new Date().toISOString());

    const totalCount =
      (payload.transactions?.length || 0) +
      (payload.wallets?.length || 0) +
      (payload.categories?.length || 0);

    return { success: true, count: totalCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memulihkan dari cloud';
    return { success: false, error: msg };
  }
}

/** Get human readable last synced string */
export function getLastSyncedString(): string {
  const saved = localStorage.getItem('spendly_last_synced');
  if (!saved) return 'Belum pernah disinkronkan';
  try {
    const date = new Date(saved);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Barusan saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit yang lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam yang lalu`;

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch {
    return 'Belum pernah disinkronkan';
  }
}
