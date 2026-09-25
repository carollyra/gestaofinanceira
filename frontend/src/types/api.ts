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
