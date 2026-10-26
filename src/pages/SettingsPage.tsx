import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR } from '../types';
import {
  Settings as SettingsIcon,
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
} from 'lucide-react';

interface SettingsPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ isDark, onToggleDark }) => {
  const {
    user,
    userProfile,
    updateProfile,
    resetToDefaultDemoData,
    signOut,
  } = useFinance();

  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || user?.displayName || 'Personal Account'
  );
  const [defaultSalary, setDefaultSalary] = useState(
    userProfile?.defaultMonthlySalary?.toString() || '48900'
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const sal = parseFloat(defaultSalary);
    if (!isNaN(sal) && sal > 0) {
      await updateProfile({
        displayName: displayName.trim(),
        defaultMonthlySalary: sal,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile & Default Salary Settings */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-700 mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                Personal Profile &amp; Default Salary
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Configure your default salary of ₹48,900 and account details
              </p>
            </div>
          </div>

          {isSaved && (
            <div className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
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
                Default Monthly Salary (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  value={defaultSalary}
                  onChange={(e) => setDefaultSalary(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-bold bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Standard baseline salary for your monthly cashflow
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Email / Auth ID
              </label>
              <input
                type="text"
                disabled
                value={user?.email || `Guest (${user?.uid?.substring(0, 8)}...)`}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs bg-neutral-100 dark:bg-neutral-900/50 text-neutral-500 cursor-not-allowed"
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
              <span className="text-[11px] text-neutral-400 mt-1 block">
                RupeeTrack strictly operates in Indian Rupees (INR - ₹).
              </span>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center"
            >
              Update Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Appearance & Dark Mode */}
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
          className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xl text-xs font-semibold text-neutral-800 dark:text-white transition flex items-center justify-center"
        >
          {isDark ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </div>

      {/* Database & Sample Data */}
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
              Seeds ₹48,900 monthly salary, an active Bike Loan EMI of ₹2,850, sample daily grocery/fuel expenses, and mutual fund SIP.
            </span>
          </div>

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-xl text-xs font-semibold shrink-0 transition"
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

      {/* Sign Out */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
            Sign Out
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Sign out of this session. Your records remain safe in your Firestore account.
          </p>
        </div>

        <button
          onClick={signOut}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 rounded-xl text-xs font-semibold transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
