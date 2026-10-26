import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ExpenseModal } from './components/ExpenseModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { LoansPage } from './pages/LoansPage';
import { ReportsPage } from './pages/ReportsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { FixedExpensesPage } from './pages/FixedExpensesPage';
import { SalaryCalculatorPage } from './pages/SalaryCalculatorPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    user,
    authLoading,
    dataLoading,
    saveExpense,
    expenses,
    salaries,
    loans,
    resetToDefaultDemoData,
  } = useFinance();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

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

  // If user is logged in and has completely empty data (fresh account after Firestore load completes), auto-seed the default dataset with ₹48,900
  useEffect(() => {
    if (user && !authLoading && !dataLoading && expenses.length === 0 && salaries.length === 0 && loans.length === 0) {
      resetToDefaultDemoData();
    }
  }, [user, authLoading, dataLoading, expenses.length, salaries.length, loans.length]);

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
          {authLoading ? 'Loading RupeeTrack...' : 'Syncing with Firebase Firestore...'}
        </p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

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
            />
          )}
          {currentTab === 'expenses' && (
            <ExpensesPage onOpenAddExpense={() => setIsAddExpenseModalOpen(true)} />
          )}
          {currentTab === 'loans' && <LoansPage />}
          {currentTab === 'salary-calculator' && (
            <SalaryCalculatorPage onNavigate={setCurrentTab} />
          )}
          {currentTab === 'fixed-expenses' && (
            <FixedExpensesPage onNavigate={setCurrentTab} />
          )}
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
