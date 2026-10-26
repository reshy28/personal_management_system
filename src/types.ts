export type PaymentMethod = 'Cash' | 'UPI' | 'Debit Card' | 'Credit Card' | 'Other';

export const EXPENSE_CATEGORIES = [
  'Fixed Expenses',
  'Rent',
  'Food',
  'Petrol / Transportation',
  'Shopping',
  'Bills and Utilities',
  'Medical',
  'Entertainment',
  'Credit Card Payment',
  'Family Expenses',
  'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const SAVINGS_TYPES = [
  'Savings Account',
  'Recurring Deposit (RD)',
  'Fixed Deposit (FD)',
  'Mutual Fund',
  'Emergency Fund',
  'Other Investment',
] as const;

export type SavingsType = typeof SAVINGS_TYPES[number];

export interface Expense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  monthYear: string; // YYYY-MM
  paymentMethod: PaymentMethod;
  isDebtSettlement?: boolean; // If true, for CC payment settlement to avoid double counting
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryRecord {
  id: string;
  userId: string;
  monthYear: string; // YYYY-MM
  baseSalary: number; // Defaults to 48900
  receivedDate: string; // YYYY-MM-DD
  bonusIncome: number;
  freelanceIncome: number;
  otherIncome: number;
  totalIncome: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Loan {
  id: string;
  userId: string;
  loanName: string;
  provider: string;
  originalAmount: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  paidEmisCount: number;
  outstandingPrincipal: number; // Stored separately from emi * remaining
  nextDueDate: string; // YYYY-MM-DD
  emiDay?: number; // Day of month (1-31)
  status: 'Active' | 'Completed';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmiPayment {
  id: string;
  userId: string;
  loanId: string;
  loanName: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  monthYear: string; // YYYY-MM
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavingRecord {
  id: string;
  userId: string;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  monthYear: string; // YYYY-MM
  type: SavingsType;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetRecord {
  id: string;
  userId: string;
  monthYear: string; // YYYY-MM
  category: ExpenseCategory;
  budgetAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpcomingBill {
  id: string;
  userId: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  monthYear: string; // YYYY-MM
  isPaid: boolean;
  paidDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentDueStatus = 'paid' | 'overdue' | 'due_today' | 'due_soon' | 'upcoming';

export interface PaymentStatusInfo {
  status: PaymentDueStatus;
  label: string;
  diffDays: number;
  isReminder: boolean;
  badgeColor: string;
}

export function calculatePaymentStatus(dueDateStr: string, isPaid: boolean): PaymentStatusInfo {
  if (isPaid) {
    return {
      status: 'paid',
      label: 'Paid',
      diffDays: 0,
      isReminder: false,
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'overdue',
      label: `Overdue by ${Math.abs(diffDays)}d`,
      diffDays,
      isReminder: true,
      badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold',
    };
  } else if (diffDays === 0) {
    return {
      status: 'due_today',
      label: 'Due Today!',
      diffDays: 0,
      isReminder: true,
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-400 font-bold',
    };
  } else if (diffDays <= 5) {
    return {
      status: 'due_soon',
      label: `Reminder: Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
      diffDays,
      isReminder: true,
      badgeColor: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-semibold',
    };
  } else {
    return {
      status: 'upcoming',
      label: `Upcoming (${diffDays}d)`,
      diffDays,
      isReminder: false,
      badgeColor: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700',
    };
  }
}

export interface FixedExpenseItem {
  id: string;
  name: string; // e.g. 'Rent', 'Road', 'Home Help'
  amount: number;
  enabled: boolean; // Option to add or not add this fixed expense
  notes?: string;
}

export const DEFAULT_FIXED_EXPENSES: FixedExpenseItem[] = [
  { id: 'fx_rent', name: 'Rent', amount: 12000, enabled: true, notes: 'House rent' },
  { id: 'fx_road', name: 'Road', amount: 1500, enabled: true, notes: 'Fuel, tolls, transport & road expenses' },
  { id: 'fx_home_help', name: 'Home Help', amount: 2500, enabled: true, notes: 'Cook, maid & housekeeping assistance' },
];

export interface UserProfile {
  userId: string;
  email?: string;
  displayName?: string;
  defaultMonthlySalary: number;
  monthlyBudget?: number; // Target monthly expense budget limit
  currency: string;
  includeFixedExpensesInSalary?: boolean; // Option to add or not add fixed expenses in salary management
  fixedExpenses?: FixedExpenseItem[];
}

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absVal);

  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

export function getMonthYearKey(dateStr?: string | Date): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getMonthDisplay(monthYearStr: string): string {
  if (!monthYearStr) return '';
  const [yearStr, monthStr] = monthYearStr.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getNextDueDateFromDay(emiDay: number): string {
  const day = Math.min(Math.max(1, Number(emiDay) || 5), 31);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  let targetYear = currentYear;
  let targetMonth = currentMonth;

  if (currentDay > day) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  const maxDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const actualDay = Math.min(day, maxDaysInMonth);

  const mm = String(targetMonth + 1).padStart(2, '0');
  const dd = String(actualDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
}

export interface SalaryCalculatorItem {
  id: string;
  name: string;
  amount: number;
  reminderDate: string; // YYYY-MM-DD
  category?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}


