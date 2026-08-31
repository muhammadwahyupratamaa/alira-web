export interface MetricComparison {
  previous: string;
  percentageChange: string | null;
}

export interface DashboardSummary {
  month: number;
  year: number;
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpense: string;
  netSaving: string;
  incomeComparison: MetricComparison;
  expenseComparison: MetricComparison;
  netSavingComparison: MetricComparison;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: unknown;
  color: unknown;
  total: string;
  percentage: string;
}

export interface CategoryBreakdown {
  month: number;
  year: number;
  type: 'INCOME' | 'EXPENSE';
  total: string;
  data: CategoryBreakdownItem[];
}

export interface RecentTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  transactionDate: string;
  note: unknown;
  createdAt: string;
  account: {
    id: string;
    name: string;
    type: 'CASH' | 'BANK' | 'EWALLET';
  };
  category: {
    id: string;
    name: string;
    icon: unknown;
    color: unknown;
  };
}

export interface DashboardPeriod {
  month: number;
  year: number;
}

export type CashFlowGranularity = 'day' | 'week' | 'month';

export interface CashFlowBucket {
  label: string;
  income: string;
  expense: string;
}

export interface CashFlowResponse {
  from: string;
  to: string;
  granularity: CashFlowGranularity;
  data: CashFlowBucket[];
}
