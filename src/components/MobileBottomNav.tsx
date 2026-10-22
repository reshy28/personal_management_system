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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 lg:hidden transition-colors">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Overview</span>
        </button>

        {/* 2. Expenses */}
        <button
          type="button"
          onClick={() => onSelectTab('expenses')}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'expenses'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Expenses</span>
        </button>

        {/* 3. Center FAB: Quick Add Expense */}
        <div className="flex items-center justify-center -mt-5">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform"
            aria-label="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Salary */}
        <button
          type="button"
          onClick={() => onSelectTab('salary')}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'salary'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Salary</span>
        </button>

        {/* 5. Loans / EMI */}
        <button
          type="button"
          onClick={() => onSelectTab('loans')}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors relative ${
            currentTab === 'loans'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Loans &amp; EMI</span>
          {activeLoansCount > 0 && (
            <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-indigo-600" />
          )}
        </button>
      </div>
    </nav>
  );
};
