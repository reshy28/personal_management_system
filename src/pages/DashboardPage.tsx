import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  formatINR,
  getMonthDisplay,
  Loan,
  Expense,
  UpcomingBill,
  calculatePaymentStatus,
  getTodayDateStr,
  getNextDueDateFromDay,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
} from '../types';
import {
  CreditCard,
  ArrowRight,
  Plus,
  RotateCcw,
  Receipt,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  Settings,
  TrendingUp,
  TrendingDown,
  Trash2,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';
import { CategoryIcon, CATEGORY_COLORS } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddExpense,
}) => {
  const {
    user,
    userProfile,
    selectedMonth,
    setSelectedMonth,
    monthlyIncome,
    monthlyExpenses,
    monthlyEmiPaid,
    monthlySavings,
    remainingBalance,
    loans,
    expenses,
    upcomingBills,
    payEmi,
    saveLoan,
    saveUpcomingBill,
    markBillPaid,
    deleteExpense,
    resetToDefaultDemoData,
  } = useFinance();

  // Quick Pay EMI modal
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(getTodayDateStr());
  const [payNotes, setPayNotes] = useState('');

  // Add Upcoming Bill Modal
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [newBillCategory, setNewBillCategory] = useState<ExpenseCategory>('Bills and Utilities');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDueDate, setNewBillDueDate] = useState(getTodayDateStr());

  // Personal Greeting calculation
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = useMemo(() => {
    if (userProfile?.displayName) return userProfile.displayName.split(' ')[0];
    if (user?.displayName) return user.displayName.split(' ')[0];
    return 'Rasheed';
  }, [userProfile, user]);

  // Previous month key (e.g. 2026-09)
  const previousMonthKey = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  }, [selectedMonth]);

  // Spending in previous month for dynamic comparison
  const prevMonthExpenses = useMemo(() => {
    return expenses
      .filter(
        (e) =>
          (e.monthYear === previousMonthKey || e.date.startsWith(previousMonthKey)) &&
          !e.isDebtSettlement
      )
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, previousMonthKey]);

  // Spending difference with previous month
  const expenseDiff = monthlyExpenses - prevMonthExpenses;

  // Today's total expenses
  const todayTotalExpenses = useMemo(() => {
    const today = getTodayDateStr();
    return expenses
      .filter((e) => e.date === today && !e.isDebtSettlement)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Current month non-debt transactions count
  const currentMonthTransactionsCount = useMemo(() => {
    return expenses.filter(
      (e) =>
        (e.monthYear === selectedMonth || e.date.startsWith(selectedMonth)) &&
        !e.isDebtSettlement
    ).length;
  }, [expenses, selectedMonth]);

  // -------------------------------------------------------------
  // Upcoming Due Dates (Strictly 5-day reminder window + overdue)
  // Unified from bills and active loan EMIs
  // -------------------------------------------------------------
  const upcomingDueItems = useMemo(() => {
    // 1. Regular recurring bills (Rent, Credit Card, Utilities, etc.)
    const billItems = upcomingBills
      .filter((b) => !b.isPaid)
      .map((b) => {
        const statusInfo = calculatePaymentStatus(b.dueDate, false);
        return {
          id: b.id,
          type: 'bill' as const,
          name: b.name,
          category: b.category,
          amount: b.amount,
          dueDate: b.dueDate,
          isPaid: false,
          statusInfo,
          originalBill: b,
        };
      });

    // 2. Loan EMIs for active loans
    const emiItems = loans
      .filter((l) => l.status === 'Active' && l.nextDueDate)
      .map((loan) => {
        const statusInfo = calculatePaymentStatus(loan.nextDueDate, false);
        return {
          id: `loan_emi_${loan.id}`,
          type: 'emi' as const,
          name: `${loan.loanName} EMI`,
          category: 'Bills and Utilities' as ExpenseCategory,
          amount: loan.emiAmount,
          dueDate: loan.nextDueDate,
          isPaid: false,
          statusInfo,
          originalLoan: loan,
        };
      });

    // Filter strictly for due within 5 days (diffDays <= 5) or overdue (diffDays < 0)
    return [...billItems, ...emiItems]
      .filter((item) => item.statusInfo.diffDays <= 5)
      .sort((a, b) => a.statusInfo.diffDays - b.statusInfo.diffDays);
  }, [upcomingBills, loans]);

  // -------------------------------------------------------------
  // Recent Transactions (Latest 4-5 transactions for the month)
  // -------------------------------------------------------------
  const recentTransactions = useMemo(() => {
    return expenses
      .filter((e) => e.monthYear === selectedMonth || e.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses, selectedMonth]);

  // Handle Pay EMI click
  const handlePayEmiClick = (loan: Loan) => {
    setPayingLoan(loan);
    setPayAmount(loan.emiAmount.toString());
    setPayDate(getTodayDateStr());
    setPayNotes(`Monthly installment for ${loan.loanName}`);
  };

  const handleConfirmPayEmi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingLoan) return;
    const amt = parseFloat(payAmount);
    if (!isNaN(amt) && amt > 0) {
      await payEmi(payingLoan.id, amt, payDate, payNotes);
      setPayingLoan(null);
    }
  };

  // Handle Create Upcoming Bill
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newBillAmount);
    if (newBillName.trim() && amt > 0 && newBillDueDate) {
      await saveUpcomingBill({
        name: newBillName.trim(),
        category: newBillCategory,
        amount: amt,
        dueDate: newBillDueDate,
        monthYear: newBillDueDate.substring(0, 7),
        isPaid: false,
      });
      setIsAddBillModalOpen(false);
      setNewBillName('');
      setNewBillAmount('');
      setNewBillDueDate(getTodayDateStr());
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header: Greeting, Current Month & Actions                  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {greeting}, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Overview for {getMonthDisplay(selectedMonth)} • All values in Indian Rupees (₹)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs focus:outline-none cursor-pointer"
            >
              <option value={selectedMonth}>{getMonthDisplay(selectedMonth)}</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-400">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Reset Demo Data */}
          <button
            onClick={() => resetToDefaultDemoData()}
            title="Reset demo data"
            className="p-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white shadow-2xs transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Settings Quick Link */}
          <button
            onClick={() => onNavigate('settings')}
            title="Account Settings"
            className="p-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white shadow-2xs transition"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Primary "+ Add Expense" Button */}
          <button
            onClick={onOpenAddExpense}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Overview: Spend This Month & Remaining Balance              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Card A: Spend This Month */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Spend This Month
              </span>
              <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {formatINR(monthlyExpenses)}
            </div>

            {/* Previous Month Dynamic Comparison */}
            <div className="mt-2 text-xs flex items-center gap-1.5">
              {prevMonthExpenses > 0 ? (
                <>
                  {expenseDiff > 0 ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{formatINR(expenseDiff)} vs last month</span>
                    </span>
                  ) : expenseDiff < 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>-{formatINR(Math.abs(expenseDiff))} vs last month</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500 font-medium">
                      Same as last month
                    </span>
                  )}
                  <span className="text-neutral-400 dark:text-neutral-600">({formatINR(prevMonthExpenses)} in {getMonthDisplay(previousMonthKey)})</span>
                </>
              ) : (
                <span className="text-neutral-400 dark:text-neutral-500 font-medium">
                  {currentMonthTransactionsCount} transactions recorded in {getMonthDisplay(selectedMonth)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Today's spend: <strong className="text-neutral-700 dark:text-neutral-300 font-bold">{formatINR(todayTotalExpenses)}</strong></span>
            <span>{currentMonthTransactionsCount} total expenses</span>
          </div>
        </div>

        {/* Card B: Remaining Balance */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Remaining Balance
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  remainingBalance >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {remainingBalance >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>

            <div
              className={`text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight ${
                remainingBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatINR(remainingBalance)}
            </div>

            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              From monthly income of <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatINR(monthlyIncome)}</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <span>After expenses ({formatINR(monthlyExpenses)}) &amp; EMIs ({formatINR(monthlyEmiPaid)})</span>
            <button
              onClick={() => onNavigate('salary-calculator')}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              <span>Calculator</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Upcoming Due Dates – 5-Day Reminder Card                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Upcoming Due Dates
              </h2>
              {upcomingDueItems.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  {upcomingDueItems.length} due soon
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Scheduled payments, EMIs, and bills due within 5 days or overdue
            </p>
          </div>

          <button
            onClick={() => setIsAddBillModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bill</span>
          </button>
        </div>

        {/* List of items due in <= 5 days */}
        {upcomingDueItems.length === 0 ? (
          <div className="py-8 text-center text-xs">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
              No payments due within 5 days
            </p>
            <p className="text-neutral-400 mt-1 max-w-sm mx-auto">
              All your scheduled bills and loan EMIs are settled or not yet due. Payments will automatically appear here 5 days before their due date.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 pt-1">
            {upcomingDueItems.map((item) => {
              const diff = item.statusInfo.diffDays;
              const isOverdue = diff < 0;
              const isDueToday = diff === 0;

              return (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isOverdue
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          : isDueToday
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {item.type === 'emi' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                          {item.name}
                        </span>
                        {/* Due status reminder badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isOverdue
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : isDueToday
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                          }`}
                        >
                          {isOverdue
                            ? `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`
                            : isDueToday
                            ? 'Due Today'
                            : `Due in ${diff} day${diff > 1 ? 's' : ''}`}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-2">
                        <span>Due Date: {item.dueDate}</span>
                        <span>•</span>
                        <span>{item.type === 'emi' ? 'Loan EMI' : item.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center w-full sm:w-auto pt-1 sm:pt-0">
                    <span className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white tabular-nums">
                      {formatINR(item.amount)}
                    </span>

                    {item.type === 'bill' ? (
                      <button
                        onClick={() => markBillPaid(item.id, true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Mark Paid</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePayEmiClick(item.originalLoan)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay EMI</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Recent Transactions (3–5 latest)                           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
              Recent Transactions
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Latest transactions for {getMonthDisplay(selectedMonth)}
            </p>
          </div>

          <button
            onClick={() => onNavigate('expenses')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline min-h-[36px] px-2 py-1 rounded-lg"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-10 text-center text-xs">
            <Receipt className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
              No transactions recorded yet
            </p>
            <p className="text-neutral-400 mt-1 max-w-sm mx-auto">
              You haven't logged any daily expenses for {getMonthDisplay(selectedMonth)}.
            </p>
            <button
              onClick={onOpenAddExpense}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Expense</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 pt-1">
            {recentTransactions.map((exp) => {
              const color = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other;
              return (
                <div
                  key={exp.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-xl ${color.bg} ${color.text} shrink-0`}>
                      <CategoryIcon category={exp.category} className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                          {exp.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
                        <span>{exp.category}</span>
                        <span>•</span>
                        <span className="font-mono">{exp.date}</span>
                        <span>•</span>
                        <span>{exp.paymentMethod}</span>
                      </div>
                      {exp.notes && (
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                          {exp.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white tabular-nums">
                      -{formatINR(exp.amount)}
                    </div>

                    <button
                      onClick={() => deleteExpense(exp.id)}
                      title={`Delete ${exp.name}`}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 active:scale-95 transition min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Modals: Pay EMI Modal & Add Upcoming Bill Modal               */}
      {/* ------------------------------------------------------------- */}
      {/* Quick Pay EMI Modal */}
      {payingLoan && (
        <Modal
          isOpen={!!payingLoan}
          onClose={() => setPayingLoan(null)}
          title={`Pay EMI - ${payingLoan.loanName}`}
          subtitle={`Installment amount: ${formatINR(payingLoan.emiAmount)}`}
        >
          <form onSubmit={handleConfirmPayEmi} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold bg-white dark:bg-neutral-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="e.g. Paid via Auto-debit from HDFC Bank"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setPayingLoan(null)}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center justify-center active:scale-95"
              >
                Confirm EMI Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Upcoming Bill Modal */}
      {isAddBillModalOpen && (
        <Modal
          isOpen={isAddBillModalOpen}
          onClose={() => setIsAddBillModalOpen(false)}
          title="Add Upcoming Payment / Bill"
          subtitle="Track rent, credit card bills, and utilities with due date reminders"
        >
          <form onSubmit={handleCreateBill} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Payment Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. House Rent, HDFC Credit Card Bill, Electricity"
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category *
                </label>
                <select
                  value={newBillCategory}
                  onChange={(e) => setNewBillCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="12000"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold bg-white dark:bg-neutral-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={newBillDueDate}
                onChange={(e) => setNewBillDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                A reminder will automatically appear 5 days prior to this date.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddBillModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center justify-center active:scale-95"
              >
                Save Payment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
