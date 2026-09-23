// ============================================================
// Spendly v2 — Simple Username/Password Auth Service (Supabase)
// ============================================================
import { supabase } from '../lib/supabase';
import { pushToCloud, pullFromCloud } from './cloudSync';
import type { UserProfile } from '../types';

const USER_STORAGE_KEY = 'spendly_current_user';

const avatarColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#6366F1', '#14B8A6',
];

/** Get currently logged-in user from localStorage */
export function getCurrentUser(): UserProfile | null {
  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) return JSON.parse(saved) as UserProfile;
  } catch {
    /* ignore */
  }
  return null;
}

/** Save currently logged-in user to localStorage */
export function saveCurrentUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('spendly_auth_change', { detail: user }));
  }
}

/** Clean and validate username */
export function cleanUsernameInput(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

/** Register new user with username and password */
export async function registerUser(
  rawUsername: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const username = cleanUsernameInput(rawUsername);

  if (!username || username.length < 3) {
    return { success: false, error: 'Username minimal 3 karakter (huruf, angka, garis bawah).' };
  }

  if (!password || password.length < 4) {
    return { success: false, error: 'Password minimal 4 karakter.' };
  }

  try {
    // Check if username already exists
    const userDocId = `user:${username}`;
    const { data: existing } = await supabase
      .from('spendly_sync')
      .select('id')
      .eq('id', userDocId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `Username "${username}" sudah digunakan. Silakan pilih username lain.` };
    }

    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    const profile: UserProfile = {
      username,
      displayName: displayName?.trim() || username,
      password,
      createdAt: Date.now(),
      avatarColor: randomColor,
    };

    // Save user profile to Supabase
    const { error: saveError } = await supabase.from('spendly_sync').insert({
      id: userDocId,
      data: profile,
      updated_at: new Date().toISOString(),
    });

    if (saveError) {
      return { success: false, error: saveError.message };
    }

    saveCurrentUser(profile);

    // Initial backup of current local data under this user's cloud slot
    await pushToCloud(username);

    return { success: true, user: profile };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mendaftarkan akun';
    return { success: false, error: msg };
  }
}

/** Login with username and password */
export async function loginUser(
  rawUsername: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const username = cleanUsernameInput(rawUsername);

  if (!username) {
    return { success: false, error: 'Masukkan username.' };
  }

  if (!password) {
    return { success: false, error: 'Masukkan password.' };
  }

  try {
    const userDocId = `user:${username}`;
    const { data, error } = await supabase
      .from('spendly_sync')
      .select('data')
      .eq('id', userDocId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.data) {
      return { success: false, error: `Username "${username}" tidak ditemukan. Silakan buat akun terlebih dahulu.` };
    }

    const profile = data.data as UserProfile;

    if (profile.password !== password) {
      return { success: false, error: 'Password yang kamu masukkan salah.' };
    }

    saveCurrentUser(profile);

    // Automatically pull latest cloud data for this user onto this device
    await pullFromCloud(username);

    return { success: true, user: profile };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal masuk akun';
    return { success: false, error: msg };
  }
}

/** Update profile (displayName, password) */
export async function updateProfile(updates: {
  displayName?: string;
  oldPassword?: string;
  newPassword?: string;
}): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const current = getCurrentUser();
  if (!current) {
    return { success: false, error: 'Kamu belum masuk akun.' };
  }

  try {
    const userDocId = `user:${current.username}`;

    // Verify old password if updating password
    if (updates.newPassword) {
      if (!updates.oldPassword) {
        return { success: false, error: 'Masukkan password lama kamu untuk konfirmasi.' };
      }
      if (current.password && current.password !== updates.oldPassword) {
        return { success: false, error: 'Password lama tidak cocok.' };
      }
      if (updates.newPassword.length < 4) {
        return { success: false, error: 'Password baru minimal 4 karakter.' };
      }
    }

    const updatedProfile: UserProfile = {
      ...current,
      displayName: updates.displayName?.trim() || current.displayName,
      password: updates.newPassword || current.password,
    };

    const { error } = await supabase.from('spendly_sync').upsert({
      id: userDocId,
      data: updatedProfile,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    saveCurrentUser(updatedProfile);
    return { success: true, user: updatedProfile };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil';
    return { success: false, error: msg };
  }
}

/** Logout user */
export function logoutUser() {
  saveCurrentUser(null);
}

/** Delete account profile permanently */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const current = getCurrentUser();
  if (!current) return { success: false, error: 'Kamu belum masuk akun.' };
  try {
    const { error } = await supabase
      .from('spendly_sync')
      .delete()
      .eq('id', `user:${current.username}`);

    if (error) {
      return { success: false, error: error.message };
    }

    logoutUser();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus akun';
    return { success: false, error: msg };
  }
}
