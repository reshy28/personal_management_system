import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ExpenseModal } from './components/ExpenseModal';
import { Modal } from './components/Modal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SalaryPage } from './pages/SalaryPage';
import { LoansPage } from './pages/LoansPage';
import { SavingsPage } from './pages/SavingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { FixedExpensesPage } from './pages/FixedExpensesPage';
import { SalaryCalculatorPage } from './pages/SalaryCalculatorPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';
import { formatINR } from './types';

const MainLayout: React.FC = () => {
  const {
    user,
    authLoading,
    saveExpense,
    saveSalaryRecord,
    currentSalaryRecord,
    selectedMonth,
    expenses,
    salaries,
    loans,
    resetToDefaultDemoData,
  } = useFinance();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isQuickSalaryOpen, setIsQuickSalaryOpen] = useState(false);

  // Quick salary form state
  const [quickSalaryVal, setQuickSalaryVal] = useState('48900');
  const [quickBonusVal, setQuickBonusVal] = useState('0');

  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('rupeetrack_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rupeetrack_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rupeetrack_theme', 'light');
    }
  }, [isDark]);

  // If user is logged in and has completely empty data (fresh account), auto-seed the default dataset with ₹48,900
  useEffect(() => {
    if (user && !authLoading && expenses.length === 0 && salaries.length === 0 && loans.length === 0) {
      resetToDefaultDemoData();
    }
  }, [user, authLoading, expenses.length, salaries.length, loans.length]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
          Loading RupeeTrack...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const handleQuickSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = parseFloat(quickSalaryVal) || 48900;
    const bonus = parseFloat(quickBonusVal) || 0;
    const freelance = currentSalaryRecord?.freelanceIncome || 0;
    const other = currentSalaryRecord?.otherIncome || 0;

    await saveSalaryRecord(
      {
        monthYear: selectedMonth,
        baseSalary: base,
        receivedDate: currentSalaryRecord?.receivedDate || `${selectedMonth}-01`,
        bonusIncome: bonus,
        freelanceIncome: freelance,
        otherIncome: other,
        totalIncome: base + bonus + freelance + other,
        notes: currentSalaryRecord?.notes || 'Updated via quick salary modal',
      },
      currentSalaryRecord?.id?.startsWith('fallback_') ? undefined : currentSalaryRecord?.id
    );
    setIsQuickSalaryOpen(false);
  };

  const openQuickSalaryModal = () => {
    setQuickSalaryVal(
      currentSalaryRecord?.baseSalary?.toString() || '48900'
    );
    setQuickBonusVal(
      currentSalaryRecord?.bonusIncome ? currentSalaryRecord.bonusIncome.toString() : '0'
    );
    setIsQuickSalaryOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAddExpense={() => setIsAddExpenseModalOpen(true)}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
          onSelectTab={setCurrentTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-28 lg:pb-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenAddExpense={() => setIsAddExpenseModalOpen(true)}
              onOpenQuickSalary={openQuickSalaryModal}
            />
          )}
          {currentTab === 'expenses' && (
            <ExpensesPage onOpenAddExpense={() => setIsAddExpenseModalOpen(true)} />
          )}
          {currentTab === 'salary' && (
            <SalaryPage onNavigate={setCurrentTab} />
          )}
          {currentTab === 'loans' && <LoansPage />}
          {currentTab === 'salary-calculator' && (
            <SalaryCalculatorPage onNavigate={setCurrentTab} />
          )}
          {currentTab === 'fixed-expenses' && (
            <FixedExpensesPage onNavigate={setCurrentTab} />
          )}
          {currentTab === 'savings' && <SavingsPage />}
          {currentTab === 'reports' && <ReportsPage />}
          {currentTab === 'budgets' && <BudgetsPage />}
          {currentTab === 'settings' && (
            <SettingsPage isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddExpense={() => setIsAddExpenseModalOpen(true)}
      />

      {/* Global Quick Add Expense Modal */}
      {isAddExpenseModalOpen && (
        <ExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
          onSave={saveExpense}
        />
      )}

      {/* Quick Salary Edit Modal */}
      {isQuickSalaryOpen && (
        <Modal
          isOpen={isQuickSalaryOpen}
          onClose={() => setIsQuickSalaryOpen(false)}
          title="Update Monthly Salary / Income"
          subtitle={`Adjust income for ${selectedMonth}`}
        >
          <form onSubmit={handleQuickSalarySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Base Monthly Salary (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-neutral-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  value={quickSalaryVal}
                  onChange={(e) => setQuickSalaryVal(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold bg-white dark:bg-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Bonus / Additional Incentive (₹)
              </label>
              <input
                type="number"
                step="any"
                value={quickBonusVal}
                onChange={(e) => setQuickBonusVal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setIsQuickSalaryOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Save Salary
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
