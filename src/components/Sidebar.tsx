import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Pin,
  FileBarChart,
  PieChart,
  Settings,
  LogOut,
  Search,
  X,
  Calculator,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export type NavTab =
  | 'dashboard'
  | 'expenses'
  | 'loans'
  | 'salary-calculator'
  | 'fixed-expenses'
  | 'budgets'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenSearch?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenSearch,
}) => {
  const { loans, expenses, fixedExpenses, signOut } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');

  const activeLoansCount = loans.filter((l) => l.status === 'Active').length;
  const recentExpensesCount = expenses.length;
  const activeFixedCount = fixedExpenses.filter((f) => f.enabled).length;

  const mainMenu = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'expenses' as NavTab,
      label: 'Daily Expenses',
      icon: Receipt,
      badge: recentExpensesCount > 0 ? `${recentExpensesCount}` : null,
    },
    {
      id: 'loans' as NavTab,
      label: 'EMI & Loans',
      icon: CreditCard,
      badge: activeLoansCount > 0 ? `${activeLoansCount}` : null,
    },
  ];

  const featuresMenu = [
    {
      id: 'salary-calculator' as NavTab,
      label: 'Salary Calculator',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'fixed-expenses' as NavTab,
      label: 'Fixed Expenses',
      icon: Pin,
      badge: activeFixedCount > 0 ? `${activeFixedCount}` : null,
    },
    {
      id: 'budgets' as NavTab,
      label: 'Budget Limits',
      icon: PieChart,
      badge: null,
    },
    {
      id: 'reports' as NavTab,
      label: 'Monthly Reports',
      icon: FileBarChart,
      badge: null,
    },
  ];

  const generalMenu = [
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      action: () => onSelectTab('settings'),
    },
    {
      id: 'logout',
      label: 'Log out',
      icon: LogOut,
      action: () => signOut(),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[82vw] max-w-[280px] lg:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-contain pb-safe pt-safe">
          {/* Logo Header */}
          <div className="h-18 flex items-center justify-between px-5 sm:px-6 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-600/25 shrink-0">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-1c-1.66 0-3-1.34-3-3h2c0 .55.45 1 1 1h1c.55 0 1-.45 1-1s-.45-1-1-1h-1c-1.66 0-3-1.34-3-3s1.34-3 3-3V6h2v1c1.66 0 3 1.34 3 3h-2c0-.55-.45-1-1-1h-1c-.55 0-1 .45-1 1s.45 1 1 1h1c1.66 0 3 1.34 3 3s-1.34 3-3 3v1z" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-neutral-900 dark:text-white tracking-tight text-lg block leading-none truncate">
                  RupeeTrack
                </span>
                <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mt-0.5">
                  Personal Finance
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar matching screenshot */}
          <div className="px-4 pt-4 pb-2 shrink-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (onOpenSearch) onOpenSearch();
                }}
                className="w-full pl-9 pr-10 py-2 bg-neutral-100/70 dark:bg-neutral-800/80 border border-transparent rounded-xl text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-200 transition"
              />
              <span className="absolute right-2.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-400 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 shadow-2xs">
                ⌘ K
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 space-y-6">
            {/* MAIN MENU */}
            <div>
              <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase px-3 mb-1.5">
                Main Menu
              </div>
              <div className="space-y-1">
                {mainMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FEATURES */}
            <div>
              <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase px-3 mb-1.5">
                Features
              </div>
              <div className="space-y-1">
                {featuresMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-400'}`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GENERAL */}
            <div>
              <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase px-3 mb-1.5">
                General
              </div>
              <div className="space-y-1">
                {generalMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-neutral-400" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
