import { authenticatedApiRequest } from '../../lib/api/api-client';
import type {
  CategoryBreakdown,
  DashboardPeriod,
  DashboardSummary,
  RecentTransaction,
} from './dashboard.types';

function periodQuery(period: DashboardPeriod): string {
  return new URLSearchParams({
    month: String(period.month),
    year: String(period.year),
  }).toString();
}

export function getDashboardSummary(
  period: DashboardPeriod,
): Promise<DashboardSummary> {
  return authenticatedApiRequest(`dashboard/summary?${periodQuery(period)}`);
}

export function getExpenseBreakdown(
  period: DashboardPeriod,
): Promise<CategoryBreakdown> {
  const query = new URLSearchParams({
    month: String(period.month),
    year: String(period.year),
    type: 'EXPENSE',
  });

  return authenticatedApiRequest(`dashboard/category-breakdown?${query}`);
}

export function getRecentTransactions(): Promise<RecentTransaction[]> {
  return authenticatedApiRequest('dashboard/recent-transactions?limit=5');
}
