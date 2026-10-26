import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Loan,
  formatINR,
  getTodayDateStr,
  getMonthDisplay,
  EmiPayment,
  getNextDueDateFromDay,
} from '../types';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building2,
  Clock,
  Check,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';

export const LoansPage: React.FC = () => {
  const {
    loans,
    emiPayments,
    selectedMonth,
    monthlyEmiCommitment,
    monthlyEmiPaid,
    totalOutstandingLoans,
    saveLoan,
    deleteLoan,
    payEmi,
    deleteEmiPayment,
  } = useFinance();

  // Active vs Completed
  const [activeTab, setActiveTab] = useState<'loans' | 'history'>('loans');

  // Modals
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null);

  // Pay EMI modal
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(getTodayDateStr());
  const [payNotes, setPayNotes] = useState('');

  // Form states for Loan Modal - strictly:
  // 1. Bike Name
  // 2. Monthly EMI
  // 3. EMIs Already Paid
  // 4. Outstanding Principal
  // 5. Start Date
  // 6. Every Month EMI Day
  const [bikeName, setBikeName] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [paidEmisCount, setPaidEmisCount] = useState('0');
  const [outstandingPrincipal, setOutstandingPrincipal] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateStr());
  const [emiDay, setEmiDay] = useState('5');
  const [formError, setFormError] = useState('');

  const openAddLoanModal = () => {
    setEditingLoan(null);
    setBikeName('');
    setEmiAmount('');
    setPaidEmisCount('0');
    setOutstandingPrincipal('');
    setStartDate(getTodayDateStr());
    setEmiDay('5');
    setFormError('');
    setIsLoanModalOpen(true);
  };

  const openEditLoanModal = (loan: Loan) => {
    setEditingLoan(loan);
    setBikeName(loan.loanName);
    setEmiAmount(loan.emiAmount.toString());
    setPaidEmisCount(loan.paidEmisCount.toString());
    setOutstandingPrincipal(loan.outstandingPrincipal.toString());
    setStartDate(loan.startDate || getTodayDateStr());
    setEmiDay((loan.emiDay || (loan.nextDueDate ? parseInt(loan.nextDueDate.slice(8, 10), 10) : 5)).toString());
    setFormError('');
    setIsLoanModalOpen(true);
  };

  const handleSaveLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bikeName.trim()) {
      setFormError('Please enter the Bike Name (e.g. Yamaha MT-15, Royal Enfield)');
      return;
    }
    const emi = parseFloat(emiAmount);
    const paid = parseInt(paidEmisCount, 10) || 0;
    const outPrincipal = parseFloat(outstandingPrincipal);
    const day = parseInt(emiDay, 10) || 5;

    if (isNaN(emi) || emi <= 0) {
      setFormError('Please enter a valid Monthly EMI amount');
      return;
    }
    if (isNaN(outPrincipal) || outPrincipal < 0) {
      setFormError('Please enter valid Outstanding Principal amount');
      return;
    }
    if (day < 1 || day > 31) {
      setFormError('Please enter a valid EMI day between 1 and 31');
      return;
    }

    const calculatedOrig = outPrincipal + paid * emi;
    const estimatedTenure = paid + Math.max(1, Math.ceil(outPrincipal / (emi || 1)));
    const computedNextDueDate = getNextDueDateFromDay(day);

    try {
      await saveLoan(
        {
          loanName: bikeName.trim(),
          provider: 'Bike Loan',
          originalAmount: calculatedOrig,
          tenureMonths: estimatedTenure,
          emiAmount: emi,
          startDate,
          endDate: '',
          paidEmisCount: paid,
          outstandingPrincipal: outPrincipal,
          emiDay: day,
          nextDueDate: computedNextDueDate,
          status: outPrincipal <= 0 ? 'Completed' : 'Active',
          notes: `EMI Day: ${day}th of every month`,
        },
        editingLoan?.id
      );
      setIsLoanModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save loan record');
    }
  };

  const openPayEmiModal = (loan: Loan) => {
    setPayingLoan(loan);
    setPayAmount(loan.emiAmount.toString());
    setPayDate(getTodayDateStr());
    setPayNotes(`EMI payment for ${loan.loanName}`);
  };

  const handleConfirmPayEmi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingLoan) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    await payEmi(payingLoan.id, amount, payDate, payNotes);
    setPayingLoan(null);
  };

  const today = new Date().toISOString().substring(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Monthly EMI Commitment */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Monthly EMI Commitment
          </span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatINR(monthlyEmiCommitment)}/mo
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Sum of scheduled installments across active loans
          </p>
        </div>

        {/* EMI Paid this month */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            EMI Paid in {getMonthDisplay(selectedMonth)}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(monthlyEmiPaid)}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Actual payment debited to date this month
          </p>
        </div>

        {/* Total Outstanding Loan Balance */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Total Outstanding Principal
          </span>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-1">
            {formatINR(totalOutstandingLoans)}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Exact remaining loan balances across all banks
          </p>
        </div>
      </div>

      {/* Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'loans'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Loan Accounts ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Payment History ({emiPayments.length})
          </button>
        </div>

        <button
          onClick={openAddLoanModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Loan / EMI</span>
        </button>
      </div>

      {/* Loan Accounts View */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-12 text-center border border-neutral-200 dark:border-neutral-700">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                No Loans or EMIs Recorded
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                You are currently debt-free. If you have a bike loan, smartphone EMI, or personal loan, add it to monitor monthly installments and outstanding balances.
              </p>
              <button
                onClick={openAddLoanModal}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
              >
                Add Your First Loan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {loans.map((loan) => {
                const percentPaid = Math.min(
                  100,
                  Math.round((loan.paidEmisCount / loan.tenureMonths) * 100)
                );
                const remainingMonths = Math.max(0, loan.tenureMonths - loan.paidEmisCount);
                const estimatedRemainingPayments = remainingMonths * loan.emiAmount;
                const isOverdue =
                  loan.nextDueDate && loan.status === 'Active' && loan.nextDueDate < today;
                const isDueSoon =
                  loan.nextDueDate &&
                  loan.status === 'Active' &&
                  !isOverdue &&
                  new Date(loan.nextDueDate).getTime() - new Date().getTime() <= 5 * 86400000;

                return (
                  <div
                    key={loan.id}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Header */}
                      {/* Header: Bike Name & Monthly EMI */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-neutral-900 dark:text-white truncate">
                              {loan.loanName}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                loan.status === 'Active'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {loan.paidEmisCount} EMIs Already Paid
                            </span>
                            <span>•</span>
                            <span>EMI Day: {loan.emiDay || (loan.nextDueDate ? parseInt(loan.nextDueDate.slice(8, 10), 10) : 5)}th</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                            {formatINR(loan.emiAmount)}
                          </div>
                          <span className="text-[10px] text-neutral-400 font-medium uppercase">
                            Monthly EMI
                          </span>
                        </div>
                      </div>

                      {/* Outstanding Principal & EMIs Already Paid */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-xl p-3 grid grid-cols-2 gap-3 mb-3 text-xs border border-neutral-100 dark:border-neutral-800">
                        <div>
                          <span className="text-neutral-400 font-medium block text-[11px]">
                            Outstanding Principal
                          </span>
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-base">
                            {formatINR(loan.outstandingPrincipal)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-400 font-medium block text-[11px]">
                            EMIs Already Paid
                          </span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 text-base">
                            {loan.paidEmisCount} Paid
                          </span>
                        </div>
                      </div>

                      {/* Dates strip: Start Date, Every Month EMI Day, and Next EMI Date */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/40 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs mb-3 border border-neutral-100 dark:border-neutral-800">
                        <div>
                          <span className="text-[10px] text-neutral-400 block font-medium">Start Date</span>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono text-[11px]">
                            {loan.startDate || 'N/A'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-neutral-400 block font-medium">EMI Day</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                            Day {loan.emiDay || (loan.nextDueDate ? parseInt(loan.nextDueDate.slice(8, 10), 10) : 5)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 block font-medium">Next Due</span>
                          <span
                            className={`font-bold font-mono text-[11px] ${
                              isOverdue
                                ? 'text-rose-600 dark:text-rose-400'
                                : isDueSoon
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {loan.nextDueDate || 'Completed'}
                          </span>
                        </div>
                      </div>

                      {/* Next Due Date Alert if overdue or due soon */}
                      {loan.status === 'Active' && loan.nextDueDate && (isOverdue || isDueSoon) && (
                        <div
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium mb-3 ${
                            isOverdue
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isOverdue ? (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <span>
                              {isOverdue ? 'Payment Overdue! Due on ' : 'Due soon: '}
                              {loan.nextDueDate}
                            </span>
                          </div>
                          {isOverdue && <span className="font-bold text-[10px] uppercase">Urgent</span>}
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                          <span>
                            {loan.paidEmisCount} of {loan.tenureMonths} EMIs Paid
                          </span>
                          <span>{percentPaid}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                      </div>

                      {loan.notes && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic mb-4">
                          Note: {loan.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-700/60">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditLoanModal(loan)}
                          className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 min-w-[38px] min-h-[38px] flex items-center justify-center transition"
                          title="Edit Loan Details"
                          aria-label={`Edit ${loan.loanName}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingLoanId(loan.id)}
                          className="p-2 text-neutral-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 min-w-[38px] min-h-[38px] flex items-center justify-center transition"
                          title="Delete Loan"
                          aria-label={`Delete ${loan.loanName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {loan.status === 'Active' && (
                        <button
                          onClick={() => openPayEmiModal(loan)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition min-h-[38px]"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Mark EMI Paid</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Payment History View */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base">
              Recorded EMI Payments ({emiPayments.length})
            </h3>
            <span className="text-xs text-neutral-500">
              Payment log
            </span>
          </div>

          {emiPayments.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500 px-4">
              No EMI payments recorded yet. Click "Mark EMI Paid" on any active loan to log an installment payment.
            </div>
          ) : (
            <>
              {/* Mobile Cards for History (< sm) */}
              <div className="block sm:hidden divide-y divide-neutral-100 dark:divide-neutral-700/60 p-2">
                {emiPayments
                  .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
                  .map((p) => (
                    <div key={p.id} className="py-3 px-2 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white block truncate">
                          {p.loanName}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                          Paid on {p.paymentDate}
                        </span>
                        {p.notes && (
                          <span className="text-[10px] text-neutral-500 italic block truncate mt-0.5">{p.notes}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-xs text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {formatINR(p.amount)}
                        </span>
                        <button
                          onClick={() => deleteEmiPayment(p.id)}
                          aria-label="Delete Payment Record"
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Desktop Table (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-900/40 text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-700">
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Loan Account</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Amount Paid</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                    {emiPayments
                      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                          <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                            {p.paymentDate}
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                            {p.loanName}
                          </td>
                          <td className="py-3 px-4 text-neutral-500 truncate max-w-xs">
                            {p.notes || '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                            {formatINR(p.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => deleteEmiPayment(p.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 min-w-[32px] min-h-[32px] flex items-center justify-center mx-auto"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Loan Add/Edit Modal */}
      <Modal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        title={editingLoan ? 'Edit Bike Loan / EMI' : 'Add Bike Loan / EMI'}
        subtitle="Enter your bike loan installment and outstanding principal details"
      >
        <form onSubmit={handleSaveLoanSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {formError}
            </div>
          )}

          {/* 1. Bike Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Bike Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Enfield Classic 350, Yamaha MT-15, Honda CB350"
              value={bikeName}
              onChange={(e) => setBikeName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-semibold text-neutral-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  step="any"
                  placeholder="e.g. 4500"
                  value={emiAmount}
                  onChange={(e) => setEmiAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-bold text-indigo-600 dark:text-indigo-400"
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
                step="1"
                placeholder="e.g. 6"
                value={paidEmisCount}
                onChange={(e) => setPaidEmisCount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-semibold text-neutral-900 dark:text-white"
              />
              <span className="text-[10px] text-neutral-400 block mt-1">
                Number of monthly installments completed
              </span>
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
                step="any"
                placeholder="e.g. 68000"
                value={outstandingPrincipal}
                onChange={(e) => setOutstandingPrincipal(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-bold text-emerald-700 dark:text-emerald-400"
              />
            </div>
            <span className="text-[10px] text-neutral-400 block mt-1">
              Remaining loan balance directly shown and tracked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 5. Start Date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-semibold text-neutral-900 dark:text-white"
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
                step="1"
                placeholder="e.g. 5"
                value={emiDay}
                onChange={(e) => setEmiDay(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-bold text-neutral-900 dark:text-white"
              />
              <span className="text-[10px] text-neutral-400 block mt-1">
                E.g. 5th, 10th, or 15th of every month
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setIsLoanModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              {editingLoan ? 'Update Loan' : 'Save Loan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay EMI Modal */}
      {payingLoan && (
        <Modal
          isOpen={!!payingLoan}
          onClose={() => setPayingLoan(null)}
          title={`Record EMI Payment: ${payingLoan.loanName}`}
          subtitle={`Log actual payment of ${formatINR(payingLoan.emiAmount)} for ${payingLoan.provider}`}
        >
          <form onSubmit={handleConfirmPayEmi} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm"
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
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm"
              />
            </div>

            <p className="text-[11px] text-neutral-500 leading-normal">
              Recording this payment will add an EMI transaction for {payDate.substring(0, 7)}, increase your paid installment count to {payingLoan.paidEmisCount + 1}, and update your remaining monthly balance.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setPayingLoan(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl"
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingLoanId}
        onClose={() => setDeletingLoanId(null)}
        onConfirm={() => {
          if (deletingLoanId) {
            deleteLoan(deletingLoanId);
            setDeletingLoanId(null);
          }
        }}
        title="Delete Loan Account"
        message="Are you sure you want to delete this loan record? This will remove its EMI commitment and outstanding balance from your personal dashboard."
        confirmText="Delete Loan"
      />
    </div>
  );
};
