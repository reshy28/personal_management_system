import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  formatINR,
  getMonthDisplay,
  EXPENSE_CATEGORIES,
} from '../types';
import {
  FileBarChart,
  Download,
  Calendar,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  Wallet,
  Receipt,
  CreditCard,
  PiggyBank,
} from 'lucide-react';
import { CategoryIcon, CATEGORY_COLORS } from '../components/CategoryIcon';

export const ReportsPage: React.FC = () => {
  const {
    selectedMonth,
    monthlyIncome,
    monthlyExpenses,
    monthlyEmiPaid,
    remainingBalance,
    highestSpendingCategory,
    expenses,
    salaries,
    emiPayments,
    userProfile,
  } = useFinance();

  // Selected month transactions
  const monthExpenses = useMemo(() => {
    return expenses.filter(
      (e) => (e.monthYear === selectedMonth || e.date.startsWith(selectedMonth)) && !e.isDebtSettlement
    );
  }, [expenses, selectedMonth]);

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

  // Previous month metrics
  const prevMonthMetrics = useMemo(() => {
    const prevSalary = salaries.find((s) => s.monthYear === previousMonthKey);
    const prevIncome = prevSalary ? prevSalary.totalIncome : userProfile?.defaultMonthlySalary ?? 48900;

    const prevExp = expenses
      .filter((e) => (e.monthYear === previousMonthKey || e.date.startsWith(previousMonthKey)) && !e.isDebtSettlement)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const prevEmi = emiPayments
      .filter((p) => p.monthYear === previousMonthKey || p.paymentDate.startsWith(previousMonthKey))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      income: prevIncome,
      expenses: prevExp,
      emi: prevEmi,
      remaining: prevIncome - prevExp - prevEmi,
    };
  }, [previousMonthKey, salaries, expenses, emiPayments, userProfile]);

  // Category Breakdown
  const categoryTotals = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => {
      const sum = monthExpenses
        .filter((e) => e.category === cat)
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      return {
        category: cat,
        amount: sum,
        percentage: monthlyExpenses > 0 ? Math.round((sum / monthlyExpenses) * 100) : 0,
      };
    }).filter((x) => x.amount > 0).sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, monthlyExpenses]);

  // Export to CSV function
  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(`RupeeTrack - Financial Statement for ${getMonthDisplay(selectedMonth)}`);
    lines.push(`Generated On,${new Date().toLocaleString('en-IN')}`);
    lines.push('');
    lines.push('SUMMARY METRICS');
    lines.push(`Monthly Income (₹),${monthlyIncome}`);
    lines.push(`Daily Expenses (₹),${monthlyExpenses}`);
    lines.push(`Total EMI Paid (₹),${monthlyEmiPaid}`);
    lines.push(`Net Remaining Balance (₹),${remainingBalance}`);
    lines.push('');
    lines.push('CATEGORY SPENDING BREAKDOWN');
    lines.push('Category,Amount (₹),Share (%)');
    categoryTotals.forEach((item) => {
      lines.push(`"${item.category}",${item.amount},${item.percentage}%`);
    });
    lines.push('');
    lines.push('DETAILED EXPENSE TRANSACTIONS');
    lines.push('Date,Item Name,Category,Payment Method,Amount (₹),Notes');
    monthExpenses.forEach((exp) => {
      lines.push(
        `"${exp.date}","${exp.name.replace(/"/g, '""')}","${exp.category}","${exp.paymentMethod}",${exp.amount},"${(exp.notes || '').replace(/"/g, '""')}"`
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `RupeeTrack_Financial_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const expenseDiff = monthlyExpenses - prevMonthMetrics.expenses;
  const incomeDiff = monthlyIncome - prevMonthMetrics.income;
  const emiDiff = monthlyEmiPaid - prevMonthMetrics.emi;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
            <FileBarChart className="w-3.5 h-3.5" />
            <span>Monthly Statement</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
            Comprehensive Report for {getMonthDisplay(selectedMonth)}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Full summary of monthly inflows, daily outflows, debt installments, and net balance.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV / Excel</span>
        </button>
      </div>

      {/* Main Financial Statement Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Income */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            1. Total Income
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(monthlyIncome)}
          </div>
          <span className="text-[10px] text-neutral-400">Monthly baseline</span>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            2. Daily Expenses
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatINR(monthlyExpenses)}
          </div>
          <span className="text-[10px] text-neutral-400">Living costs</span>
        </div>

        {/* EMI Paid */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            3. EMI Paid
          </span>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatINR(monthlyEmiPaid)}
          </div>
          <span className="text-[10px] text-neutral-400">Debt installments</span>
        </div>

        {/* Remaining Net Balance */}
        <div
          className={`rounded-2xl p-4 border shadow-xs ${
            remainingBalance >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
          }`}
        >
          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
            4. Net Balance
          </span>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 ${
              remainingBalance >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatINR(remainingBalance)}
          </div>
          <span className="text-[10px] text-neutral-500">Unallocated surplus</span>
        </div>
      </div>

      {/* Comparison with Previous Month */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white text-base">
              Comparison with Previous Month ({getMonthDisplay(previousMonthKey)})
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Track how your spending and saving habits changed over the last 30 days
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Expense Delta */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-xs font-semibold text-neutral-500 block">
              Daily Expenses Delta
            </span>
            <div className="flex items-center gap-2 mt-1">
              {expenseDiff > 0 ? (
                <TrendingUp className="w-5 h-5 text-rose-600" />
              ) : expenseDiff < 0 ? (
                <TrendingDown className="w-5 h-5 text-emerald-600" />
              ) : (
                <Minus className="w-5 h-5 text-neutral-400" />
              )}
              <span
                className={`text-lg font-bold ${
                  expenseDiff > 0
                    ? 'text-rose-600'
                    : expenseDiff < 0
                    ? 'text-emerald-600'
                    : 'text-neutral-600'
                }`}
              >
                {expenseDiff > 0 ? `+${formatINR(expenseDiff)}` : formatINR(expenseDiff)}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              {expenseDiff > 0
                ? 'Spending increased vs previous month'
                : expenseDiff < 0
                ? 'Spending decreased vs previous month (Good!)'
                : 'Spending remained identical'}
            </span>
          </div>

          {/* Income Delta */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-xs font-semibold text-neutral-500 block">
              Income Delta
            </span>
            <div className="flex items-center gap-2 mt-1">
              {incomeDiff > 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : incomeDiff < 0 ? (
                <TrendingDown className="w-5 h-5 text-rose-600" />
              ) : (
                <Minus className="w-5 h-5 text-neutral-400" />
              )}
              <span
                className={`text-lg font-bold ${
                  incomeDiff > 0
                    ? 'text-emerald-600'
                    : incomeDiff < 0
                    ? 'text-rose-600'
                    : 'text-neutral-600'
                }`}
              >
                {incomeDiff > 0 ? `+${formatINR(incomeDiff)}` : formatINR(incomeDiff)}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              {incomeDiff >= 0 ? 'Salary / side income change' : 'Lower income than prior month'}
            </span>
          </div>

          {/* EMI Payments Delta */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60">
            <span className="text-xs font-semibold text-neutral-500 block">
              EMI Debt Payments Delta
            </span>
            <div className="flex items-center gap-2 mt-1">
              {emiDiff > 0 ? (
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              ) : emiDiff < 0 ? (
                <TrendingDown className="w-5 h-5 text-emerald-600" />
              ) : (
                <Minus className="w-5 h-5 text-neutral-400" />
              )}
              <span
                className={`text-lg font-bold ${
                  emiDiff > 0
                    ? 'text-indigo-600'
                    : emiDiff < 0
                    ? 'text-emerald-600'
                    : 'text-neutral-600'
                }`}
              >
                {emiDiff > 0 ? `+${formatINR(emiDiff)}` : formatINR(emiDiff)}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              {emiDiff > 0 ? 'Higher debt outflow vs last month' : emiDiff < 0 ? 'Lower debt outflow vs last month' : 'EMI payments identical'}
            </span>
          </div>
        </div>
      </div>

      {/* Category-Wise Breakdown Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-neutral-900 dark:text-white text-base">
              Category-Wise Spending Breakdown
            </h3>
            {highestSpendingCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Top: {highestSpendingCategory.category}</span>
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-500">
            Total {categoryTotals.length} active categories
          </span>
        </div>

        {categoryTotals.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            No expenses recorded for this month to categorize.
          </div>
        ) : (
          <>
            {/* Mobile Breakdown Cards (< sm) */}
            <div className="block sm:hidden divide-y divide-neutral-100 dark:divide-neutral-700/60 p-2">
              {categoryTotals.map((item, idx) => {
                const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                return (
                  <div key={item.category} className="py-3 px-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-neutral-400 shrink-0">#{idx + 1}</span>
                        <div className={`p-1.5 rounded-lg ${color.bg} ${color.text} shrink-0`}>
                          <CategoryIcon category={item.category} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {item.category}
                        </span>
                      </div>
                      <span className="font-extrabold text-xs text-neutral-900 dark:text-white tabular-nums shrink-0">
                        {formatINR(item.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-neutral-500 w-8 text-right shrink-0">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900/40 text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-700">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Share of Total Spending</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {categoryTotals.map((item, idx) => {
                    const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                    return (
                      <tr key={item.category} className="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                        <td className="py-3 px-4 font-bold text-neutral-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${color.bg} ${color.text}`}>
                              <CategoryIcon category={item.category} className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-neutral-900 dark:text-white">
                              {item.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 w-1/3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300 w-10 text-right">
                              {item.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-neutral-900 dark:text-white text-sm">
                          {formatINR(item.amount)}
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
  );
};
