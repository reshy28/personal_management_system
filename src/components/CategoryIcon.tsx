import React from 'react';
import {
  Home,
  Utensils,
  Fuel,
  ShoppingBag,
  Zap,
  HeartPulse,
  Film,
  CreditCard,
  Users,
  Layers,
  PiggyBank,
  TrendingUp,
  Landmark,
  ShieldAlert,
  Wallet,
  Briefcase,
} from 'lucide-react';
import { ExpenseCategory, SavingsType } from '../types';

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  'Fixed Expenses': { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', ring: 'ring-teal-500/20' },
  Rent: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
  Food: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
  'Petrol / Transportation': { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-500/20' },
  Shopping: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500/20' },
  'Bills and Utilities': { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-500/20' },
  Medical: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/20' },
  Entertainment: { bg: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-600 dark:text-pink-400', ring: 'ring-pink-500/20' },
  'Credit Card Payment': { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-500/20' },
  'Family Expenses': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
  Other: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', ring: 'ring-neutral-500/20' },
};

export const CategoryIcon: React.FC<{ category: ExpenseCategory | string; className?: string }> = ({
  category,
  className = 'w-4 h-4',
}) => {
  switch (category) {
    case 'Fixed Expenses':
      return <Landmark className={className} />;
    case 'Rent':
      return <Home className={className} />;
    case 'Food':
      return <Utensils className={className} />;
    case 'Petrol / Transportation':
      return <Fuel className={className} />;
    case 'Shopping':
      return <ShoppingBag className={className} />;
    case 'Bills and Utilities':
      return <Zap className={className} />;
    case 'Medical':
      return <HeartPulse className={className} />;
    case 'Entertainment':
      return <Film className={className} />;
    case 'Credit Card Payment':
      return <CreditCard className={className} />;
    case 'Family Expenses':
      return <Users className={className} />;
    default:
      return <Layers className={className} />;
  }
};

export const SavingsTypeIcon: React.FC<{ type: SavingsType | string; className?: string }> = ({
  type,
  className = 'w-4 h-4',
}) => {
  switch (type) {
    case 'Savings Account':
      return <Landmark className={className} />;
    case 'Recurring Deposit (RD)':
      return <PiggyBank className={className} />;
    case 'Fixed Deposit (FD)':
      return <Briefcase className={className} />;
    case 'Mutual Fund':
      return <TrendingUp className={className} />;
    case 'Emergency Fund':
      return <ShieldAlert className={className} />;
    default:
      return <Wallet className={className} />;
  }
};
