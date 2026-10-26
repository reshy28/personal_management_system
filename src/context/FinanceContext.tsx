import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  db,
  onAuthStateChanged,
  loginWithFixedCredentials,
  logoutUser,
  isAuthorizedUserSession,
  FIXED_USER_EMAIL,
  FIXED_USER_ID,
  AppAuthUser,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../firebase';
import {
  Expense,
  SalaryRecord,
  Loan,
  EmiPayment,
  SavingRecord,
  BudgetRecord,
  UserProfile,
  UpcomingBill,
  FixedExpenseItem,
  DEFAULT_FIXED_EXPENSES,
  getMonthYearKey,
  getTodayDateStr,
} from '../types';

interface FinanceContextType {
  user: AppAuthUser | User | null;
  authLoading: boolean;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;

  userProfile: UserProfile | null;
  salaries: SalaryRecord[];
  expenses: Expense[];
  loans: Loan[];
  emiPayments: EmiPayment[];
  savings: SavingRecord[];
  budgets: BudgetRecord[];
  upcomingBills: UpcomingBill[];

  // Computed metrics for selected month
  currentSalaryRecord: SalaryRecord | null;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEmiPaid: number;
  monthlyEmiCommitment: number;
  monthlySavings: number;
  remainingBalance: number;
  totalOutstandingLoans: number;
  totalLoanAmountAll: number;
  totalLoanRepaidAll: number;
  savingsRate: number;
  todayExpenses: number;
  highestSpendingCategory: { category: string; amount: number } | null;

  // Fixed expenses configuration for Salary Management
  fixedExpenses: FixedExpenseItem[];
  includeFixedExpensesInSalary: boolean;
  fixedExpensesTotal: number;

  // Actions
  signInFixed: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;

  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateFixedExpenses: (items: FixedExpenseItem[]) => Promise<void>;
  toggleIncludeFixedExpenses: (include: boolean) => Promise<void>;
  saveSalaryRecord: (record: Omit<SalaryRecord, 'id' | 'userId'>, id?: string) => Promise<void>;
  saveExpense: (expense: Omit<Expense, 'id' | 'userId'>, id?: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  saveLoan: (loan: Omit<Loan, 'id' | 'userId'>, id?: string) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  payEmi: (loanId: string, amount: number, paymentDate: string, notes?: string) => Promise<void>;
  deleteEmiPayment: (id: string) => Promise<void>;
  saveSaving: (saving: Omit<SavingRecord, 'id' | 'userId'>, id?: string) => Promise<void>;
  deleteSaving: (id: string) => Promise<void>;
  saveBudget: (category: string, amount: number) => Promise<void>;
  deleteBudget: (category: string) => Promise<void>;
  saveUpcomingBill: (bill: Omit<UpcomingBill, 'id' | 'userId'>, id?: string) => Promise<void>;
  markBillPaid: (billId: string, isPaid: boolean) => Promise<void>;
  deleteUpcomingBill: (id: string) => Promise<void>;
  resetToDefaultDemoData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppAuthUser | User | null>(() => {
    if (isAuthorizedUserSession()) {
      return {
        uid: FIXED_USER_ID,
        email: FIXED_USER_EMAIL,
        displayName: 'Rasheed',
        emailVerified: true,
        isAnonymous: false,
      };
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthYearKey(new Date()));

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [emiPayments, setEmiPayments] = useState<EmiPayment[]>([]);
  const [savings, setSavings] = useState<SavingRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);

  // Listen to Auth State
  useEffect(() => {
    if (isAuthorizedUserSession()) {
      setUser((prev) =>
        prev || {
          uid: FIXED_USER_ID,
          email: FIXED_USER_EMAIL,
          displayName: 'Rasheed',
          emailVerified: true,
          isAnonymous: false,
        }
      );
      setAuthLoading(false);
      testConnection().catch(() => {});
    } else {
      setUser(null);
      setAuthLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!isAuthorizedUserSession()) {
          // If unverified session, clear
          await logoutUser();
          setUser(null);
        } else {
          setUser(currentUser);
        }
      } else {
        if (!isAuthorizedUserSession()) {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore documents when authenticated
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setSalaries([]);
      setExpenses([]);
      setLoans([]);
      setEmiPayments([]);
      setSavings([]);
      setBudgets([]);
      setUpcomingBills([]);
      return;
    }

    const uid = user.uid;

    // Profile listener
    const userDocRef = doc(db, 'users', uid);
    const unsubProfile = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as UserProfile);
        } else {
          // Initialize user profile with default salary ₹48,900
          const initialProfile: UserProfile = {
            userId: uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            defaultMonthlySalary: 48900,
            currency: 'INR',
            includeFixedExpensesInSalary: true,
            fixedExpenses: DEFAULT_FIXED_EXPENSES,
          };
          setDoc(userDocRef, initialProfile).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `users/${uid}`)
          );
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
    );

