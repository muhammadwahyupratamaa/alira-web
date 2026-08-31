import { useQuery } from '@tanstack/react-query';

import { getCashFlow } from './dashboard.api';
import { cashFlowRange } from './dashboard-formatters';
import type { DashboardPeriod } from './dashboard.types';

export function useCashFlow(period: DashboardPeriod) {
  const range = cashFlowRange(period);
  return useQuery({
    queryKey: ['dashboard', 'cash-flow', range],
    queryFn: () => getCashFlow(range),
  });
}
