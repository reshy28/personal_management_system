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
  MoreHorizontal,
  TrendingUp,
  Search,
  Check,
  RotateCcw,
  Receipt,
  Bell,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  ShieldAlert,
  Calculator,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';
import { CategoryIcon, CATEGORY_COLORS } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
  onOpenQuickSalary: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddExpense,
  onOpenQuickSalary,
}) => {
  const {
    selectedMonth,
    setSelectedMonth,
    monthlyIncome,
    monthlyExpenses,
    monthlyEmiPaid,
    monthlyEmiCommitment,
    monthlySavings,
    remainingBalance,
    totalOutstandingLoans,
    totalLoanAmountAll,
    totalLoanRepaidAll,
    loans,
    expenses,
    upcomingBills,
    payEmi,
    saveLoan,
    saveUpcomingBill,
    markBillPaid,
    deleteUpcomingBill,
    deleteExpense,
    resetToDefaultDemoData,
  } = useFinance();

  // Search filter for recent activities
  const [tableSearch, setTableSearch] = useState('');

  // Quick Pay EMI modal
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(getTodayDateStr());
  const [payNotes, setPayNotes] = useState('');

  // Add Bike Loan Modal states (Bike Name, Monthly EMI, EMIs Already Paid, Outstanding Principal, Start Date, Every Month EMI Day)
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [newBikeName, setNewBikeName] = useState('');
  const [newBikeEmi, setNewBikeEmi] = useState('');
  const [newBikePaidEmis, setNewBikePaidEmis] = useState('0');
  const [newBikeOutstanding, setNewBikeOutstanding] = useState('');
  const [newBikeStartDate, setNewBikeStartDate] = useState(getTodayDateStr());
  const [newBikeEmiDay, setNewBikeEmiDay] = useState('5');

  // Add Upcoming Bill Modal
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [newBillCategory, setNewBillCategory] = useState<ExpenseCategory>('Bills and Utilities');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDueDate, setNewBillDueDate] = useState(getTodayDateStr());

  // -------------------------------------------------------------
  // Unified Upcoming Payments List (Bills + Active Loan EMIs)
  // -------------------------------------------------------------
  const allUpcomingItems = useMemo(() => {
    // 1. Regular recurring bills (Rent, Credit Card, Utilities, etc.)
    const billItems = upcomingBills.map((b) => {
      const statusInfo = calculatePaymentStatus(b.dueDate, b.isPaid);
      return {
        id: b.id,
        type: 'bill' as const,
        name: b.name,
        category: b.category,
        amount: b.amount,
        dueDate: b.dueDate,
        isPaid: b.isPaid,
        statusInfo,
        originalBill: b,
      };
    });

    // 2. Loan EMIs for active loans
    const emiItems = loans
      .filter((l) => l.status === 'Active' && l.nextDueDate)
      .map((loan) => {
        const hasPaidThisMonth = false;
        const statusInfo = calculatePaymentStatus(loan.nextDueDate, hasPaidThisMonth);
        return {
          id: `loan_emi_${loan.id}`,
          type: 'emi' as const,
          name: `${loan.loanName} EMI`,
          category: 'Bills and Utilities' as ExpenseCategory,
          amount: loan.emiAmount,
          dueDate: loan.nextDueDate,
          isPaid: hasPaidThisMonth,
          statusInfo,
          originalLoan: loan,
        };
      });

    // Combine and sort by due date ascending
    return [...billItems, ...emiItems].sort((a, b) => {
      if (a.isPaid && !b.isPaid) return 1;
      if (!a.isPaid && b.isPaid) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [upcomingBills, loans]);

  // Urgent reminders: unpaid items with due date within 5 days (diffDays <= 5)
  const urgentReminders = useMemo(() => {
    return allUpcomingItems.filter(
      (item) => !item.isPaid && item.statusInfo.diffDays <= 5
    );
  }, [allUpcomingItems]);

  // Upcoming & Due Date Reminders: strictly show payments due in 5 days or less
  const displayedUpcomingItems = useMemo(() => {
    return allUpcomingItems.filter((item) => item.statusInfo.diffDays <= 5);
  }, [allUpcomingItems]);

  // Filtered recent daily expenses
  const recentExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchesMonth = e.monthYear === selectedMonth || e.date.startsWith(selectedMonth);
        const matchesSearch =
          !tableSearch ||
          e.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
          e.category.toLowerCase().includes(tableSearch.toLowerCase());
        return matchesMonth && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
  }, [expenses, selectedMonth, tableSearch]);

  // Today's total expenses
  const todayTotalExpenses = useMemo(() => {
    const today = getTodayDateStr();
    return expenses
      .filter((e) => e.date === today && !e.isDebtSettlement)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Handle Pay EMI
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

  // Handle Create Loan (Bike Loan)
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const emi = parseFloat(newBikeEmi);
    const paid = parseInt(newBikePaidEmis, 10) || 0;
    const out = parseFloat(newBikeOutstanding) || 0;
    const day = parseInt(newBikeEmiDay, 10) || 5;

    if (newBikeName.trim() && emi > 0 && out >= 0) {
      const orig = out + paid * emi;
      const tenure = paid + Math.max(1, Math.ceil(out / emi));
      const nextDue = getNextDueDateFromDay(day);

      await saveLoan({
        loanName: newBikeName.trim(),
        provider: 'Bike Loan',
        originalAmount: orig,
        tenureMonths: tenure,
        emiAmount: emi,
        startDate: newBikeStartDate,
        endDate: '',
        paidEmisCount: paid,
        outstandingPrincipal: out,
        emiDay: day,
        nextDueDate: nextDue,
        status: out <= 0 ? 'Completed' : 'Active',
        notes: `EMI Day: ${day}th of every month`,
      });
      setIsAddLoanModalOpen(false);
      setNewBikeName('');
      setNewBikeEmi('');
      setNewBikePaidEmis('0');
      setNewBikeOutstanding('');
      setNewBikeStartDate(getTodayDateStr());
      setNewBikeEmiDay('5');
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header Row: Title, Month Selector & Direct "Add Expense"   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              Live INR (₹)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Overview of your expenses, loans, remaining balance, and upcoming payments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 pr-8 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs focus:outline-none cursor-pointer"
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

          {/* Reset Demo Data Button */}
          <button
            onClick={() => resetToDefaultDemoData()}
            title="Reset to default ₹48,900 salary and sample loans"
            className="p-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 shadow-2xs transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Salary Calculator Quick Link */}
          <button
            onClick={() => onNavigate('salary-calculator')}
            title="Open Salary Calculator"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 shadow-2xs transition active:scale-98"
          >
            <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Salary Calculator</span>
          </button>

          {/* Direct "Add Expense" Button (Explicit user requirement #5) */}
          <button
            onClick={onOpenAddExpense}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow transition active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Top Summary Cards                                          */}
      {/* Total Expenses, Remaining Balance, Total Loan Amount,          */}
      {/* Monthly EMI Total, Upcoming Reminders                         */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Total Expenses */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
              {formatINR(monthlyExpenses)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400">
              <span>Today: {formatINR(todayTotalExpenses)}</span>
              <span>{expenses.filter(e => (e.monthYear === selectedMonth || e.date.startsWith(selectedMonth)) && !e.isDebtSettlement).length} items</span>
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Balance */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Remaining Balance
            </span>
            <div className={`p-2 rounded-xl ${remainingBalance >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight ${
                remainingBalance >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatINR(remainingBalance)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-neutral-400">After all outflows</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  remainingBalance >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {remainingBalance >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Loan Amount (Outstanding balance) */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Loan Amount
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {formatINR(totalOutstandingLoans)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400">
              <span>Original: {formatINR(totalLoanAmountAll)}</span>
              <span className="font-semibold text-emerald-600">{loans.length} Loans</span>
            </div>
          </div>
        </div>

        {/* Card 5: Combined Monthly EMI */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Monthly EMI Total
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight">
              {formatINR(monthlyEmiCommitment)}
              <span className="text-xs font-normal text-neutral-400">/mo</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400">
              <span>Paid this mo: {formatINR(monthlyEmiPaid)}</span>
              <span className="text-indigo-600 font-semibold">Active</span>
            </div>
          </div>
        </div>

        {/* Card 6: Upcoming Reminders */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Due Reminders
            </span>
            <div className={`p-2 rounded-xl ${urgentReminders.length > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tabular-nums tracking-tight flex items-baseline gap-2">
              <span>{urgentReminders.length}</span>
              <span className="text-xs font-semibold text-neutral-400">due in ≤ 5 days</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-neutral-400">Due within 5 days</span>
              {urgentReminders.length > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold">Action Needed</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">All Clear</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Main 2-Column Section:                                      */}
      {/*    Left: Upcoming Payments & Due Date Reminders (due in ≤ 5 days) */}
      {/*    Right: Active Loans & Monthly EMIs                         */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: UPCOMING PAYMENTS & DUE DATE REMINDERS */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  Upcoming Payments &amp; Due Date Reminders
                </h2>
              </div>
              <button
                onClick={() => setIsAddBillModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bill</span>
              </button>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">
              Rent, credit card bills, utilities, and scheduled EMIs due in 5 days or less
            </p>

            {/* List of upcoming items due in 5 days or less */}
            {displayedUpcomingItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-500">
                <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                  No payments due within 5 days
                </p>
                <p className="mt-0.5">
                  All clear! Payments will automatically appear here 5 days before their due date.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedUpcomingItems.map((item) => {
                  const is5DaysOrLess = !item.isPaid && item.statusInfo.diffDays <= 5;
                  const isOverdue = !item.isPaid && item.statusInfo.diffDays < 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        item.isPaid
                          ? 'bg-neutral-50/50 dark:bg-neutral-800/30 border-neutral-200/60 dark:border-neutral-800 opacity-75'
                          : isOverdue
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900'
                          : is5DaysOrLess
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/30'
                          : 'bg-neutral-50/80 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-700/80'
                      }`}
                    >
                      {/* Name, Category, and Due Date */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shrink-0">
                          <CategoryIcon category={item.category} className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                              {item.name}
                            </span>
                            {item.type === 'emi' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                EMI
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span className="font-mono">Due: {item.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Amount, Status Badge, and Mark-Paid Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200/50 dark:border-neutral-700/50">
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white tabular-nums">
                            {formatINR(item.amount)}
                          </div>
                          {/* Payment Status (Req #4) */}
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${item.statusInfo.badgeColor}`}
                          >
                            {item.statusInfo.label}
                          </span>
                        </div>

                        {/* Action: Mark as Paid or Undo */}
                        {item.type === 'bill' ? (
                          item.isPaid ? (
                            <button
                              onClick={() => markBillPaid(item.id, false)}
                              title="Click to unmark"
                              className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 hover:bg-emerald-100 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => markBillPaid(item.id, true)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition active:scale-98 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </button>
                          )
                        ) : (
                          /* EMI item action */
                          <button
                            onClick={() => handlePayEmiClick(item.originalLoan!)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition active:scale-98 flex items-center gap-1"
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

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Marking a bill as paid records an expense and <strong>automatically deducts</strong> from your salary balance.
            </span>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-emerald-600 font-semibold hover:underline shrink-0 ml-2"
            >
              View Expenses &rarr;
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LOAN & COMBINED EMI MANAGEMENT (Req #1) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  Loans &amp; Monthly EMIs
                </h2>
              </div>
              <button
                onClick={() => setIsAddLoanModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Loan</span>
              </button>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">
              Combined Monthly EMI: <strong className="text-indigo-600 dark:text-indigo-400">{formatINR(monthlyEmiCommitment)}/mo</strong>
            </p>

            {/* Total Loan Outstanding Banner */}
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                  Total Outstanding Loan Principal
                </span>
                <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-white">
                  {formatINR(totalOutstandingLoans)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                  Combined EMI
                </span>
                <span className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
                  {formatINR(monthlyEmiCommitment)}/mo
                </span>
              </div>
            </div>

            {/* List of Loans */}
            <div className="space-y-3">
              {loans.map((loan) => {
                const percentPaid = Math.min(
                  100,
                  Math.round((loan.paidEmisCount / loan.tenureMonths) * 100)
                );
                return (
                  <div
                    key={loan.id}
                    className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3"
                  >
                    {/* Loan Name & Bank */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                          {loan.loanName}
                        </h4>
                        <span className="text-[11px] text-neutral-400">
                          {loan.provider || 'Bank'} • Original: {formatINR(loan.originalAmount)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {loan.status}
                      </span>
                    </div>

                    {/* EMI Amount and Outstanding */}
                    <div className="grid grid-cols-2 gap-2 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                          Monthly EMI
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {formatINR(loan.emiAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                          Outstanding
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
                          {formatINR(loan.outstandingPrincipal)}
                        </span>
                      </div>
                    </div>

                    {/* EMIs Paid Count & Progress */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400 mb-1">
                        <span>
                          EMIs Already Paid: <strong className="text-emerald-600 dark:text-emerald-400">{loan.paidEmisCount}</strong> of {loan.tenureMonths}
                        </span>
                        <span className="font-semibold">{percentPaid}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates & Pay Action */}
                    <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Next EMI Date:</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                          {loan.nextDueDate || 'Completed'}
                        </span>
                      </div>
                      {loan.status === 'Active' && (
                        <button
                          onClick={() => handlePayEmiClick(loan)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition active:scale-98 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Pay Installment</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              Total Loans Tracked: <strong className="text-neutral-700 dark:text-neutral-300">{loans.length}</strong>
            </span>
            <button
              onClick={() => onNavigate('loans')}
              className="text-emerald-600 font-semibold hover:underline"
            >
              Loan Manager &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. Bottom Table: Recent Daily Expenses with quick search       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Recent Daily Expenses
            </h3>
            <p className="text-xs text-neutral-400">
              Transactions recorded for {getMonthDisplay(selectedMonth)} • Automatically deducted from salary
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search expense or category..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-neutral-300"
              />
            </div>

            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Expense</span>
            </button>
          </div>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            <Receipt className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">
              No recent expenses found
            </p>
            <p className="mt-0.5">Click "Add Expense" to log grocery, food, or petrol expenses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Expense Item</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {recentExpenses.map((exp) => {
                  const color = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other;
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition group"
                    >
                      {/* Name with category icon */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${color.bg} ${color.text} shrink-0`}>
                            <CategoryIcon category={exp.category} className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 dark:text-white block text-xs">
                              {exp.name}
                            </span>
                            {exp.notes && (
                              <span className="text-[10px] text-neutral-400 block truncate max-w-xs">
                                {exp.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {exp.category}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-neutral-500 font-mono whitespace-nowrap">
                        {exp.date}
                      </td>

                      {/* Method */}
                      <td className="py-3 px-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {exp.paymentMethod}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-extrabold text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                        {formatINR(exp.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Deducted</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-center text-neutral-400">
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          title="Delete Expense"
                          className="p-1 hover:text-rose-600 rounded-md transition"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODALS: Pay EMI, Add Loan, Add Upcoming Bill                  */}
      {/* ------------------------------------------------------------- */}

      {/* Quick Pay EMI Modal */}
      {payingLoan && (
        <Modal
          isOpen={!!payingLoan}
          onClose={() => setPayingLoan(null)}
          title={`Pay EMI: ${payingLoan.loanName}`}
          subtitle={`Installment of ${formatINR(payingLoan.emiAmount)} for ${payingLoan.provider}`}
        >
          <form onSubmit={handleConfirmPayEmi} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Installment Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold bg-white dark:bg-neutral-800"
              />
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setPayingLoan(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Loan Modal */}
      {isAddLoanModalOpen && (
        <Modal
          isOpen={isAddLoanModalOpen}
          onClose={() => setIsAddLoanModalOpen(false)}
          title="Add Bike Loan / EMI"
          subtitle="Track bike EMI installments and remaining principal"
        >
          <form onSubmit={handleCreateLoan} className="space-y-4">
            {/* 1. Bike Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Bike Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Enfield Classic 350, Yamaha MT-15"
                value={newBikeName}
                onChange={(e) => setNewBikeName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold bg-white dark:bg-neutral-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 2. Monthly EMI */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Monthly EMI (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-neutral-400 font-semibold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="4500"
                    value={newBikeEmi}
                    onChange={(e) => setNewBikeEmi(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold text-indigo-600 bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>

              {/* 3. EMIs Already Paid */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  EMIs Already Paid *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="6"
                  value={newBikePaidEmis}
                  onChange={(e) => setNewBikePaidEmis(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
                />
              </div>
            </div>

            {/* 4. Outstanding Principal */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Outstanding Principal (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-neutral-400 font-semibold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="68000"
                  value={newBikeOutstanding}
                  onChange={(e) => setNewBikeOutstanding(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold text-emerald-600 bg-white dark:bg-neutral-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 5. Start Date */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={newBikeStartDate}
                  onChange={(e) => setNewBikeStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs bg-white dark:bg-neutral-800"
                />
              </div>

              {/* 6. Every Month EMI Day */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Every Month EMI Day (1 - 31) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="31"
                  placeholder="5"
                  value={newBikeEmiDay}
                  onChange={(e) => setNewBikeEmiDay(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold bg-white dark:bg-neutral-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddLoanModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Save Loan
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category *
                </label>
                <select
                  value={newBillCategory}
                  onChange={(e) => setNewBillCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
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
                  required
                  placeholder="12000"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold bg-white dark:bg-neutral-800"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                A reminder will automatically appear 5 days prior to this date.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddBillModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
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