    // Salaries listener
    const salariesCol = collection(db, 'users', uid, 'salaries');
    const unsubSalaries = onSnapshot(
      salariesCol,
      (snapshot) => {
        const list: SalaryRecord[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as SalaryRecord));
        setSalaries(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/salaries`)
    );

    // Expenses listener
    const expensesCol = collection(db, 'users', uid, 'expenses');
    const unsubExpenses = onSnapshot(
      expensesCol,
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Expense));
        setExpenses(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/expenses`)
    );

    // Loans listener
    const loansCol = collection(db, 'users', uid, 'loans');
    const unsubLoans = onSnapshot(
      loansCol,
      (snapshot) => {
        const list: Loan[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Loan));
        setLoans(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/loans`)
    );

    // EMI Payments listener
    const emiCol = collection(db, 'users', uid, 'emiPayments');
    const unsubEmi = onSnapshot(
      emiCol,
      (snapshot) => {
        const list: EmiPayment[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as EmiPayment));
        setEmiPayments(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/emiPayments`)
    );

    // Savings listener
    const savingsCol = collection(db, 'users', uid, 'savings');
    const unsubSavings = onSnapshot(
      savingsCol,
      (snapshot) => {
        const list: SavingRecord[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as SavingRecord));
        setSavings(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/savings`)
    );

    // Budgets listener
    const budgetsCol = collection(db, 'users', uid, 'budgets');
    const unsubBudgets = onSnapshot(
      budgetsCol,
      (snapshot) => {
        const list: BudgetRecord[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as BudgetRecord));
        setBudgets(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/budgets`)
    );

