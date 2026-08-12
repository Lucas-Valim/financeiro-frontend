import { useQuery } from '@tanstack/react-query';
import { reportsApiService } from '../api/reports-api';
import type { ExpenseReportSummary, ReportFilter } from '../types/reports';

interface UseExpenseReportSummaryReturn {
  summary: ExpenseReportSummary | undefined;
  isLoading: boolean;
  error: Error | null;
}

// Short stale time: the summary must react to every filter change, so it is
// kept nearly fresh. The query key carries the filters, so a filter change is a
// new key and refetches on its own.
const SUMMARY_STALE_TIME = 30 * 1000;

export function useExpenseReportSummary(
  filters: ReportFilter
): UseExpenseReportSummaryReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['expense-report-summary', filters],
    queryFn: () => reportsApiService.fetchSummary(filters),
    staleTime: SUMMARY_STALE_TIME,
  });

  return {
    summary: data,
    isLoading,
    error: error as Error | null,
  };
}
