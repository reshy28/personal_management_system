import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  SavingRecord,
  SavingsType,
  SAVINGS_TYPES,
  formatINR,
  getMonthDisplay,
  getTodayDateStr,
} from '../types';
import {
  PiggyBank,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Percent,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { SavingsTypeIcon } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';

export const SavingsPage: React.FC = () => {
  const {
    savings,
    selectedMonth,
    monthlyIncome,
    monthlySavings,
    remainingBalance,
    savingsRate,
    saveSaving,
    deleteSaving,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SavingRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Month filtered savings
  const monthSavingsList = savings.filter(
    (s) => s.monthYear === selectedMonth || s.date.startsWith(selectedMonth)
  );

  // -------------------------------------------------------------
  // Emergency Saving: Set Amount Only
  // -------------------------------------------------------------
  const currentEmergencySaving = monthSavingsList.find(
    (s) => s.type === 'Emergency Fund' || s.name.toLowerCase().includes('emergency')
  );

  const [emergencyAmount, setEmergencyAmount] = useState('');
  const [emergencySuccess, setEmergencySuccess] = useState('');
  const [emergencyError, setEmergencyError] = useState('');

  useEffect(() => {
    if (currentEmergencySaving) {
      setEmergencyAmount(currentEmergencySaving.amount.toString());
    } else {
      setEmergencyAmount('');
    }
  }, [currentEmergencySaving, selectedMonth]);

  const handleSaveEmergencySaving = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyError('');
    setEmergencySuccess('');
    const amt = parseFloat(emergencyAmount);
    if (isNaN(amt) || amt <= 0) {
      setEmergencyError('Please enter a valid amount greater than ₹0');
      return;
    }

    try {
      if (currentEmergencySaving) {
        await saveSaving(
          {
            ...currentEmergencySaving,
            name: 'Emergency Saving',
            amount: amt,
            type: 'Emergency Fund',
            date: currentEmergencySaving.date || getTodayDateStr(),
            monthYear: selectedMonth,
            notes: 'Monthly emergency fund commitment',
          },
          currentEmergencySaving.id
        );
      } else {
        await saveSaving({
          name: 'Emergency Saving',
          amount: amt,
          type: 'Emergency Fund',
          date: getTodayDateStr(),
          monthYear: selectedMonth,
          notes: 'Monthly emergency fund commitment',
        });
      }
      setEmergencySuccess(`Emergency saving set to ${formatINR(amt)} for ${getMonthDisplay(selectedMonth)}!`);
      setTimeout(() => setEmergencySuccess(''), 3500);
    } catch (err: any) {
      setEmergencyError(err?.message || 'Failed to save emergency saving');
    }
  };

  const handleClearEmergencySaving = async () => {
    if (!currentEmergencySaving) return;
    if (window.confirm(`Clear emergency saving of ${formatINR(currentEmergencySaving.amount)} for ${getMonthDisplay(selectedMonth)}?`)) {
      await deleteSaving(currentEmergencySaving.id);
      setEmergencyAmount('');
      setEmergencySuccess('Emergency saving removed for this month');
      setTimeout(() => setEmergencySuccess(''), 3000);
    }
  };

  // Form states for general investments modal
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<SavingsType>('Mutual Fund');
  const [date, setDate] = useState(getTodayDateStr());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Group by type
  const savingsByType = SAVINGS_TYPES.map((t) => {
    const total = monthSavingsList
      .filter((s) => s.type === t)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    return { type: t, total };
  }).filter((x) => x.total > 0);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setAmount('');
    setType('Mutual Fund');
    setDate(getTodayDateStr());
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: SavingRecord) => {
    setEditingItem(item);
    setName(item.name);
    setAmount(item.amount.toString());
    setType(item.type);
    setDate(item.date);
    setNotes(item.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name for the investment or saving');
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await saveSaving(
        {
          name: name.trim(),
          amount: parsed,
          type,
          date,
          monthYear: date.substring(0, 7),
          notes: notes.trim(),
        },
        editingItem?.id
      );
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Monthly Savings */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Total Saved &amp; Invested
          </span>
          <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">
            {formatINR(monthlySavings)}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Wealth built in {getMonthDisplay(selectedMonth)}
          </p>
        </div>

        {/* Savings Rate % */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Monthly Savings Rate
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {savingsRate}%
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Of total monthly income ({formatINR(monthlyIncome)})
          </p>
        </div>

        {/* Balance After Savings */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Remaining In Hand
            </span>
            <div
              className={`text-2xl sm:text-3xl font-black mt-1 ${
                remainingBalance >= 0 ? 'text-neutral-900 dark:text-white' : 'text-rose-600'
              }`}
            >
              {formatINR(remainingBalance)}
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Net balance after all expenses, EMIs &amp; investments
            </span>
          </div>

          <button
            onClick={openAddModal}
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Investment</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Emergency Saving: Set Amount Only                              */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-neutral-900 dark:to-neutral-900 rounded-3xl p-6 sm:p-7 border border-amber-200/80 dark:border-amber-900/60 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold shadow-2xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Emergency Saving
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
                Safety Net
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Set your monthly emergency fund in Indian Rupees (₹). Simply set the amount to reserve for unexpected expenses.
            </p>

            {currentEmergencySaving ? (
              <div className="pt-2 flex items-center gap-2 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">Current for {getMonthDisplay(selectedMonth)}:</span>
                <span className="text-base font-black text-amber-700 dark:text-amber-400 tabular-nums">
                  {formatINR(currentEmergencySaving.amount)}
                </span>
                <button
                  type="button"
                  onClick={handleClearEmergencySaving}
                  className="ml-2 text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="pt-2 text-xs text-neutral-400 dark:text-neutral-500">
                No emergency saving set for {getMonthDisplay(selectedMonth)} yet.
              </div>
            )}
          </div>

          {/* Simple Form: Amount ONLY */}
          <form onSubmit={handleSaveEmergencySaving} className="flex-1 max-w-md bg-white dark:bg-neutral-850 p-4 sm:p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Set Emergency Saving Amount (₹)
            </label>

            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-2.5 text-neutral-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={emergencyAmount}
                  onChange={(e) => setEmergencyAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-extrabold text-base focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition tabular-nums"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition shrink-0"
              >
                {currentEmergencySaving ? 'Update Amount' : 'Set Amount'}
              </button>
            </div>

            {/* Quick amount shortcut chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 mr-1">Quick:</span>
              {[1000, 2000, 5000, 10000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setEmergencyAmount(val.toString())}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-100 hover:bg-amber-100 dark:bg-neutral-800 dark:hover:bg-amber-950/60 text-neutral-700 hover:text-amber-800 dark:text-neutral-300 dark:hover:text-amber-300 rounded-lg transition"
                >
                  +{formatINR(val)}
                </button>
              ))}
            </div>

            {emergencySuccess && (
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pt-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{emergencySuccess}</span>
              </div>
            )}

            {emergencyError && (
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 pt-1">
                {emergencyError}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Distinction Note */}
      <div className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed">
          <strong>Wealth Building vs Consumption: </strong>
          Investments, RDs, FDs, and Mutual Funds are kept strictly distinct from daily living expenses (food, rent, fuel). This lets you accurately observe your actual savings rate without treating your investment capital as money spent.
        </div>
      </div>

      {/* Allocation by Investment Type */}
      {savingsByType.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm mb-3">
            Portfolio Allocation ({getMonthDisplay(selectedMonth)})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {savingsByType.map((item) => (
              <div
                key={item.type}
                className="bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60"
              >
                <div className="flex items-center gap-2 mb-1">
                  <SavingsTypeIcon type={item.type} className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 truncate">
                    {item.type}
                  </span>
                </div>
                <div className="text-sm font-bold text-neutral-900 dark:text-white">
                  {formatINR(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contributions Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900 dark:text-white text-base">
            Savings &amp; Investment Records ({monthSavingsList.length})
          </h3>
          <span className="text-xs text-neutral-500">
            For {getMonthDisplay(selectedMonth)}
          </span>
        </div>

        {monthSavingsList.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            <PiggyBank className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">
              No savings or investments logged for this month yet.
            </p>
            <p className="mt-1">
              Add your Mutual Fund SIP, Recurring Deposit, or Emergency Fund contribution.
            </p>
            <button
              onClick={openAddModal}
              className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold"
            >
              Add First Contribution
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block sm:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
              {monthSavingsList.map((item) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white text-sm">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-medium text-[11px]">
                          <SavingsTypeIcon type={item.type} className="w-3 h-3" />
                          <span>{item.type}</span>
                        </span>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {item.date}
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-teal-600 dark:text-teal-400 text-sm whitespace-nowrap">
                      +{formatINR(item.amount)}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {item.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100/60 dark:border-neutral-800">
                    <button
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900/40 text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-700">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Investment Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {monthSavingsList.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                      <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                        {item.date}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-medium">
                          <SavingsTypeIcon type={item.type} className="w-3.5 h-3.5" />
                          <span>{item.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-500 truncate max-w-xs">
                        {item.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-teal-600 dark:text-teal-400 text-sm">
                        +{formatINR(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-2 text-neutral-400 hover:text-rose-600 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Investment' : 'Record Savings / Investment'}
        subtitle="Track money allocated towards savings, mutual funds, or deposits"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Investment Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Parag Parikh Flexi Cap SIP, SBI FD 1 Year"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Investment Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm"
            >
              {SAVINGS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Auto-debit via Zerodha / Groww"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              Save Investment
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            deleteSaving(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Savings Record"
        message="Are you sure you want to delete this saving/investment entry? This will adjust your remaining monthly balance."
        confirmText="Delete"
      />
    </div>
  );
};
