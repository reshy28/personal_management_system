import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CreditCard,
  Plus,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useFinance } from '../context/FinanceContext';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddExpense,
}) => {
  const { loans } = useFinance();
  const activeLoansCount = loans.filter((l) => l.status === 'Active').length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 lg:hidden transition-colors pb-[max(0.5rem,env(safe-area-inset-bottom))] touch-manipulation select-none">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1 sm:px-2">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          aria-label="Overview Dashboard"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
            currentTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 font-semibold">Overview</span>
        </button>

        {/* 2. Expenses */}
        <button
          type="button"
          onClick={() => onSelectTab('expenses')}
          aria-label="Daily Expenses"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
            currentTab === 'expenses'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 font-semibold">Expenses</span>
        </button>

        {/* 3. Center FAB: Quick Add Expense */}
        <div className="flex items-center justify-center -mt-6">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
            aria-label="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
        </div>

        {/* 4. Salary */}
        <button
          type="button"
          onClick={() => onSelectTab('salary')}
          aria-label="Salary & Income"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
            currentTab === 'salary'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 font-semibold">Salary</span>
        </button>

        {/* 5. Loans / EMI */}
        <button
          type="button"
          onClick={() => onSelectTab('loans')}
          aria-label="Loans and EMIs"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors relative active:scale-95 ${
            currentTab === 'loans'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 font-semibold">Loans</span>
          {activeLoansCount > 0 && (
            <span className="absolute top-1.5 right-3.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-neutral-900" />
          )}
        </button>
      </div>
    </nav>
  );
};
