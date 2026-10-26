import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Bell,
  Plus,
  Menu,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileSidebar: () => void;
  onOpenAddExpense: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onSelectTab: (tab: NavTab) => void;
}

const TAB_NAMES: Record<NavTab, string> = {
  dashboard: 'Dashboard',
  expenses: 'Daily Expenses',
  salary: 'Salary & Income',
  loans: 'EMI & Loans',
  'salary-calculator': 'Salary Calculator',
  'fixed-expenses': 'Fixed Expenses',
  savings: 'Savings & Investments',
  reports: 'Monthly Reports',
  budgets: 'Budget Limits',
  settings: 'Settings',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onOpenAddExpense,
  isDark,
  onToggleDark,
  onSelectTab,
}) => {
  const { user } = useFinance();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
      <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        {/* Left: Mobile hamburger + Clean Breadcrumbs */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation menu"
            className="p-2 sm:p-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden transition min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Navigation Buttons (hidden on narrow screens to avoid crowding) */}
          <div className="hidden sm:flex items-center gap-1 text-neutral-400 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              title="Previous"
              aria-label="Go to Dashboard"
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              title="Forward"
              aria-label="Forward"
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 min-w-0">
            <span
              onClick={() => onSelectTab('dashboard')}
              className="hidden sm:inline hover:text-neutral-900 dark:hover:text-white cursor-pointer transition shrink-0"
            >
              RupeeTrack
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-600">&gt;</span>
            <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
              {TAB_NAMES[currentTab] || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notification Bell */}
          <button
            type="button"
            title="Notifications"
            aria-label="Notifications"
            onClick={() => onSelectTab('budgets')}
            className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition shadow-2xs relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2.5 right-2.5 ring-2 ring-white dark:ring-neutral-800" />
          </button>

          {/* User Profile Avatar */}
          <div
            onClick={() => onSelectTab('settings')}
            title="User Profile & Settings"
            aria-label="User Profile"
            className="flex items-center cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center ring-2 ring-neutral-200 dark:ring-neutral-700 shadow-2xs">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            aria-label="Add Expense"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm transition min-h-[40px] min-w-[40px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
