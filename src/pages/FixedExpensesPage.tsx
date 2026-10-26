import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, FixedExpenseItem } from '../types';
import {
  Pin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Wallet,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Receipt,
  Layers,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface FixedExpensesPageProps {
  onNavigate?: (tab: NavTab) => void;
}

export const FixedExpensesPage: React.FC<FixedExpensesPageProps> = ({ onNavigate }) => {
  const {
    fixedExpenses,
    fixedExpensesTotal,
    updateFixedExpenses,
    monthlyIncome,
    remainingBalance,
    saveExpense,
    selectedMonth,
  } = useFinance();

  // Name and Amount ONLY form state (explicit user requirement)
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Add new fixed expense with NAME and AMOUNT ONLY
  const handleAddFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const trimmedName = expenseName.trim();
    const parsedAmount = parseFloat(expenseAmount);

    if (!trimmedName) {
      setFormError('Please enter an expense name');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than ₹0');
      return;
    }

    const newItem: FixedExpenseItem = {
      id: `fx_${Date.now()}`,
      name: trimmedName,
      amount: parsedAmount,
      enabled: true,
      notes: 'Fixed monthly commitment',
    };

    try {
      await updateFixedExpenses([...fixedExpenses, newItem]);
      setExpenseName('');
      setExpenseAmount('');
      setSuccessMessage(`Added "${trimmedName}" (${formatINR(parsedAmount)}) to fixed expenses.`);
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save fixed expense');
    }
  };

  // Toggle individual item enabled / disabled
  const handleToggleItem = async (id: string) => {
    const updated = fixedExpenses.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    await updateFixedExpenses(updated);
  };

  // Start inline editing
  const handleStartEdit = (item: FixedExpenseItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(item.amount.toString());
  };

  // Save inline edit
  const handleSaveEdit = async (id: string) => {
    const parsedAmount = parseFloat(editAmount);
    if (!editName.trim() || isNaN(parsedAmount) || parsedAmount < 0) return;

    const updated = fixedExpenses.map((item) =>
      item.id === id
        ? {
            ...item,
            name: editName.trim(),
            amount: parsedAmount,
          }
        : item
    );
    await updateFixedExpenses(updated);
    setEditingId(null);
  };

  // Delete fixed expense
  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Delete fixed expense "${name}"?`)) {
      const updated = fixedExpenses.filter((item) => item.id !== id);
      await updateFixedExpenses(updated);
    }
  };

  // Record this fixed expense into the current month's transaction ledger
  const handleRecordToExpenses = async (item: FixedExpenseItem) => {
    try {
      const todayStr = new Date().toISOString().substring(0, 10);
      await saveExpense({
        name: item.name,
        amount: item.amount,
        category: 'Fixed Expenses',
        date: todayStr,
        monthYear: selectedMonth,
        paymentMethod: 'UPI',
        isDebtSettlement: false,
        notes: `Recorded from Fixed Expenses feature`,
      });
      setSuccessMessage(`Logged ${item.name} (${formatINR(item.amount)}) into ${selectedMonth} daily expenses!`);
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to record expense');
    }
  };

  const activeCount = fixedExpenses.filter((item) => item.enabled).length;
  const netAfterFixed = monthlyIncome - fixedExpensesTotal;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* Header Row: Title & Tag                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
              <Pin className="w-5 h-5 rotate-45" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Fixed Expenses
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold">
              Features
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Set and track your fixed recurring expenses (Rent, Road, Home Help, etc.) with simple name and amount.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Notification Messages                                          */}
      {/* ------------------------------------------------------------- */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {formError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2 shadow-xs">
          <X className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{formError}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Summary Cards Row                                             */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Fixed Expenses */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Fixed Expenses
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Pin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {formatINR(fixedExpensesTotal)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400">
              <span>{activeCount} of {fixedExpenses.length} items active</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Active commitments
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Baseline Monthly Salary */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Monthly Salary
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight">
              {formatINR(monthlyIncome)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400">
              <span>Salary baseline</span>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('salary')}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Manage Salary &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Net After Fixed Outflows */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Net After Fixed Expenses
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums tracking-tight">
              {formatINR(netAfterFixed)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400">
              <span>Available for daily expenses</span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {monthlyIncome > 0 ? `${Math.round((netAfterFixed / monthlyIncome) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Primary Section: Add Fixed Expense Form (Name and Amount ONLY) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Add Fixed Expense
              </h2>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Add amounts: enter expense name and amount only.
            </p>
          </div>
        </div>

        {/* Clean Name & Amount Form */}
        <form onSubmit={handleAddFixedExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
            {/* Field 1: Name */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Expense Name
              </label>
              <input
                type="text"
                required
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="e.g. Rent, Road, Home Help, Internet, Gym"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Field 2: Amount (₹) */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-neutral-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition tabular-nums"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full h-[42px] bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Configured Fixed Expenses List                                */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Configured Fixed Expenses ({fixedExpenses.length})
            </h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              Toggle items to include or exclude them from monthly deductions.
            </p>
          </div>
          <span className="text-xs font-extrabold text-neutral-900 dark:text-white tabular-nums bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl">
            Active: {formatINR(fixedExpensesTotal)}/mo
          </span>
        </div>

        {fixedExpenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            <Pin className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <p className="font-bold text-neutral-700 dark:text-neutral-300">
              No fixed expenses configured yet
            </p>
            <p className="mt-1">Add your house rent, road, or domestic help above with name and amount only.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {fixedExpenses.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.enabled
                      ? 'bg-neutral-50/70 dark:bg-neutral-800/40 border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs'
                      : 'bg-neutral-50/30 dark:bg-neutral-900/40 border-dashed border-neutral-200 dark:border-neutral-800 opacity-60'
                  }`}
                >
                  {isEditing ? (
                    /* Inline Edit Mode */
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Expense Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs bg-white dark:bg-neutral-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-bold bg-white dark:bg-neutral-800 tabular-nums"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded-lg text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Display Mode */
                    <div className="flex flex-col justify-between h-full space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item.id)}
                            title={item.enabled ? 'Click to disable' : 'Click to enable'}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                              item.enabled
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                            }`}
                          >
                            {item.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-neutral-900 dark:text-white block truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
                              {item.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tabular-nums block">
                            {formatINR(item.amount)}
                          </span>
                          <span className="text-[10px] text-neutral-400">per month</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 text-xs">
                        {/* 1-Click Record into Daily Expenses */}
                        <button
                          type="button"
                          onClick={() => handleRecordToExpenses(item)}
                          title="Record this fixed payment as a transaction in current month"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Record as Expense</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            title="Edit name and amount"
                            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            title="Delete fixed expense"
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-neutral-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Information Footnote                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/70 flex items-start gap-3 text-xs text-neutral-600 dark:text-neutral-400">
        <HelpCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>How Fixed Expenses Work:</strong> Fixed expenses represent non-negotiable monthly commitments like Rent, Road/Transport, and Home Help. When enabled, their sum automatically reduces your monthly salary balance to reflect accurate disposable cashflow for daily expenses.
        </p>
      </div>
    </div>
  );
};
