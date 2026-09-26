export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Error body returned by the API
export interface ApiErrorBody {
  message: string;
  details?: Record<string, string[] | undefined>;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface MonthTotals {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface DashboardSummary extends MonthTotals {
  totalBalance: number;
  previousMonth: MonthTotals;
}

export interface EvolutionPoint extends MonthTotals {
  closingBalance: number;
}

export interface CategoryShare {
  categoryId: string | null;
  name: string;
  color: string;
  icon: string;
  total: number;
  count: number;
  percentage: number;
}

export interface CategoryBreakdown {
  type: TransactionType;
  startDate: string;
  endDate: string;
  total: number;
  categories: CategoryShare[];
}

export type AccountType =
  'WALLET' | 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  balance: number;
  color: string;
  archived: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  _count: { transactions: number };
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes: string | null;
  recurringTransactionId: string | null;
  account: { id: string; name: string; color: string; type: AccountType };
  category: { id: string; name: string; color: string; icon: string } | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TransactionList {
  data: Transaction[];
  meta: PaginationMeta;
  summary: { income: number; expense: number; balance: number };
}

export type BudgetStatus = 'OK' | 'WARNING' | 'EXCEEDED';

export interface Budget {
  id: string;
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  category: { id: string; name: string; color: string; icon: string };
}

export interface BudgetList {
  month: string;
  data: Budget[];
  summary: {
    totalLimit: number;
    totalSpent: number;
    remaining: number;
    percentage: number;
    status: BudgetStatus;
    unbudgetedSpent: number;
  };
}

export type GoalStatus = 'COMPLETED' | 'ON_TRACK' | 'BEHIND' | 'OVERDUE' | 'NO_DEADLINE';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: string;
  icon: string;
  progress: {
    percentage: number;
    remaining: number;
    completed: boolean;
    status: GoalStatus;
    daysLeft: number | null;
    monthlyNeeded: number | null;
    expectedAmount: number | null;
  };
}

export interface GoalList {
  data: Goal[];
  summary: {
    count: number;
    completed: number;
    totalTarget: number;
    totalSaved: number;
    percentage: number;
  };
}
