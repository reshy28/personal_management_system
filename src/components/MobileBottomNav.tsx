import React from 'react';
import {
  Home,
  PieChart,
  Plus,
  Receipt,
  Settings,
} from 'lucide-react';
import { NavTab } from './Sidebar';

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
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)] lg:hidden transition-colors pb-[max(0.5rem,env(safe-area-inset-bottom))] touch-manipulation select-none"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1 sm:px-2">
        {/* 1. Home (Dashboard) */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          aria-label="Home Dashboard"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors active:scale-95 group ${
            currentTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Home className="w-5 h-5 transition-transform group-hover:scale-105" />
          <span className="text-[10px] sm:text-[11px] tracking-tight mt-1 font-medium">
            Home
          </span>
          {currentTab === 'dashboard' && (
            <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" />
          )}
        </button>

        {/* 2. Budget */}
        <button
          type="button"
          onClick={() => onSelectTab('budgets')}
          aria-label="Budget Management"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors active:scale-95 group ${
            currentTab === 'budgets'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <PieChart className="w-5 h-5 transition-transform group-hover:scale-105" />
          <span className="text-[10px] sm:text-[11px] tracking-tight mt-1 font-medium">
            Budget
          </span>
          {currentTab === 'budgets' && (
            <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" />
          )}
        </button>

        {/* 3. Center Add (+) Button */}
        <div className="flex items-center justify-center -mt-5">
          <button
            type="button"
            onClick={onOpenAddExpense}
            aria-label="Add Transaction"
            className="w-12 h-12 sm:w-13 sm:h-13 min-w-[48px] min-h-[48px] rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/25 ring-3 ring-white dark:ring-neutral-900"
          >
            <Plus className="w-6 h-6 stroke-[2.75]" />
          </button>
        </div>

        {/* 4. History (Transaction History) */}
        <button
          type="button"
          onClick={() => onSelectTab('expenses')}
          aria-label="Transaction History"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors active:scale-95 group ${
            currentTab === 'expenses'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Receipt className="w-5 h-5 transition-transform group-hover:scale-105" />
          <span className="text-[10px] sm:text-[11px] tracking-tight mt-1 font-medium">
            History
          </span>
          {currentTab === 'expenses' && (
            <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" />
          )}
        </button>

        {/* 5. Settings */}
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          aria-label="Settings"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors active:scale-95 group ${
            currentTab === 'settings'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Settings className="w-5 h-5 transition-transform group-hover:scale-105" />
          <span className="text-[10px] sm:text-[11px] tracking-tight mt-1 font-medium">
            Settings
          </span>
          {currentTab === 'settings' && (
            <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
