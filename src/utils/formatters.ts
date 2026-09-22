// ============================================================
// Spendly — IDR Formatter & Date Utilities
// ============================================================

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format number to "Rp 45.000" */
export function formatIDR(amount: number): string {
  return idrFormatter.format(amount);
}

/** Format raw numeric string while typing: "45000" => "45.000" */
export function formatAmountInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10));
}

/** Parse formatted amount string back to number */
export function parseFormattedAmount(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, ''), 10) || 0;
}

/** Get greeting based on hour */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Format date to readable string: "22 Sep 2026" */
export function formatDateReadable(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Get relative date label */
export function getRelativeDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  return formatDateReadable(dateStr);
}

/** Get current month string "YYYY-MM" */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Get today's date as "YYYY-MM-DD" */
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Get current time as "HH:mm" */
export function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/** Format month display: "September 2026" */
export function formatMonthDisplay(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Get percentage with clamping */
export function getPercentage(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((current / total) * 100);
}

/** Budget status color logic */
export function getBudgetStatus(percentage: number): { color: string; label: string; bgClass: string; textClass: string } {
  if (percentage >= 100) return { color: '#F43F5E', label: 'Exceeded', bgClass: 'bg-rose-500', textClass: 'text-rose-500' };
  if (percentage >= 85) return { color: '#F59E0B', label: 'Warning', bgClass: 'bg-amber-500', textClass: 'text-amber-500' };
  if (percentage >= 70) return { color: '#0EA5E9', label: 'Notice', bgClass: 'bg-sky-500', textClass: 'text-sky-500' };
  return { color: '#10B981', label: 'Normal', bgClass: 'bg-emerald-500', textClass: 'text-emerald-500' };
}
