// ============================================================
// Spendly v2 — Date Picker Dialog (Material/Mobile Calendar)
// ============================================================
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  formatDateShortIndo,
  formatMonthIndo,
  toLocalDateStr,
  getTodayStr,
} from '../utils/formatters';

interface DatePickerDialogProps {
  open: boolean;
  value: string; // YYYY-MM-DD
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

export function DatePickerDialog({ open, value, onSelect, onClose }: DatePickerDialogProps) {
  const [selectedDate, setSelectedDate] = useState(value || getTodayStr());
  const [viewYear, setViewYear] = useState(() => {
    const parts = (value || getTodayStr()).split('-').map(Number);
    return parts[0];
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = (value || getTodayStr()).split('-').map(Number);
    return parts[1] - 1; // 0-indexed
  });

  useEffect(() => {
    if (open) {
      const initial = value || getTodayStr();
      setSelectedDate(initial);
      const [y, m] = initial.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [open, value]);

  if (!open) return null;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Build calendar matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday (M)

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const pad2 = (n: number) => String(n).padStart(2, '0');

  const handleDayClick = (day: number) => {
    const newDateStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
    setSelectedDate(newDateStr);
  };

  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Blue Header */}
        <div
          className="p-5 text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <p className="text-[11px] font-semibold tracking-wider uppercase opacity-90">
            PILIH TANGGAL
          </p>
          <h2 className="text-2xl font-bold mt-1 tracking-tight">
            {formatDateShortIndo(selectedDate)}
          </h2>
        </div>

        {/* Calendar Body */}
        <div className="p-4">
          {/* Month / Year Navigator */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-zinc-800">
              {formatMonthIndo(monthStr)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-full hover:bg-zinc-100 active:bg-zinc-200 transition-colors text-zinc-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-full hover:bg-zinc-100 active:bg-zinc-200 transition-colors text-zinc-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers: M S S R K J S (Minggu, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu) */}
          <div className="grid grid-cols-7 text-center mb-1">
            {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (
              <span key={i} className="text-xs font-semibold text-zinc-400 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 text-center gap-y-1">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="w-9 h-9" />
            ))}

            {/* Days 1..N */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
              const isSelected = selectedDate === dateStr;
              const isToday = getTodayStr() === dateStr;

              return (
                <div key={day} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-all flex items-center justify-center ${
                      isSelected
                        ? 'text-white font-bold shadow-md scale-105'
                        : isToday
                        ? 'border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                        : 'text-zinc-700 hover:bg-zinc-100 active:scale-95'
                    }`}
                    style={isSelected ? { backgroundColor: 'var(--color-primary)' } : undefined}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Buttons (BATAL & OKE) */}
          <div className="flex items-center justify-end gap-3 mt-5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 rounded-lg active:scale-95 transition-all"
            >
              BATAL
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3 py-1.5 text-xs font-bold rounded-lg active:scale-95 transition-all"
              style={{ color: 'var(--color-primary)' }}
            >
              OKE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
