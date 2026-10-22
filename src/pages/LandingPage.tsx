import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Wallet,
  Receipt,
  CreditCard,
  PiggyBank,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatINR } from '../types';

export const LandingPage: React.FC = () => {
  const { signInGoogle, signInGuest } = useFinance();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    setAuthError('');
    try {
      await signInGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuest = async () => {
    setLoadingGuest(true);
    setAuthError('');
    try {
      await signInGuest();
    } catch (err: any) {
      setAuthError(err?.message || 'Guest sign-in failed.');
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/20">
            ₹
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">RupeeTrack</span>
            <span className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Personal Finance Management
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGuest}
            disabled={loadingGuest || loadingGoogle}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            {loadingGuest ? 'Starting...' : 'Instant Demo'}
          </button>
          <button
            onClick={handleGoogle}
            disabled={loadingGoogle || loadingGuest}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
          >
            {loadingGoogle ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-6 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tailored for Personal Indian Rupees (₹) Finance</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-3xl leading-tight">
          Master your <span className="text-emerald-600 dark:text-emerald-400">₹48,900 Salary</span>, Daily Expenses &amp; EMIs
        </h1>

        <p className="mt-4 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
          A clean, modern, and personal dashboard to keep track of every rupee spent, active loan installments, mutual fund savings, and monthly budgets with zero double-counting.
        </p>

        {authError && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl max-w-md">
            {authError}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <button
            onClick={handleGoogle}
            disabled={loadingGoogle || loadingGuest}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
          >
            <span>{loadingGoogle ? 'Connecting...' : 'Sign In with Google'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleGuest}
            disabled={loadingGoogle || loadingGuest}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-white font-semibold text-sm transition shadow-xs disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{loadingGuest ? 'Opening Demo...' : 'Try Demo as Guest'}</span>
          </button>
        </div>

        {/* Value Proposition Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* 1. Salary & Cashflow */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2">
              Salary &amp; Cashflow
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Default ₹48,900 monthly salary tracking with bonus, freelance income, and mathematical remaining balance after expenses.
            </p>
          </div>

          {/* 2. EMI & Loan Tracker */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2">
              Loan &amp; EMI Manager
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Monitor bike loans, smartphone EMIs, exact outstanding principal, next due date alerts, and mark monthly installments as paid.
            </p>
          </div>

          {/* 3. Budget Alerts & Savings */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-4">
              <PiggyBank className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2">
              Budgets &amp; Investments
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              80% warning alerts before you overspend. Track Mutual Funds, RDs, and FDs separately from consumption to see true wealth growth.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-neutral-200/80 dark:border-neutral-800 text-center text-xs text-neutral-500">
        RupeeTrack • Designed for Personal Finance &amp; EMI Management • All amounts in Indian Rupees (₹)
      </footer>
    </div>
  );
};
