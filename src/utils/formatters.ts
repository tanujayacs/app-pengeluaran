// ============================================================
// Spendly v2 — Formatters (Indonesian Locale)
// ============================================================

/** Format number to IDR string: 45000 -> "45.000" */
export function formatIDR(amount: number, showDecimal = false): string {
  if (showDecimal) {
    return new Intl.NumberFormat('id-ID').format(amount);
  }
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(amount));
}

/** Format while typing: "45000" => "45.000" */
export function formatAmountInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10));
}

/** Parse formatted amount back to number */
export function parseAmount(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, ''), 10) || 0;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Format date object to YYYY-MM-DD */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Get today YYYY-MM-DD in local time */
export function getTodayStr(): string {
  return toLocalDateStr(new Date());
}

/** Get current time HH:mm */
export function getCurrentTime(): string {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

/** Get current month YYYY-MM */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

/** Format date to Indonesian: "Sel, 22 Sep 2026" */
export function formatDateIndo(dateStr: string): string {
  const [y, m, day] = dateStr.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format date short: "Rab, 23 Sep" */
export function formatDateShortIndo(dateStr: string): string {
  const [y, m, day] = dateStr.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

/** Format date for history grouping: "22 09 2026 Senin" */
export function formatDateGroup(dateStr: string): string {
  const [y, m, day] = dateStr.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return `${pad2(day)} ${pad2(m)} ${y} ${days[d.getDay()]}`;
}

/** Format month display: "September 2026" */
export function formatMonthIndo(monthStr: string): string {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const [year, month] = monthStr.split('-');
  return `${months[parseInt(month) - 1]} ${year}`;
}

/** Navigate date by offset days safely without timezone bugs */
export function offsetDate(dateStr: string, offset: number): string {
  const [y, m, day] = dateStr.split('-').map(Number);
  const d = new Date(y, m - 1, day + offset);
  return toLocalDateStr(d);
}

/** Get week start/end for a date */
export function getWeekRange(dateStr: string): { start: string; end: string } {
  const [y, m, day] = dateStr.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const dayOfWeek = d.getDay(); // 0 is Sun
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(y, m - 1, day + diffToMonday);
  const end = new Date(y, m - 1, day + diffToMonday + 6);
  return {
    start: toLocalDateStr(start),
    end: toLocalDateStr(end),
  };
}

/** Theme color map */
export const themeColors: Record<string, { primary: string; light: string; dark: string }> = {
  blue: { primary: '#3B82F6', light: '#EFF6FF', dark: '#1E3A5F' },
  green: { primary: '#10B981', light: '#ECFDF5', dark: '#064E3B' },
  red: { primary: '#EF4444', light: '#FEF2F2', dark: '#7F1D1D' },
  purple: { primary: '#8B5CF6', light: '#F5F3FF', dark: '#4C1D95' },
  orange: { primary: '#F97316', light: '#FFF7ED', dark: '#7C2D12' },
  pink: { primary: '#EC4899', light: '#FDF2F8', dark: '#831843' },
  teal: { primary: '#14B8A6', light: '#F0FDFA', dark: '#134E4A' },
};
