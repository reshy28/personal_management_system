import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  EXPENSE_CATEGORIES,
  formatINR,
  getMonthDisplay,
  getTodayDateStr,
} from '../types';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  CreditCard,
  Receipt,
  Download,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { CategoryIcon, CATEGORY_COLORS } from '../components/CategoryIcon';
import { ExpenseModal } from '../components/ExpenseModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface ExpensesPageProps {
  onOpenAddExpense: () => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ onOpenAddExpense }) => {
  const {
    expenses,
    selectedMonth,
    monthlyExpenses,
    todayExpenses,
    saveExpense,
    deleteExpense,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');

  // Modals
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter expenses by selectedMonth or specific filterDate
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(
      (e) => e.monthYear === selectedMonth || e.date.startsWith(selectedMonth)
    );
  }, [expenses, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    return currentMonthExpenses.filter((e) => {
      // Search
      const matchesSearch =
        searchQuery === '' ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category
      const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;

      // Payment method
      const matchesMethod =
        selectedPaymentMethod === 'All' || e.paymentMethod === selectedPaymentMethod;

      // Date
      const matchesDate = !filterDate || e.date === filterDate;

      return matchesSearch && matchesCategory && matchesMethod && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentMonthExpenses, searchQuery, selectedCategory, selectedPaymentMethod, filterDate]);

  // Total for currently filtered transactions
  const filteredTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => !e.isDebtSettlement)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const todayStr = getTodayDateStr();
  const todayTransactions = useMemo(() => {
    return expenses.filter((e) => e.date === todayStr);
  }, [expenses, todayStr]);

  const handleEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Total */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {getMonthDisplay(selectedMonth)} Total
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {formatINR(monthlyExpenses)}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Sum of all consumption expenses for {getMonthDisplay(selectedMonth)}
          </p>
        </div>

        {/* Today's Total */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Today's Spending ({todayStr})
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">
            {formatINR(todayExpenses)}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {todayTransactions.length} transactions logged today
          </p>
        </div>

        {/* Filtered Total / Action */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Filtered Records
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mt-1">
              {formatINR(filteredTotal)}
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {filteredExpenses.length} records matching filters
            </span>
          </div>

          <button
            onClick={onOpenAddExpense}
            className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Expense</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search expenses by item name or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category & Payment Method Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
          <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>

          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              selectedCategory === 'All'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            All
          </button>

          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Payment Method filter */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-neutral-400 dark:text-neutral-500 font-semibold mr-1">Method:</span>
          {['All', 'UPI', 'Cash', 'Debit Card', 'Credit Card', 'Other'].map((method) => (
            <button
              key={method}
              onClick={() => setSelectedPaymentMethod(method)}
              className={`px-2.5 py-0.5 rounded-md font-medium transition ${
                selectedPaymentMethod === method
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900 dark:text-white text-base">
            Transactions List ({filteredExpenses.length})
          </h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Sorted by newest first
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-400 mx-auto mb-3">
              <Receipt className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
              No transactions found
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              No expense records match your current search or month filter. Click below to add an expense.
            </p>
            <button
              onClick={onOpenAddExpense}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Add Expense Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-neutral-900/40 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-700/60">
                  <th className="py-3 px-4 sm:px-6">Date</th>
                  <th className="py-3 px-4">Item Name &amp; Notes</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60 text-sm">
                {filteredExpenses.map((exp) => {
                  const color = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other;
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-750 transition"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 sm:px-6 whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                        {exp.date}
                      </td>

                      {/* Name & Notes */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {exp.name}
                        </div>
                        {exp.notes && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xs">
                            {exp.notes}
                          </div>
                        )}
                        {exp.isDebtSettlement && (
                          <span className="inline-block text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium px-1.5 py-0.5 rounded-sm mt-0.5">
                            Debt Settlement (Not double-counted)
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${color.bg} ${color.text}`}
                        >
                          <CategoryIcon category={exp.category} className="w-3.5 h-3.5" />
                          <span>{exp.category}</span>
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                          {exp.paymentMethod}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {formatINR(exp.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(exp)}
                            title="Edit Transaction"
                            className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(exp.id)}
                            title="Delete Transaction"
                            className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <ExpenseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingExpense(null);
          }}
          onSave={saveExpense}
          initialData={editingExpense}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            deleteExpense(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Expense Record"
        message="Are you sure you want to delete this expense record? This will permanently remove the transaction and update your monthly totals immediately."
        confirmText="Delete Record"
      />
    </div>
  );
};
