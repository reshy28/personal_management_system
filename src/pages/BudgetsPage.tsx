import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  formatINR,
  getMonthDisplay,
} from '../types';
import {
  PieChart,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { CategoryIcon, CATEGORY_COLORS } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';

export const BudgetsPage: React.FC = () => {
  const { budgets, expenses, selectedMonth, saveBudget, deleteBudget } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('Food');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Expenses for this month grouped by category
  const monthExpenses = expenses.filter(
    (e) => (e.monthYear === selectedMonth || e.date.startsWith(selectedMonth)) && !e.isDebtSettlement
  );

  const spentByCategory = monthExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + (Number(exp.amount) || 0);
    return acc;
  }, {} as Record<string, number>);

  // Active budgets for selectedMonth
  const monthBudgets = budgets.filter((b) => b.monthYear === selectedMonth);
  const budgetMap = monthBudgets.reduce((acc, b) => {
    acc[b.category] = b.budgetAmount;
    return acc;
  }, {} as Record<string, number>);

  // Compute status for all categories
  const categoryBudgetStats = EXPENSE_CATEGORIES.map((cat) => {
    const budget = budgetMap[cat] || 0;
    const spent = spentByCategory[cat] || 0;
    const remaining = budget - spent;
    const percentUsed = budget > 0 ? Math.round((spent / budget) * 100) : spent > 0 ? 100 : 0;

    let status: 'normal' | 'warning' | 'exceeded' = 'normal';
    if (budget > 0) {
      if (spent > budget) {
        status = 'exceeded';
      } else if (percentUsed >= 80) {
        status = 'warning';
      }
    }

    return {
      category: cat,
      budget,
      spent,
      remaining,
      percentUsed,
      status,
    };
  });

  // Totals across all budgeted categories
  const totalBudgeted = categoryBudgetStats.reduce((sum, item) => sum + item.budget, 0);
  const totalSpentBudgeted = categoryBudgetStats.reduce((sum, item) => sum + item.spent, 0);

  const openSetBudgetModal = (cat: ExpenseCategory, existingBudget: number) => {
    setSelectedCategory(cat);
    setBudgetAmount(existingBudget > 0 ? existingBudget.toString() : '');
    setIsEditingExisting(existingBudget > 0);
    setIsModalOpen(true);
  };

  const handleSaveBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (!isNaN(amount) && amount >= 0) {
      if (amount === 0) {
        await deleteBudget(selectedCategory);
      } else {
        await saveBudget(selectedCategory, amount);
      }
      setIsModalOpen(false);
    }
  };

  const handleDeleteBudget = async (category: string) => {
    if (window.confirm(`Delete budget limit for "${category}"?`)) {
      await deleteBudget(category);
    }
  };

  const handleDeleteFromModal = async () => {
    await deleteBudget(selectedCategory);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Row: Title & Add Budget Limit Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Budget Limits
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Define spending limits per category for {getMonthDisplay(selectedMonth)} to track threshold alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openSetBudgetModal('Food', 0)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Budget Limit</span>
        </button>
      </div>

      {/* Top Banner Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Monthly Budget */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Total Target Budget
          </span>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-1">
            {formatINR(totalBudgeted)}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Combined budget limit for {getMonthDisplay(selectedMonth)}
          </p>
        </div>

        {/* Total Spent vs Budget */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Actual Spent
          </span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatINR(totalSpentBudgeted)}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {totalBudgeted > 0
              ? `${Math.round((totalSpentBudgeted / totalBudgeted) * 100)}% of total monthly budget used`
              : 'Set category budgets below'}
          </p>
        </div>

        {/* Remaining Budget Available */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Remaining Budget
          </span>
          <div
            className={`text-2xl sm:text-3xl font-black mt-1 ${
              totalBudgeted - totalSpentBudgeted >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatINR(totalBudgeted - totalSpentBudgeted)}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {totalBudgeted - totalSpentBudgeted >= 0 ? 'Available buffer' : 'Over budget total!'}
          </p>
        </div>
      </div>

      {/* Warning Alert Legend */}
      <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs">
        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
          Smart Alert Rules:
        </span>
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>&lt; 80% (Safe)</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
          <AlertTriangle className="w-4 h-4" />
          <span>80% - 100% (Approaching Limit Warning)</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-4 h-4" />
          <span>&gt; 100% (Budget Exceeded Danger)</span>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categoryBudgetStats.map((item) => {
          const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
          const hasBudget = item.budget > 0;

          return (
            <div
              key={item.category}
              className={`bg-white dark:bg-neutral-800 rounded-2xl p-5 border shadow-xs transition-all ${
                item.status === 'exceeded'
                  ? 'border-rose-300 dark:border-rose-900 ring-1 ring-rose-500/20'
                  : item.status === 'warning'
                  ? 'border-amber-300 dark:border-amber-900 ring-1 ring-amber-500/20'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${color.bg} ${color.text}`}>
                    <CategoryIcon category={item.category} className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                      {item.category}
                    </h4>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Spent: <strong className="text-neutral-900 dark:text-white">{formatINR(item.spent)}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-neutral-900 dark:text-white">
                    {hasBudget ? formatINR(item.budget) : 'Not Set'}
                  </div>
                  <div className="flex items-center gap-2 justify-end mt-1">
                    {hasBudget && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBudget(item.category)}
                        className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                        title="Delete this budget limit"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openSetBudgetModal(item.category, item.budget)}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{hasBudget ? 'Edit Limit' : '+ Add Limit'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress & Remaining */}
              {hasBudget ? (
                <div className="space-y-2 mt-4">
                  {/* Status Banner */}
                  {item.status === 'exceeded' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Budget Exceeded by {formatINR(Math.abs(item.remaining))}!</span>
                    </div>
                  )}

                  {item.status === 'warning' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Warning: {item.percentUsed}% of budget reached</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{item.percentUsed}% used</span>
                    <span
                      className={`font-medium ${
                        item.remaining >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400 font-bold'
                      }`}
                    >
                      {item.remaining >= 0
                        ? `${formatINR(item.remaining)} remaining`
                        : `Over budget`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === 'exceeded'
                          ? 'bg-rose-600'
                          : item.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, item.percentUsed)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between text-xs text-neutral-500">
                  <span>No spending limit assigned</span>
                  <button
                    onClick={() => openSetBudgetModal(item.category, 0)}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    + Set Target
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Set Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditingExisting ? `Edit Budget: ${selectedCategory}` : `Set Budget Limit`}
        subtitle={`Define spending limit for ${getMonthDisplay(selectedMonth)}`}
      >
        <form onSubmit={handleSaveBudgetSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Expense Category *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const newCat = e.target.value as ExpenseCategory;
                setSelectedCategory(newCat);
                const existing = budgetMap[newCat] || 0;
                setBudgetAmount(existing > 0 ? existing.toString() : '');
                setIsEditingExisting(existing > 0);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-900 dark:text-white bg-white dark:bg-neutral-800"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} {budgetMap[cat] ? `(Current limit: ₹${budgetMap[cat]})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Monthly Budget Limit (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-neutral-400 font-semibold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="e.g. 8000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-900 dark:text-white"
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              You will receive an alert if your expenses in {selectedCategory} reach 80% or exceed this limit.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
            {isEditingExisting ? (
              <button
                type="button"
                onClick={handleDeleteFromModal}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Limit</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Save Budget Limit
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