    // Upcoming Bills listener
    const upcomingBillsCol = collection(db, 'users', uid, 'upcomingBills');
    const unsubUpcomingBills = onSnapshot(
      upcomingBillsCol,
      (snapshot) => {
        const list: UpcomingBill[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as UpcomingBill));
        setUpcomingBills(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/upcomingBills`)
    );

    return () => {
      unsubProfile();
      unsubSalaries();
      unsubExpenses();
      unsubLoans();
      unsubEmi();
      unsubSavings();
      unsubBudgets();
      unsubUpcomingBills();
    };
  }, [user]);

  // Auth actions
  const signInFixed = async (email: string, pass: string) => {
    const authUser = await loginWithFixedCredentials(email, pass);
    setUser(authUser);
  };

  const signInGoogle = async () => {
    throw new Error('Google sign-in is disabled. Please enter your authorized email and password.');
  };

  const signInGuest = async () => {
    throw new Error('Demo login is disabled. Please enter your authorized email and password.');
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
  };

  // Seed sample starter data if user is new and has no salary or expenses yet
  const resetToDefaultDemoData = async () => {
    if (!user) return;
    const uid = user.uid;
    const currentMonth = getMonthYearKey();
    const today = getTodayDateStr();

    // 1. Profile with default ₹48,900
    await setDoc(doc(db, 'users', uid), {
      userId: uid,
      email: user.email || '',
      displayName: user.displayName || 'Personal Account',
      defaultMonthlySalary: 48900,
      currency: 'INR',
      includeFixedExpensesInSalary: true,
      fixedExpenses: DEFAULT_FIXED_EXPENSES,
    });

    // 2. Initial Salary Record for current month
    const salaryId = `sal_${currentMonth}`;
    await setDoc(doc(db, 'users', uid, 'salaries', salaryId), {
      userId: uid,
      monthYear: currentMonth,
      baseSalary: 48900,
      receivedDate: `${currentMonth}-01`,
      bonusIncome: 0,
      freelanceIncome: 2500,
      otherIncome: 0,
      totalIncome: 51400,
      notes: 'Monthly salary credited + side project payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Active Loan (e.g. Two Wheeler / Bike Loan)
    const loanId = 'loan_bike_01';
    await setDoc(doc(db, 'users', uid, 'loans', loanId), {
      userId: uid,
      loanName: 'Two Wheeler (Bike Loan)',
      provider: 'HDFC Bank',
      originalAmount: 85000,
      tenureMonths: 36,
      emiAmount: 2850,
      startDate: '2025-06-10',
      endDate: '2028-06-10',
      paidEmisCount: 16,
      outstandingPrincipal: 52400,
      nextDueDate: `${currentMonth}-10`,
      status: 'Active',
      notes: 'Purchased Honda Shine, auto-debit on 10th',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 4. Sample Expenses
    const sampleExpenses = [
      {
        name: 'House Rent',
        amount: 12000,
        category: 'Rent',
        date: `${currentMonth}-02`,
        monthYear: currentMonth,
        paymentMethod: 'UPI',
        notes: 'Monthly flat rent paid via GPay',
      },
      {
        name: 'Supermarket Grocery & Dairy',
        amount: 3450,
        category: 'Food',
        date: `${currentMonth}-05`,
        monthYear: currentMonth,
        paymentMethod: 'UPI',
        notes: 'Monthly essentials from DMart',
      },
      {
        name: 'Bike Petrol Refill',
        amount: 950,
        category: 'Petrol / Transportation',
        date: today,
        monthYear: currentMonth,
        paymentMethod: 'Cash',
        notes: 'Full tank at IndianOil',
      },
      {
        name: 'Electricity & Broadband Bill',
        amount: 1450,
        category: 'Bills and Utilities',
        date: `${currentMonth}-08`,
        monthYear: currentMonth,
        paymentMethod: 'Debit Card',
        notes: 'Fiber internet & power bill',
      },
      {
        name: 'Family Medical checkup & medicines',
        amount: 1100,
        category: 'Medical',
        date: `${currentMonth}-12`,
        monthYear: currentMonth,
        paymentMethod: 'UPI',
        notes: 'Monthly wellness medicines',
      },
    ];

    for (let i = 0; i < sampleExpenses.length; i++) {
      const exp = sampleExpenses[i];
      const id = `exp_init_${i + 1}`;
      await setDoc(doc(db, 'users', uid, 'expenses', id), {
        ...exp,
        userId: uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 5. Sample Investment
    const savingId = 'saving_sip_01';
    await setDoc(doc(db, 'users', uid, 'savings', savingId), {
      userId: uid,
      name: 'Nifty 50 Index Mutual Fund SIP',
      amount: 5000,
      date: `${currentMonth}-07`,
      monthYear: currentMonth,
      type: 'Mutual Fund',
      notes: 'Monthly auto-invest on 7th',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 6. Category Budgets
    const sampleBudgets = [
      { category: 'Rent', budgetAmount: 12000 },
      { category: 'Food', budgetAmount: 7000 },
      { category: 'Petrol / Transportation', budgetAmount: 2500 },
      { category: 'Bills and Utilities', budgetAmount: 2500 },
      { category: 'Shopping', budgetAmount: 3500 },
      { category: 'Medical', budgetAmount: 2000 },
      { category: 'Entertainment', budgetAmount: 2000 },
    ];

    for (const b of sampleBudgets) {
      const budgetDocId = `bgt_${currentMonth}_${b.category.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await setDoc(doc(db, 'users', uid, 'budgets', budgetDocId), {
        userId: uid,
        monthYear: currentMonth,
        category: b.category,
        budgetAmount: b.budgetAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 7. Sample Upcoming Recurring Bills (Rent, Credit Card, Utilities)
    const sampleBills = [
      {
        name: 'House Rent',
        category: 'Rent' as const,
        amount: 12000,
        dueDate: `${currentMonth}-05`,
        monthYear: currentMonth,
        isPaid: false,
      },
      {
        name: 'HDFC Credit Card Bill',
        category: 'Credit Card Payment' as const,
        amount: 4500,
        dueDate: `${currentMonth}-15`,
        monthYear: currentMonth,
        isPaid: false,
      },
      {
        name: 'Broadband & Electricity Bill',
        category: 'Bills and Utilities' as const,
        amount: 1450,
        dueDate: `${currentMonth}-08`,
        monthYear: currentMonth,
        isPaid: false,
      },
      {
        name: 'Water & Maintenance Charges',
        category: 'Bills and Utilities' as const,
        amount: 850,
        dueDate: `${currentMonth}-20`,
        monthYear: currentMonth,
        isPaid: false,
      },
    ];

    for (let i = 0; i < sampleBills.length; i++) {
      const bill = sampleBills[i];
      const billDocId = `bill_init_${i + 1}`;
      await setDoc(doc(db, 'users', uid, 'upcomingBills', billDocId), {
        ...bill,
        userId: uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Profile update
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, data, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateFixedExpenses = async (items: FixedExpenseItem[]) => {
    if (!user) return;
    try {
      await updateProfile({ fixedExpenses: items });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/fixedExpenses`);
    }
  };

  const toggleIncludeFixedExpenses = async (include: boolean) => {
    if (!user) return;
    try {
      await updateProfile({ includeFixedExpensesInSalary: include });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/includeFixedExpenses`);
    }
  };

  // Salary actions
  const saveSalaryRecord = async (
    record: Omit<SalaryRecord, 'id' | 'userId'>,
    id?: string
  ) => {
    if (!user) return;
    try {
      const salaryId = id || `sal_${record.monthYear}`;
      const totalIncome =
        (Number(record.baseSalary) || 0) +
        (Number(record.bonusIncome) || 0) +
        (Number(record.freelanceIncome) || 0) +
        (Number(record.otherIncome) || 0);

      const payload: Omit<SalaryRecord, 'id'> = {
        ...record,
        userId: user.uid,
        totalIncome,
        updatedAt: new Date().toISOString(),
        createdAt: record.createdAt || new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid, 'salaries', salaryId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/salaries`);
    }
  };

  // Expense actions
  const saveExpense = async (
    expense: Omit<Expense, 'id' | 'userId'>,
    id?: string
  ) => {
    if (!user) return;
    try {
      const expenseId = id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload: Omit<Expense, 'id'> = {
        ...expense,
        userId: user.uid,
        monthYear: expense.monthYear || expense.date.substring(0, 7),
        updatedAt: new Date().toISOString(),
        createdAt: expense.createdAt || new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid, 'expenses', expenseId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/expenses`);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/expenses/${id}`);
    }
  };

  // Loan actions
  const saveLoan = async (loan: Omit<Loan, 'id' | 'userId'>, id?: string) => {
    if (!user) return;
    try {
      const loanId = id || `loan_${Date.now()}`;
      const payload: Omit<Loan, 'id'> = {
        ...loan,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
        createdAt: loan.createdAt || new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid, 'loans', loanId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/loans`);
    }
  };

  const deleteLoan = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'loans', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/loans/${id}`);
    }
  };

  // Mark EMI as paid: creates an EMI payment transaction AND updates loan status & paid count
  const payEmi = async (loanId: string, amount: number, paymentDate: string, notes?: string) => {
    if (!user) return;
    try {
      const targetLoan = loans.find((l) => l.id === loanId);
      if (!targetLoan) return;

      const monthYear = paymentDate.substring(0, 7);
      const paymentId = `emi_pay_${Date.now()}`;

      // 1. Record EMI payment document
      const paymentPayload: Omit<EmiPayment, 'id'> = {
        userId: user.uid,
        loanId,
        loanName: targetLoan.loanName,
        amount,
        paymentDate,
        monthYear,
        notes: notes || `Monthly EMI installment for ${targetLoan.loanName}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid, 'emiPayments', paymentId), paymentPayload);

      // 2. Update loan installments paid and calculate next due date
      const updatedPaidCount = targetLoan.paidEmisCount + 1;
      const isCompleted = updatedPaidCount >= targetLoan.tenureMonths;

      // Deduct estimated principal portion or keep accurate outstanding
      // User can also edit exact outstanding separately anytime
      const nextDue = new Date(targetLoan.nextDueDate || paymentDate);
      nextDue.setMonth(nextDue.getMonth() + 1);
      const nextDueStr = nextDue.toISOString().substring(0, 10);

      await setDoc(
        doc(db, 'users', user.uid, 'loans', loanId),
        {
          paidEmisCount: updatedPaidCount,
          status: isCompleted ? 'Completed' : 'Active',
          nextDueDate: isCompleted ? '' : nextDueStr,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/emiPayments`);
    }
  };

  const deleteEmiPayment = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'emiPayments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/emiPayments/${id}`);
    }
  };

  // Savings actions
  const saveSaving = async (
    saving: Omit<SavingRecord, 'id' | 'userId'>,
    id?: string
  ) => {
    if (!user) return;
    try {
      const savingId = id || `sav_${Date.now()}`;
      const payload: Omit<SavingRecord, 'id'> = {
        ...saving,
        userId: user.uid,
        monthYear: saving.monthYear || saving.date.substring(0, 7),
        updatedAt: new Date().toISOString(),
        createdAt: saving.createdAt || new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid, 'savings', savingId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/savings`);
    }
  };

  const deleteSaving = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savings', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/savings/${id}`);
    }
  };

  // Budget actions
  const saveBudget = async (category: string, amount: number) => {
    if (!user) return;
    try {
      const budgetDocId = `bgt_${selectedMonth}_${category.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const payload: Omit<BudgetRecord, 'id'> = {
        userId: user.uid,
        monthYear: selectedMonth,
        category: category as any,
        budgetAmount: amount,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid, 'budgets', budgetDocId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/budgets`);
    }
  };

  const deleteBudget = async (category: string) => {
    if (!user) return;
    try {
      const budgetDocId = `bgt_${selectedMonth}_${category.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await deleteDoc(doc(db, 'users', user.uid, 'budgets', budgetDocId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/budgets`);
    }
  };

  // Upcoming Bills actions
  const saveUpcomingBill = async (
    bill: Omit<UpcomingBill, 'id' | 'userId'>,
    id?: string
  ) => {
    if (!user) return;
    try {
      const billId = id || `bill_${Date.now()}`;
      const payload: Omit<UpcomingBill, 'id'> = {
        ...bill,
        userId: user.uid,
        monthYear: bill.monthYear || bill.dueDate.substring(0, 7),
        updatedAt: new Date().toISOString(),
        createdAt: bill.createdAt || new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid, 'upcomingBills', billId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/upcomingBills`);
    }
  };

  const markBillPaid = async (billId: string, isPaid: boolean) => {
    if (!user) return;
    try {
      const bill = upcomingBills.find((b) => b.id === billId);
      if (!bill) return;

      const todayStr = getTodayDateStr();

      // 1. Update upcoming bill status
      await setDoc(
        doc(db, 'users', user.uid, 'upcomingBills', billId),
        {
          isPaid,
          paidDate: isPaid ? todayStr : '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Automatically record as an expense when paid so remaining balance is deducted instantly
      if (isPaid) {
        const expId = `exp_bill_${billId}_${Date.now()}`;
        await setDoc(doc(db, 'users', user.uid, 'expenses', expId), {
          userId: user.uid,
          name: bill.name,
          amount: Number(bill.amount) || 0,
          category: bill.category,
          date: todayStr,
          monthYear: selectedMonth,
          paymentMethod: 'UPI',
          isDebtSettlement: false,
          notes: `Paid upcoming bill: ${bill.name}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/upcomingBills`);
    }
  };

  const deleteUpcomingBill = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'upcomingBills', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/upcomingBills/${id}`);
    }
  };

  // -------------------------------------------------------------
  // Financial Calculations & Computed Metrics for Selected Month
  // -------------------------------------------------------------

  // Salary for selected month
  const currentSalaryRecord = useMemo(() => {
    const record = salaries.find((s) => s.monthYear === selectedMonth);
    if (record) return record;

    // Fallback if not explicitly recorded yet for this month:
    // User's default monthly salary (₹48,900)
    const base = userProfile?.defaultMonthlySalary ?? 48900;
    return {
      id: `fallback_${selectedMonth}`,
      userId: user?.uid || '',
      monthYear: selectedMonth,
      baseSalary: base,
      receivedDate: `${selectedMonth}-01`,
      bonusIncome: 0,
      freelanceIncome: 0,
      otherIncome: 0,
      totalIncome: base,
      notes: 'Standard default monthly salary',
    };
  }, [salaries, selectedMonth, userProfile]);

  const monthlyIncome = currentSalaryRecord ? currentSalaryRecord.totalIncome : 48900;

  // Monthly Expenses: Filter by selectedMonth.
  // Rule: Exclude isDebtSettlement items to prevent double-counting credit card bill payments!
  const monthlyExpensesList = useMemo(() => {
    return expenses.filter(
      (e) => (e.monthYear === selectedMonth || e.date.startsWith(selectedMonth)) && !e.isDebtSettlement
    );
  }, [expenses, selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    return monthlyExpensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthlyExpensesList]);

  // Today's expenses
  const todayExpenses = useMemo(() => {
    const todayStr = getTodayDateStr();
    return expenses
      .filter((e) => e.date === todayStr && !e.isDebtSettlement)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Monthly EMI Paid (Actual money out of pocket this month)
  const monthlyEmiPaid = useMemo(() => {
    return emiPayments
      .filter((p) => p.monthYear === selectedMonth || p.paymentDate.startsWith(selectedMonth))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [emiPayments, selectedMonth]);

  // Active Monthly EMI Commitment (Sum of active scheduled EMIs)
  const monthlyEmiCommitment = useMemo(() => {
    return loans
      .filter((l) => l.status === 'Active')
      .reduce((sum, l) => sum + (Number(l.emiAmount) || 0), 0);
  }, [loans]);

  // Monthly Savings & Investments
  const monthlySavings = useMemo(() => {
    return savings
      .filter((s) => s.monthYear === selectedMonth || s.date.startsWith(selectedMonth))
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [savings, selectedMonth]);

  // Fixed Expenses configuration for Salary Management
  const fixedExpenses = useMemo(() => {
    return userProfile?.fixedExpenses ?? DEFAULT_FIXED_EXPENSES;
  }, [userProfile?.fixedExpenses]);

  const includeFixedExpensesInSalary = useMemo(() => {
    return userProfile?.includeFixedExpensesInSalary ?? true;
  }, [userProfile?.includeFixedExpensesInSalary]);

  const fixedExpensesTotal = useMemo(() => {
    if (!includeFixedExpensesInSalary) return 0;
    return fixedExpenses
      .filter((item) => item.enabled)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [fixedExpenses, includeFixedExpensesInSalary]);

  // Remaining Balance:
  // Remaining Balance = Total Income - Daily Expenses - Total Monthly EMI Paid - Total Savings / Investments
  const remainingBalance = useMemo(() => {
    return monthlyIncome - monthlyExpenses - monthlyEmiPaid - monthlySavings;
  }, [monthlyIncome, monthlyExpenses, monthlyEmiPaid, monthlySavings]);

  // Total Outstanding Loans principal
  const totalOutstandingLoans = useMemo(() => {
    return loans
      .filter((l) => l.status === 'Active')
      .reduce((sum, l) => sum + (Number(l.outstandingPrincipal) || 0), 0);
  }, [loans]);

  // Total Original Loan Amount across ALL loans
  const totalLoanAmountAll = useMemo(() => {
    return loans.reduce((sum, l) => sum + (Number(l.originalAmount) || 0), 0);
  }, [loans]);

  // Total Loan Amount Repaid across all loans
  const totalLoanRepaidAll = useMemo(() => {
    return Math.max(0, totalLoanAmountAll - totalOutstandingLoans);
  }, [totalLoanAmountAll, totalOutstandingLoans]);

  // Savings rate percentage
  const savingsRate = useMemo(() => {
    if (!monthlyIncome || monthlyIncome <= 0) return 0;
    return Math.min(100, Math.round((monthlySavings / monthlyIncome) * 100));
  }, [monthlyIncome, monthlySavings]);

  // Highest spending category
  const highestSpendingCategory = useMemo(() => {
    if (monthlyExpensesList.length === 0) return null;
    const catMap: Record<string, number> = {};
    for (const exp of monthlyExpensesList) {
      catMap[exp.category] = (catMap[exp.category] || 0) + (Number(exp.amount) || 0);
    }
    let maxCat = '';
    let maxAmount = 0;
    for (const [cat, amt] of Object.entries(catMap)) {
      if (amt > maxAmount) {
        maxAmount = amt;
        maxCat = cat;
      }
    }
    return maxCat ? { category: maxCat, amount: maxAmount } : null;
  }, [monthlyExpensesList]);

  return (
    <FinanceContext.Provider
      value={{
        user,
        authLoading,
        selectedMonth,
        setSelectedMonth,
        userProfile,
        salaries,
        expenses,
        loans,
        emiPayments,
        savings,
        budgets,
        upcomingBills,
        currentSalaryRecord,
        monthlyIncome,
        monthlyExpenses,
        monthlyEmiPaid,
        monthlyEmiCommitment,
        monthlySavings,
        remainingBalance,
        totalOutstandingLoans,
        totalLoanAmountAll,
        totalLoanRepaidAll,
        savingsRate,
        todayExpenses,
        highestSpendingCategory,
        fixedExpenses,
        includeFixedExpensesInSalary,
        fixedExpensesTotal,
        signInFixed,
        signInGoogle,
        signInGuest,
        signOut: handleSignOut,
        updateProfile,
        updateFixedExpenses,
        toggleIncludeFixedExpenses,
        saveSalaryRecord,
        saveExpense,
        deleteExpense,
        saveLoan,
        deleteLoan,
        payEmi,
        deleteEmiPayment,
        saveSaving,
        deleteSaving,
        saveBudget,
        deleteBudget,
        saveUpcomingBill,
        markBillPaid,
        deleteUpcomingBill,
        resetToDefaultDemoData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
