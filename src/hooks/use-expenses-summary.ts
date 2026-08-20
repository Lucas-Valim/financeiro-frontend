import { useQuery } from '@tanstack/react-query';
import { ExpensesApiService } from '../api/expenses-api';
import { ExpenseStatus } from '../constants/expenses';
import type { ExpenseFilter, ExpenseStatusSummary } from '../types/expenses';

const expensesApiService = new ExpensesApiService();

const EMPTY_SUMMARY_ITEM = {
  count: 0,
  total: 0,
  estimatedCount: 0,
  estimatedTotal: 0,
} as const;

const EMPTY_SUMMARY: ExpenseStatusSummary = {
  [ExpenseStatus.OPEN]: { ...EMPTY_SUMMARY_ITEM },
  [ExpenseStatus.OVERDUE]: { ...EMPTY_SUMMARY_ITEM },
  [ExpenseStatus.PAID]: { ...EMPTY_SUMMARY_ITEM },
  [ExpenseStatus.CANCELLED]: { ...EMPTY_SUMMARY_ITEM },
};

interface UseExpensesSummaryParams {
  filters?: ExpenseFilter;
}

interface UseExpensesSummaryReturn {
  summary: ExpenseStatusSummary;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches expense totals (count + amount) grouped by status for the current
 * filters. The status filter is intentionally dropped so the four status
 * buckets always reflect the whole period, regardless of which status card is
 * selected in the grid.
 */
export function useExpensesSummary({
  filters = {},
}: UseExpensesSummaryParams): UseExpensesSummaryReturn {
  const { status: _status, ...filtersWithoutStatus } = filters;

  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses-summary', filtersWithoutStatus],
    queryFn: () => expensesApiService.fetchExpensesSummary(filtersWithoutStatus),
  });

  return {
    summary: data ?? EMPTY_SUMMARY,
    isLoading,
    error: error as Error | null,
  };
}
