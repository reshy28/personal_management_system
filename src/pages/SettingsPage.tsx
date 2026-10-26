import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, FixedExpenseItem } from '../types';
import {
  User,
  Wallet,
  ShieldCheck,
  Moon,
  Sun,
  Database,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  Edit2,
  ArrowRight,
  Pin,
  Plus,
  Trash2,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';

interface SettingsPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ isDark, onToggleDark }) => {
  const {
    user,
    userProfile,
    updateProfile,
    updateDefaultSalary,
    monthlyBudget,
    updateMonthlyBudget,
    monthlyExpenses,
    monthlyIncome,
    fixedExpenses,
    fixedExpensesTotal,
    updateFixedExpenses,
    includeFixedExpensesInSalary,
    toggleIncludeFixedExpenses,
    resetToDefaultDemoData,
    signOut,
  } = useFinance();

  // Profile Form state
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || user?.displayName || 'Personal Account'
  );
  const [profileSaved, setProfileSaved] = useState(false);

  // Monthly Salary Settings state
  const [salaryInput, setSalaryInput] = useState(
    userProfile?.defaultMonthlySalary?.toString() || '48900'
  );
  const [salaryError, setSalaryError] = useState('');
  const [isSalarySaving, setIsSalarySaving] = useState(false);
  const [salarySavedSuccess, setSalarySavedSuccess] = useState(false);

  // Fixed Expenses State
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState('');
  const [fixedError, setFixedError] = useState('');
  const [fixedSuccess, setFixedSuccess] = useState('');
  const [isAddingFixed, setIsAddingFixed] = useState(false);

  // Inline Fixed Expense editing
  const [editingFixedId, setEditingFixedId] = useState<string | null>(null);
  const [editFixedName, setEditFixedName] = useState('');
  const [editFixedAmount, setEditFixedAmount] = useState('');

  // Delete Fixed Expense confirmation
  const [deleteFixedItem, setDeleteFixedItem] = useState<FixedExpenseItem | null>(null);

  // Monthly Budget Modal state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());
  const [budgetError, setBudgetError] = useState('');
  const [isBudgetSaving, setIsBudgetSaving] = useState(false);
  const [budgetSavedSuccess, setBudgetSavedSuccess] = useState(false);

  // Demo reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Logout Confirmation Modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Sync state when userProfile updates
  useEffect(() => {
    if (userProfile?.displayName) {
      setDisplayName(userProfile.displayName);
    }
    if (userProfile?.defaultMonthlySalary) {
      setSalaryInput(userProfile.defaultMonthlySalary.toString());
    }
    if (userProfile?.monthlyBudget) {
      setBudgetInput(userProfile.monthlyBudget.toString());
    }
  }, [userProfile]);

  // 1. Save Monthly Salary
  const handleSaveMonthlySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalaryError('');

    const trimmed = salaryInput.trim();
    if (!trimmed) {
      setSalaryError('Please enter a monthly salary amount.');
      return;
    }

    const parsedAmount = parseFloat(trimmed);
    if (isNaN(parsedAmount)) {
      setSalaryError('Please enter a valid numeric salary amount.');
      return;
    }

    if (parsedAmount <= 0) {
      setSalaryError('Monthly salary must be greater than ₹0.');
      return;
    }

    setIsSalarySaving(true);
    try {
      await updateDefaultSalary(parsedAmount);
      setSalarySavedSuccess(true);
      setTimeout(() => setSalarySavedSuccess(false), 4000);
    } catch (err: any) {
      setSalaryError(err?.message || 'Failed to save monthly salary.');
    } finally {
      setIsSalarySaving(false);
    }
  };

  // 2. Fixed Expenses Handlers
  const handleAddFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFixedError('');
    setFixedSuccess('');

    const trimmedName = newFixedName.trim();
    const parsedAmount = parseFloat(newFixedAmount);

    if (!trimmedName) {
      setFixedError('Please enter an expense name');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFixedError('Please enter a valid amount greater than ₹0');
      return;
    }

    setIsAddingFixed(true);
    try {
      const newItem: FixedExpenseItem = {
        id: `fx_${Date.now()}`,
        name: trimmedName,
        amount: parsedAmount,
        enabled: true,
        notes: 'Monthly fixed commitment configured in Settings',
      };

      await updateFixedExpenses([...fixedExpenses, newItem]);
      setNewFixedName('');
      setNewFixedAmount('');
      setFixedSuccess(`Added "${trimmedName}" (${formatINR(parsedAmount)}) to fixed expenses.`);
      setTimeout(() => setFixedSuccess(''), 3500);
    } catch (err: any) {
      setFixedError(err?.message || 'Failed to add fixed expense');
    } finally {
      setIsAddingFixed(false);
    }
  };

  const handleToggleFixedItem = async (id: string) => {
    const updated = fixedExpenses.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    await updateFixedExpenses(updated);
  };

  const handleStartEditFixed = (item: FixedExpenseItem) => {
    setEditingFixedId(item.id);
    setEditFixedName(item.name);
    setEditFixedAmount(item.amount.toString());
  };

  const handleSaveEditFixed = async (id: string) => {
    const parsedAmount = parseFloat(editFixedAmount);
    if (!editFixedName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const updated = fixedExpenses.map((item) =>
      item.id === id
        ? {
            ...item,
            name: editFixedName.trim(),
            amount: parsedAmount,
          }
        : item
    );
    await updateFixedExpenses(updated);
    setEditingFixedId(null);
  };

  const handleConfirmDeleteFixed = async () => {
    if (!deleteFixedItem) return;
    const updated = fixedExpenses.filter((item) => item.id !== deleteFixedItem.id);
    await updateFixedExpenses(updated);
    setDeleteFixedItem(null);
  };

  // 3. Profile Name Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      await updateProfile({ displayName: displayName.trim() });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  // 4. Monthly Budget Handlers
  const openBudgetModal = () => {
    setBudgetInput(monthlyBudget.toString());
    setBudgetError('');
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetError('');

    const trimmed = budgetInput.trim();
    if (!trimmed) {
      setBudgetError('Please enter a monthly budget amount.');
      return;
    }

    const parsedAmount = parseFloat(trimmed);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setBudgetError('Monthly budget must be greater than ₹0.');
      return;
    }

    setIsBudgetSaving(true);
    try {
      await updateMonthlyBudget(parsedAmount);
      setIsBudgetModalOpen(false);
      setBudgetSavedSuccess(true);
      setTimeout(() => setBudgetSavedSuccess(false), 3500);
    } catch (err: any) {
      setBudgetError(err?.message || 'Failed to save monthly budget.');
    } finally {
      setIsBudgetSaving(false);
    }
  };

  const handleResetData = async () => {
    if (
      window.confirm(
        'Load default demo data with monthly salary of ₹48,900, active Bike Loan EMI, sample expenses, and category budgets?'
      )
    ) {
      setIsResetting(true);
      try {
        await resetToDefaultDemoData();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 4000);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const budgetPercentUsed = Math.min(
    100,
    Math.round((monthlyExpenses / (monthlyBudget || 1)) * 100)
  );

  const activeFixedCount = fixedExpenses.filter((i) => i.enabled).length;
  const netAfterFixed = monthlyIncome - fixedExpensesTotal;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. MONTHLY SALARY SETTINGS CARD (Primary Baseline)             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-700 mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0 border border-emerald-100 dark:border-emerald-900/40">
              ₹
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base flex items-center gap-2">
                <span>Monthly Salary</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  Global Baseline
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Set here once — automatically powers Home Dashboard, Salary Management &amp; Salary Calculator
              </p>
            </div>
          </div>

          {salarySavedSuccess && (
            <div className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Salary Updated Everywhere!</span>
            </div>
          )}
        </div>

        {/* Informative Callout */}
        <div className="p-3.5 mb-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Single Source of Truth:</strong> Once saved here in Settings, your monthly salary is locked and reflected across all screens. The Salary Calculator and other views will use this amount directly and will never ask you to re-enter it.
          </div>
        </div>

        <form onSubmit={handleSaveMonthlySalary} className="space-y-4">
          {salaryError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{salaryError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Monthly Salary Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-neutral-400 font-bold text-base">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="1"
                required
                value={salaryInput}
                onChange={(e) => {
                  setSalaryInput(e.target.value);
                  if (salaryError) setSalaryError('');
                }}
                className="w-full pl-8 pr-4 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-base font-bold bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                placeholder="48900"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1.5">
              Quick Presets:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {[20000, 30000, 48900, 60000, 75000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSalaryInput(preset.toString());
                    if (salaryError) setSalaryError('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    parseFloat(salaryInput) === preset
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {formatINR(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-700">
            <span className="text-xs text-neutral-400">
              Current active income: <strong className="text-neutral-800 dark:text-neutral-200">{formatINR(monthlyIncome)}</strong>
            </span>

            <button
              type="submit"
              disabled={isSalarySaving}
              className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              {isSalarySaving ? 'Saving Salary...' : 'Save Monthly Salary'}
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FIXED EXPENSES SETTINGS (Editable in Settings)             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-700 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Pin className="w-5 h-5 rotate-45" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                Fixed Expenses &amp; Commitments
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Configure your recurring monthly commitments (Rent, Road, Home Help, Wi-Fi)
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block font-semibold">
              Total Fixed
            </span>
            <span className="text-lg font-black text-neutral-900 dark:text-white tabular-nums">
              {formatINR(fixedExpensesTotal)}
            </span>
          </div>
        </div>

        {/* Summary Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium">
                Active Commitments
              </span>
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {activeFixedCount} of {fixedExpenses.length} items active
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium">
                Net Salary After Fixed Expenses
              </span>
              <span className={`text-sm font-bold ${netAfterFixed >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatINR(netAfterFixed)}
              </span>
            </div>
            <Wallet className="w-4 h-4 text-neutral-400" />
          </div>
        </div>

        {/* Feedback messages */}
        {fixedSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{fixedSuccess}</span>
          </div>
        )}

        {fixedError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{fixedError}</span>
          </div>
        )}

        {/* Add New Fixed Expense Form */}
        <form onSubmit={handleAddFixedExpense} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-3">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
            + Add New Fixed Expense
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6">
              <input
                type="text"
                placeholder="Expense Name (e.g. Rent, Wi-Fi, Cook)"
                value={newFixedName}
                onChange={(e) => setNewFixedName(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-4">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="1"
                  placeholder="Amount"
                  value={newFixedAmount}
                  onChange={(e) => setNewFixedAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isAddingFixed}
                className="w-full h-full min-h-[44px] px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Existing Fixed Expenses List */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Configured Commitments ({fixedExpenses.length})
          </span>

          {fixedExpenses.length === 0 ? (
            <p className="text-xs text-neutral-400 py-3 text-center">
              No fixed expenses added yet. Add your first commitment above.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700/60 border border-neutral-200/80 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
              {fixedExpenses.map((item) => {
                const isEditing = editingFixedId === item.id;

                if (isEditing) {
                  return (
                    <div key={item.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/80 flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        value={editFixedName}
                        onChange={(e) => setEditFixedName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs font-semibold bg-white dark:bg-neutral-900"
                      />
                      <div className="relative w-full sm:w-32">
                        <span className="absolute left-2.5 top-1.5 text-neutral-400 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          step="any"
                          value={editFixedAmount}
                          onChange={(e) => setEditFixedAmount(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs font-bold bg-white dark:bg-neutral-900"
                        />
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleSaveEditFixed(item.id)}
                          className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFixedId(null)}
                          className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 transition"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 flex items-center justify-between gap-3 transition ${
                      item.enabled ? 'hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40' : 'opacity-60 bg-neutral-50/40 dark:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => handleToggleFixedItem(item.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title={item.enabled ? 'Click to disable' : 'Click to enable'}
                      />
                      <div>
                        <span className={`text-xs font-bold text-neutral-900 dark:text-white ${!item.enabled ? 'line-through text-neutral-400' : ''}`}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">
                          {item.enabled ? 'Active monthly' : 'Paused'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-neutral-900 dark:text-white tabular-nums">
                        {formatINR(item.amount)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditFixed(item)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteFixedItem(item)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MONTHLY SPENDING BUDGET                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-700 mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                Monthly Spending Budget
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Set and maintain your target monthly expense budget in Indian Rupees
              </p>
            </div>
          </div>

          {budgetSavedSuccess && (
            <div className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span>Budget Updated!</span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
              Current Monthly Budget Limit
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mt-1 tabular-nums">
              {formatINR(monthlyBudget)}
              <span className="text-xs font-normal text-neutral-400 ml-1.5">/ month</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Spent so far this month: <strong className="text-neutral-800 dark:text-neutral-200 font-bold">{formatINR(monthlyExpenses)}</strong> ({budgetPercentUsed}% of limit)
            </p>
          </div>

          <button
            type="button"
            onClick={openBudgetModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>Update Monthly Budget</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. ACCOUNT HOLDER PROFILE & CURRENCY                           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-700 mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                Account Details &amp; Currency
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                User display name and Indian Rupee standard configuration
              </p>
            </div>
          </div>

          {profileSaved && (
            <div className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span>Name Saved!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Currency (INR Only - ₹)
              </label>
              <input
                type="text"
                disabled
                value="Indian Rupee (INR - ₹)"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs bg-neutral-100 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-300 font-bold cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer"
            >
              Update Name
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. APPEARANCE & DATABASE STARTER DATA                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
            {isDark ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-600" />}
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
              Application Theme
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isDark ? 'Dark theme is active (easier on eyes at night)' : 'Light theme with fresh emerald accents'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleDark}
          className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xl text-xs font-semibold text-neutral-800 dark:text-white transition flex items-center justify-center cursor-pointer"
        >
          {isDark ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
              Data Storage &amp; Starter Data
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              All financial records are stored securely in Google Cloud Firestore
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-neutral-900 dark:text-white block">
              Load Realistic Starter Data
            </span>
            <span className="text-xs text-neutral-500">
              Seeds ₹48,900 monthly salary, an active Bike Loan EMI of ₹2,850, and sample daily grocery/fuel expenses.
            </span>
          </div>

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Loading...' : 'Seed Starter Data'}</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Default starter data loaded! Check your dashboard and modules.</span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. LOGOUT OPTION                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
              Log Out
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Securely exit this session. All your records and budgets remain safe in your Firestore vault.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Monthly Budget Dialog / Modal */}
      {isBudgetModalOpen && (
        <Modal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          title="Monthly Budget Settings"
          subtitle="Configure your target expenditure limit for the month"
        >
          <form onSubmit={handleSaveBudget} className="space-y-4">
            {budgetError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{budgetError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Monthly Budget Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-400 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="1"
                  required
                  autoFocus
                  placeholder="e.g. 30000"
                  value={budgetInput}
                  onChange={(e) => {
                    setBudgetInput(e.target.value);
                    if (budgetError) setBudgetError('');
                  }}
                  className="w-full pl-8 pr-4 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1.5">
                Saved permanently to your account profile and persists across app restarts.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition flex items-center justify-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBudgetSaving}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer disabled:opacity-60"
              >
                {isBudgetSaving ? 'Saving...' : 'Save Budget'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Fixed Expense Confirmation Modal */}
      {deleteFixedItem && (
        <ConfirmModal
          isOpen={!!deleteFixedItem}
          onClose={() => setDeleteFixedItem(null)}
          onConfirm={handleConfirmDeleteFixed}
          title="Remove Fixed Expense"
          message={`Are you sure you want to remove "${deleteFixedItem.name}" (${formatINR(deleteFixedItem.amount)}) from your fixed expenses?`}
          confirmText="Remove"
          isDestructive={true}
        />
      )}

      {/* Logout Confirmation Dialog */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
};
