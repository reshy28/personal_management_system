import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getMonthDisplay, getMonthYearKey } from '../types';

interface MonthPickerProps {
  selectedMonth: string; // YYYY-MM
  onChange: (month: string) => void;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ selectedMonth, onChange }) => {
  const currentMonth = getMonthYearKey(new Date());

  const handlePrev = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    onChange(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const handleNext = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    onChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  const isCurrent = selectedMonth === currentMonth;

  return (
    <div className="inline-flex items-center gap-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 rounded-xl p-1 shadow-xs">
      <button
        type="button"
        onClick={handlePrev}
        title="Previous Month"
        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 px-2.5 py-1">
        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
          {getMonthDisplay(selectedMonth)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleNext}
        title="Next Month"
        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrent && (
        <button
          type="button"
          onClick={() => onChange(currentMonth)}
          className="ml-1 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition"
        >
          Current
        </button>
      )}
    </div>
  );
};
