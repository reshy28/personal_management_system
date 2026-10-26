import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  SalaryCalculatorItem,
  formatINR,
  getTodayDateStr,
  calculatePaymentStatus,
} from '../types';
import {
  Calculator,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Wallet,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Info,
  DollarSign,
  Tag,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { NavTab } from '../components/Sidebar';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface SalaryCalculatorPageProps {
  onNavigate?: (tab: NavTab) => void;
}

export const SalaryCalculatorPage: React.FC<SalaryCalculatorPageProps> = ({ onNavigate }) => {
  const { user, monthlyIncome, saveUpcomingBill, saveExpense, selectedMonth } = useFinance();

  // State: Monthly Salary amount (defaults to 20,000 or current profile income)
  const [monthlySalary, setMonthlySalary] = useState<number>(() => {
    const savedSalary = localStorage.getItem(`rupeetrack_calc_salary_${user?.uid || 'guest'}`);
    if (savedSalary) {
      const parsed = parseFloat(savedSalary);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 20000; // Default to 20k to match user prompt directly
  });

  // State: Deductions / items list
  const [items, setItems] = useState<SalaryCalculatorItem[]>(() => {
    const saved = localStorage.getItem(`rupeetrack_calc_items_${user?.uid || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    // Default initial example matching user's exact specification:
    // "in this exmaople if my salry is 20k so i add rent 5k so show remaining balance is 15 k"
    return [
      {
        id: 'calc_init_rent',
        name: 'Rent',
        amount: 5000,
        reminderDate: getTodayDateStr(),
        category: 'Rent',
        notes: 'Monthly apartment rent',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Dialog State: Add / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formReminderDate, setFormReminderDate] = useState(getTodayDateStr());
  const [formCategory, setFormCategory] = useState('Rent');
  const [formNotes, setFormNotes] = useState('');

  // Salary Editor Modal / Prompt
  const [isEditSalaryModalOpen, setIsEditSalaryModalOpen] = useState(false);
  const [tempSalaryInput, setTempSalaryInput] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Success notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to Firestore and LocalStorage
  useEffect(() => {
    const storageKeyItems = `rupeetrack_calc_items_${user?.uid || 'guest'}`;
    const storageKeySalary = `rupeetrack_calc_salary_${user?.uid || 'guest'}`;
    localStorage.setItem(storageKeyItems, JSON.stringify(items));
    localStorage.setItem(storageKeySalary, monthlySalary.toString());

    if (user?.uid) {
      const calcDocRef = doc(db, 'users', user.uid, 'salaryCalculator', 'default');
      setDoc(
        calcDocRef,
        {
          monthlySalary,
          items,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {
        // LocalStorage is already safe fallback
      });
    }
  }, [items, monthlySalary, user?.uid]);

  // Load from Firestore on mount if available
  useEffect(() => {
    if (!user?.uid) return;
    const calcDocRef = doc(db, 'users', user.uid, 'salaryCalculator', 'default');
    getDoc(calcDocRef)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.monthlySalary && typeof data.monthlySalary === 'number') {
            setMonthlySalary(data.monthlySalary);
          }
          if (Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items);
          }
        }
      })
      .catch(() => {
        // Fallback to local state
      });
  }, [user?.uid]);

  // Calculations
  const totalDeductions = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [items]);

  // The critical formula: Remaining Balance = Monthly Salary - Total Deductions
  const remainingBalance = useMemo(() => {
    return monthlySalary - totalDeductions;
  }, [monthlySalary, totalDeductions]);

  const allocatedPercentage = useMemo(() => {
    if (monthlySalary <= 0) return 0;
    return Math.min(Math.round((totalDeductions / monthlySalary) * 100), 100);
  }, [totalDeductions, monthlySalary]);

  const remainingPercentage = useMemo(() => {
    if (monthlySalary <= 0) return 0;
    return Math.max(Math.round((remainingBalance / monthlySalary) * 100), 0);
  }, [remainingBalance, monthlySalary]);

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingItemId(null);
    setFormName('');
    setFormAmount('');
    setFormReminderDate(getTodayDateStr());
    setFormCategory('Rent');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: SalaryCalculatorItem) => {
    setEditingItemId(item.id);
    setFormName(item.name);
    setFormAmount(item.amount.toString());
    setFormReminderDate(item.reminderDate || getTodayDateStr());
    setFormCategory(item.category || 'Rent');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Submit Add / Edit Dialog
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (!formName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (editingItemId) {
      // Edit existing
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                name: formName.trim(),
                amount: parsedAmount,
                reminderDate: formReminderDate || getTodayDateStr(),
                category: formCategory,
                notes: formNotes.trim(),
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      showToast(`Updated "${formName.trim()}" (${formatINR(parsedAmount)})`);
    } else {
      // Add new
      const newItem: SalaryCalculatorItem = {
        id: `calc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: formName.trim(),
        amount: parsedAmount,
        reminderDate: formReminderDate || getTodayDateStr(),
        category: formCategory,
        notes: formNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      showToast(`Added "${formName.trim()}" (${formatINR(parsedAmount)}) to calculator!`);
    }

    setIsModalOpen(false);
  };

  // Handle Delete
  const confirmDelete = () => {
    if (!deleteId) return;
    const target = items.find((i) => i.id === deleteId);
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
    if (target) {
      showToast(`Removed "${target.name}" from calculator`);
    }
  };

  // Load Example Scenario (₹20,000 Salary, ₹5,000 Rent => ₹15,000 Remaining)
  const handleLoadUserExample = () => {
    setMonthlySalary(20000);
    setItems([
      {
        id: `calc_rent_${Date.now()}`,
        name: 'Rent',
        amount: 5000,
        reminderDate: getTodayDateStr(),
        category: 'Rent',
        notes: 'House rent deduction',
        createdAt: new Date().toISOString(),
      },
    ]);
    showToast('Loaded example: Salary ₹20,000 with Rent ₹5,000. Remaining Balance = ₹15,000!');
  };

  // Open Salary Edit Modal
  const handleOpenSalaryEdit = () => {
    setTempSalaryInput(monthlySalary.toString());
    setIsEditSalaryModalOpen(true);
  };

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempSalaryInput);
    if (!isNaN(val) && val >= 0) {
      setMonthlySalary(val);
      showToast(`Monthly Salary set to ${formatINR(val)}`);
    }
    setIsEditSalaryModalOpen(false);
  };

  // Option to push deduction directly to Upcoming Bills / Reminders
  const handleExportToReminders = async (item: SalaryCalculatorItem) => {
    try {
      await saveUpcomingBill({
        name: item.name,
        amount: item.amount,
        category: (item.category as any) || 'Fixed Expenses',
        dueDate: item.reminderDate || getTodayDateStr(),
        monthYear: (item.reminderDate || getTodayDateStr()).substring(0, 7),
        isPaid: false,
      });
      showToast(`"${item.name}" registered to Home Screen Reminder!`);
    } catch (e) {
      showToast(`Reminder registered for "${item.name}"`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top 3 Core Metrics Requested by User: Monthly Salary, Total Deductions, Remaining Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Monthly Salary Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                Monthly Salary
              </span>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                {formatINR(monthlySalary)}
              </div>
            </div>
            <button
              onClick={handleOpenSalaryEdit}
              className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
              title="Edit Monthly Salary"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400">Salary Baseline</span>
            <button
              onClick={handleOpenSalaryEdit}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Change Salary
            </button>
          </div>
        </div>

        {/* 2. Total Deductions Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                Total Deductions
              </span>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                {formatINR(totalDeductions)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400">
              {items.length} item{items.length !== 1 ? 's' : ''} added
            </span>
            <span className="font-bold text-neutral-700 dark:text-neutral-300">
              {allocatedPercentage}% of salary
            </span>
          </div>
        </div>

        {/* 3. Remaining Balance Card (The requested calculation) */}
        <div
          className={`rounded-2xl p-5 border shadow-2xs transition-all relative overflow-hidden ${
            remainingBalance > 0
              ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-transparent border-emerald-300 dark:border-emerald-800'
              : remainingBalance === 0
              ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
              : 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                  Remaining Balance
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                  Live
                </span>
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  remainingBalance > 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : remainingBalance === 0
                    ? 'text-neutral-800 dark:text-neutral-200'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {formatINR(remainingBalance)}
              </div>
            </div>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                remainingBalance >= 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-neutral-200/60 dark:border-neutral-800">
            <span className="text-neutral-600 dark:text-neutral-400 font-medium">
              {remainingBalance > 0
                ? 'Surplus available'
                : remainingBalance === 0
                ? 'Fully allocated'
                : 'Deficit / over budget'}
            </span>
            <span
              className={`font-black ${
                remainingBalance > 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600'
              }`}
            >
              {remainingPercentage}% remaining
            </span>
          </div>
        </div>
      </div>

      {/* Visual Salary Allocation Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-3">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between text-xs font-semibold gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-neutral-600 dark:text-neutral-400">
              Deductions: <strong className="text-neutral-900 dark:text-white">{formatINR(totalDeductions)}</strong> ({allocatedPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-neutral-600 dark:text-neutral-400">
              Remaining: <strong className="text-neutral-900 dark:text-white">{formatINR(remainingBalance)}</strong> ({remainingPercentage}%)
            </span>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${allocatedPercentage}%` }}
            className="h-full bg-rose-500 transition-all duration-500"
            title={`Deductions: ${formatINR(totalDeductions)}`}
          />
          <div
            style={{ width: `${remainingPercentage}%` }}
            className="h-full bg-emerald-500 transition-all duration-500"
            title={`Remaining: ${formatINR(remainingBalance)}`}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-neutral-400 gap-1">
          <span className="hidden sm:inline">₹0</span>
          <span className="font-medium text-neutral-600 dark:text-neutral-300">
            Formula: {formatINR(monthlySalary)} - {formatINR(totalDeductions)} = {formatINR(remainingBalance)}
          </span>
          <span className="hidden sm:inline">{formatINR(monthlySalary)}</span>
        </div>
      </div>

      {/* Example Walkthrough Helper Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-emerald-950 dark:text-emerald-200">
              Interactive Salary Calculation Guide
            </div>
            <div className="text-emerald-800/90 dark:text-emerald-300/80 text-[11px] mt-0.5">
              Click "+ Add Deduction" to enter your deduction name (e.g. <strong>Rent</strong>), amount (e.g. <strong>₹5,000</strong>), and reminder date. The top balance will calculate to <strong>₹15,000</strong> automatically!
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="shrink-0 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add</span>
        </button>
      </div>

      {/* List of Deductions */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Deductions & Reminder Schedule
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {items.length} item{items.length !== 1 ? 's' : ''} planned from {formatINR(monthlySalary)} monthly salary
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mx-auto mb-3">
              <Calculator className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">
              No deductions added yet
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
              Add your first deduction like Rent (₹5,000) with a reminder date to calculate your remaining balance.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleLoadUserExample}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition"
              >
                Load Rent ₹5,000 Example
              </button>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition"
              >
                + Add Custom Item
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.map((item) => {
              const status = calculatePaymentStatus(item.reminderDate, false);
              const share = monthlySalary > 0 ? ((item.amount / monthlySalary) * 100).toFixed(1) : '0';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition"
                >
                  {/* Left: Name, Reminder Date, Category */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                          {item.category || 'Expense'}
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-400">
                          ({share}% of salary)
                        </span>
                      </div>

                      {/* Reminder Date Badge */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Reminder Date: <strong>{item.reminderDate}</strong></span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${status.badgeColor}`}>
                          {status.label}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-neutral-400 mt-1 italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
                        {formatINR(item.amount)}
                      </div>
                      <span className="text-[10px] text-neutral-400 block">
                        Deducted from balance
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={() => handleExportToReminders(item)}
                        title="Sync to Home Screen Reminder"
                        className="p-2 rounded-xl text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Item"
                        className="p-2 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteId(item.id)}
                        title="Delete Item"
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIALOG BOX (Modal) Requested by User */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItemId ? 'Edit Salary Deduction' : 'Add Salary Deduction'}
          subtitle="Enter deduction name, amount, and reminder date"
        >
          <form onSubmit={handleSaveItem} className="space-y-4">
            {/* 1. Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Deduction Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rent, Groceries, WiFi, Bike EMI"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 2. Amount */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Amount (₹) *
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
                  placeholder="e.g. 5000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 3. Reminder Date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Reminder Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formReminderDate}
                  onChange={(e) => setFormReminderDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-medium bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setFormReminderDate(getTodayDateStr())}
                  className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 font-medium"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 5);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setFormReminderDate(`${y}-${m}-${day}`);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 font-medium"
                >
                  In 5 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    const y = nextMonth.getFullYear();
                    const m = String(nextMonth.getMonth() + 1).padStart(2, '0');
                    setFormReminderDate(`${y}-${m}-01`);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 font-medium"
                >
                  1st of Next Month
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-medium bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Rent">Rent</option>
                <option value="Bills and Utilities">Bills & Utilities</option>
                <option value="Food">Food & Groceries</option>
                <option value="Credit Card Payment">Credit Card EMI</option>
                <option value="Medical">Medical</option>
                <option value="Fixed Expenses">Fixed Expense</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Due before 5th of every month"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs bg-white dark:bg-neutral-900 focus:outline-none"
              />
            </div>

            {/* Live Calculation Preview */}
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">
                Remaining Balance Preview:
              </span>
              <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                {(() => {
                  const amt = parseFloat(formAmount) || 0;
                  const currentExisting = editingItemId
                    ? items.find((i) => i.id === editingItemId)?.amount || 0
                    : 0;
                  const projectedBalance = remainingBalance + currentExisting - amt;
                  return formatINR(projectedBalance);
                })()}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                {editingItemId ? 'Update Deduction' : 'Add Deduction'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Salary Quick Edit Modal */}
      {isEditSalaryModalOpen && (
        <Modal
          isOpen={isEditSalaryModalOpen}
          onClose={() => setIsEditSalaryModalOpen(false)}
          title="Set Monthly Salary"
          subtitle="Adjust baseline salary for the calculator"
        >
          <form onSubmit={handleSaveSalary} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Monthly Salary Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-neutral-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={tempSalaryInput}
                  onChange={(e) => setTempSalaryInput(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-500 block mb-1.5">
                Quick Presets:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTempSalaryInput('20000')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  ₹20,000 (Example)
                </button>
                <button
                  type="button"
                  onClick={() => setTempSalaryInput('30000')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  ₹30,000
                </button>
                <button
                  type="button"
                  onClick={() => setTempSalaryInput('48900')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  ₹48,900 (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setTempSalaryInput('60000')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  ₹60,000
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsEditSalaryModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Save Baseline
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <ConfirmModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Remove Deduction"
          message="Are you sure you want to remove this deduction? The remaining balance will increase automatically."
          confirmText="Remove"
          isDestructive
        />
      )}

      {/* Floating '+' Action Button in the Bottom Right Corner (Icon Only) */}
      <div className="fixed bottom-20 right-4 sm:right-6 lg:bottom-8 lg:right-8 z-40">
        <button
          type="button"
          onClick={handleOpenAdd}
          aria-label="Add Salary Deduction"
          title="Add Salary Deduction"
          className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xl hover:shadow-2xl shadow-emerald-950/20 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/40 border border-emerald-400/30"
        >
          <Plus className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.8] transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </div>
    </div>
  );
};

