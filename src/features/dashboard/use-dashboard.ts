import { useQuery } from '@tanstack/react-query';

import {
  getDashboardSummary,
  getExpenseBreakdown,
  getRecentTransactions,
} from './dashboard.api';
import type { DashboardPeriod } from './dashboard.types';

export function useDashboard(period: DashboardPeriod) {
  const summary = useQuery({
    queryKey: ['dashboard', 'summary', period],
    queryFn: () => getDashboardSummary(period),
  });
  const breakdown = useQuery({
    queryKey: ['dashboard', 'category-breakdown', period, 'EXPENSE'],
    queryFn: () => getExpenseBreakdown(period),
  });
  const recent = useQuery({
    queryKey: ['dashboard', 'recent-transactions', 5],
    queryFn: getRecentTransactions,
  });

  const retry = async () => {
    await Promise.all([
      summary.refetch(),
      breakdown.refetch(),
      recent.refetch(),
    ]);
  };

  return {
    summary,
    breakdown,
    recent,
    isLoading: summary.isPending || breakdown.isPending || recent.isPending,
    isError: summary.isError || breakdown.isError || recent.isError,
    isRetrying:
      summary.isRefetching || breakdown.isRefetching || recent.isRefetching,
    isRefreshing:
      !summary.isPending &&
      !breakdown.isPending &&
      !recent.isPending &&
      (summary.isFetching || breakdown.isFetching || recent.isFetching),
    retry,
  };
}
