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
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5">
        {/* Left: Mobile hamburger + Clean Breadcrumbs like screenshot */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Navigation Buttons */}
          <div className="flex items-center gap-1 text-neutral-400">
            <button
              onClick={() => onSelectTab('dashboard')}
              title="Previous"
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              title="Forward"
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <span
              onClick={() => onSelectTab('dashboard')}
              className="hover:text-neutral-900 dark:hover:text-white cursor-pointer transition"
            >
              RupeeTrack
            </span>
            <span className="text-neutral-300 dark:text-neutral-600">&gt;</span>
            <span className="font-semibold text-neutral-900 dark:text-white">
              {TAB_NAMES[currentTab] || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* Right Action Icons matching screenshot */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Bell */}
          <button
            type="button"
            title="Notifications"
            onClick={() => onSelectTab('budgets')}
            className="w-9 h-9 rounded-full bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition shadow-2xs relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white dark:ring-neutral-800" />
          </button>

          {/* User Profile Avatar */}
          <div
            onClick={() => onSelectTab('settings')}
            className="flex items-center gap-2 pl-1 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center ring-2 ring-neutral-200 dark:ring-neutral-700 shadow-2xs">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          {/* Primary Action Button (Matches green Share / Action button in screenshot) */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
