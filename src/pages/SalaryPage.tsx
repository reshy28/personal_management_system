import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  formatINR,
  getMonthDisplay,
  getTodayDateStr,
} from '../types';
import {
  Wallet,
  Receipt,
  History,
  Trash2,
  Settings,
  CheckCircle2,
  Calculator,
} from 'lucide-react';
import { CategoryIcon, CATEGORY_COLORS } from '../components/CategoryIcon';
import { NavTab } from '../components/Sidebar';

interface SalaryPageProps {
  onNavigate?: (tab: NavTab) => void;
}

export const SalaryPage: React.FC<SalaryPageProps> = ({ onNavigate }) => {
  const {
    userProfile,
    selectedMonth,
    setSelectedMonth,
    monthlyIncome,
    monthlyExpenses,
    monthlyEmiPaid,
    monthlySavings,
    remainingBalance,
    salaries,
    expenses,
    saveExpense,
    deleteExpense,
    saveUpcomingBill,
  } = useFinance();

  // -------------------------------------------------------------
  // Add Expense Directly to Decrease Salary Amount with Due Date
  // -------------------------------------------------------------
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDueDate, setExpenseDueDate] = useState(getTodayDateStr());
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState('');

  const handleQuickAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseName.trim() || isNaN(amt) || amt <= 0) return;

    setIsAddingExpense(true);
    setAddSuccessMessage('');
    try {
      const dueDateVal = expenseDueDate || getTodayDateStr();

      // 1. Log expense in monthly ledger to deduct from salary balance
      await saveExpense({
        name: expenseName.trim(),
        amount: amt,
        category: 'Fixed Expenses',
        date: dueDateVal,
        dueDate: dueDateVal,
        monthYear: selectedMonth,
        paymentMethod: 'UPI',
        isDebtSettlement: false,
        notes: `Recorded in Salary Management (Due: ${dueDateVal})`,
      });

      // 2. Also register in upcoming bills so it displays on Home Screen 5 days before due date
      await saveUpcomingBill({
        name: expenseName.trim(),
        amount: amt,
        category: 'Fixed Expenses',
        dueDate: dueDateVal,
        monthYear: dueDateVal.substring(0, 7),
        isPaid: false,
      });

      setExpenseName('');
      setExpenseAmount('');
      setExpenseDueDate(getTodayDateStr());
      setAddSuccessMessage(`Added "${expenseName.trim()}" (${formatINR(amt)}). Deducted from salary & will remind on home screen 5 days before due date.`);
      setTimeout(() => setAddSuccessMessage(''), 4000);
    } finally {
      setIsAddingExpense(false);
    }
  };

  // Filter this month's recorded expenses
  const monthExpensesList = useMemo(() => {
    return expenses
      .filter((e) => (e.monthYear === selectedMonth || e.date.startsWith(selectedMonth)) && !e.isDebtSettlement)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedMonth]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header with Month Selector                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Salary Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Set your monthly salary, configure fixed expenses, and deduct daily expenditures
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('salary-calculator')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              title="Open Salary Calculator"
            >
              <Calculator className="w-4 h-4" />
              <span>Salary Calculator</span>
            </button>
          )}

          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2 pr-8 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs focus:outline-none cursor-pointer"
            >
              <option value={selectedMonth}>{getMonthDisplay(selectedMonth)}</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-400">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP SECTION: Monthly Salary & Remaining Balance Side-by-Side */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Salary Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-2xl border border-emerald-100 dark:border-emerald-900/50">
                ₹
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                  Monthly Salary ({getMonthDisplay(selectedMonth)})
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                  {formatINR(monthlyIncome)}
                </h2>
              </div>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition"
                title="Configure base monthly salary in Settings"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Configured in Settings
            </span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Baseline: {formatINR(userProfile?.defaultMonthlySalary || 48900)}
            </span>
          </div>
        </div>

        {/* Remaining Balance Card */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 dark:from-neutral-950 dark:to-neutral-900 text-white rounded-3xl p-6 border border-neutral-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center font-bold text-xl backdrop-blur-xs border border-white/10">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Remaining Balance
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-white mt-0.5">
                  {formatINR(remainingBalance)}
                </h2>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                remainingBalance >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}
            >
              {remainingBalance >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
            <span>
              Total Spent: <strong className="text-rose-400">-{formatINR(monthlyExpenses + monthlyEmiPaid + monthlySavings)}</strong>
            </span>
            <span className="text-neutral-400">
              {monthlyIncome > 0
                ? `${Math.max(0, Math.round((remainingBalance / monthlyIncome) * 100))}% left`
                : '0% left'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Deductions Math Flow */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
          Salary Deductions Breakdown ({getMonthDisplay(selectedMonth)})
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-neutral-400 block font-medium">1. Total Income</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatINR(monthlyIncome)}
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-neutral-400 block font-medium">2. Daily &amp; Fixed Expenses</span>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              -{formatINR(monthlyExpenses)}
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-neutral-400 block font-medium">3. EMIs Paid</span>
            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              -{formatINR(monthlyEmiPaid)}
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-neutral-400 block font-medium">4. Savings &amp; Investments</span>
            <span className="text-base font-bold text-teal-600 dark:text-teal-400 tabular-nums">
              -{formatINR(monthlySavings)}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. ADD EXPENSE TO DECREASE SALARY AMOUNT                      */}
      {/*    Enter Name, Amount and Due Date                            */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-7 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-600" />
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Add Expense to Decrease Salary Amount
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Enter name, amount, and due date. Deducts from salary and reminds on the Home screen 5 days before due date.
            </p>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('fixed-expenses')}
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
            >
              <span>Manage Fixed Expenses Feature &rarr;</span>
            </button>
          )}
        </div>

        {addSuccessMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{addSuccessMessage}</span>
          </div>
        )}

        {/* Name, Amount, and Due Date Form */}
        <form onSubmit={handleQuickAddExpense} className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            {/* Field 1: Expense Name */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rent, Road & Fuel, Home Help, WiFi"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Field 2: Amount (₹) */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 text-xs font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="2500"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white tabular-nums"
                />
              </div>
            </div>

            {/* Field 3: Due Date */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={expenseDueDate}
                onChange={(e) => setExpenseDueDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-1">
              <button
                type="submit"
                disabled={isAddingExpense}
                className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition disabled:opacity-50 flex items-center justify-center"
              >
                {isAddingExpense ? '...' : 'Add'}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400">
            * Reminders for this amount will appear on your Home Screen strictly 5 days or less before the due date.
          </p>
        </form>

        {/* Deducted Expenses List */}
        <div className="space-y-3">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 text-xs text-neutral-500">
            <span>
              Recorded Expenses Deducted for {getMonthDisplay(selectedMonth)} (
              <strong>{monthExpensesList.length}</strong> items)
            </span>
            <span className="font-bold text-rose-600">
              Total Deducted: {formatINR(monthlyExpenses)}
            </span>
          </div>

          {monthExpensesList.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl px-3">
              No expenses recorded yet for this month. Use the form above to add an expense and decrease your salary amount.
            </div>
          ) : (
            <>
              {/* Mobile Cards View (< sm) */}
              <div className="block sm:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                {monthExpensesList.slice(0, 10).map((exp) => {
                  const color = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other;
                  return (
                    <div key={exp.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`p-2 rounded-xl ${color.bg} ${color.text} shrink-0`}>
                          <CategoryIcon category={exp.category} className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white block truncate">
                            {exp.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            Due: {exp.dueDate || exp.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-xs text-rose-600 tabular-nums">
                          -{formatINR(exp.amount)}
                        </span>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          aria-label={`Delete ${exp.name}`}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg min-w-[34px] min-h-[34px] flex items-center justify-center transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Expense Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Due / Log Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {monthExpensesList.slice(0, 10).map((exp) => {
                      const color = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other;
                      return (
                        <tr key={exp.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition">
                          <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg ${color.bg} ${color.text}`}>
                                <CategoryIcon category={exp.category} className="w-3 h-3" />
                              </span>
                              <span>{exp.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-neutral-500">{exp.category}</td>
                          <td className="py-2.5 px-3 text-neutral-400 font-mono">
                            {exp.dueDate || exp.date}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-rose-600 tabular-nums">
                            -{formatINR(exp.amount)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => deleteExpense(exp.id)}
                              title="Delete this expense deduction"
                              className="text-neutral-400 hover:text-rose-600 transition min-w-[28px] min-h-[28px] flex items-center justify-center mx-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. Historical Salary Records Table                             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-7 border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-neutral-900 dark:text-white text-base">
              Historical Monthly Salary Records
            </h3>
          </div>
          <span className="text-xs text-neutral-500">{salaries.length} months recorded</span>
        </div>

        {salaries.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            No previous recorded salary months yet. Once you update months, they will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3">Credit Date</th>
                  <th className="py-2.5 px-3 text-right">Base Salary</th>
                  <th className="py-2.5 px-3 text-right">Bonus</th>
                  <th className="py-2.5 px-3 text-right">Freelance</th>
                  <th className="py-2.5 px-3 text-right font-bold">Total Inflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {salaries
                  .sort((a, b) => b.monthYear.localeCompare(a.monthYear))
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-white">
                        {getMonthDisplay(s.monthYear)}
                      </td>
                      <td className="py-3 px-3 text-neutral-500 font-mono">{s.receivedDate}</td>
                      <td className="py-3 px-3 text-right font-medium text-neutral-700 dark:text-neutral-300">
                        {formatINR(s.baseSalary)}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-500">
                        {formatINR(s.bonusIncome)}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-500">
                        {formatINR(s.freelanceIncome)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(s.totalIncome)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
