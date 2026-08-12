import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useExpenseReportSummary } from '../use-expense-report-summary';
import { ExpenseStatus } from '../../constants/expenses';
import type { ExpenseReportSummary, ReportFilter } from '../../types/reports';

const mockFetchSummary = vi.hoisted(() => vi.fn());

vi.mock('../../api/reports-api', () => ({
  reportsApiService: {
    fetchSummary: mockFetchSummary,
    exportExpenses: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const baseSummary: ExpenseReportSummary = {
  expenseCount: 42,
  totalAmount: 12480,
  attachmentCount: 97,
  expensesWithoutAttachments: 3,
  exportLimit: 100,
  exceedsLimit: false,
};

describe('useExpenseReportSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSummary.mockResolvedValue(baseSummary);
  });

  it('returns the summary with isLoading false and error null on success', async () => {
    const { result } = renderHook(() => useExpenseReportSummary({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.summary).toEqual(baseSummary);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('refetches when the filters change (query key reacts to filters)', async () => {
    const initialFilters: ReportFilter = { status: ExpenseStatus.OPEN };
    const { result, rerender } = renderHook(
      ({ filters }) => useExpenseReportSummary(filters),
      { wrapper: createWrapper(), initialProps: { filters: initialFilters } }
    );

    await waitFor(() => {
      expect(mockFetchSummary).toHaveBeenCalledTimes(1);
    });

    const nextSummary: ExpenseReportSummary = { ...baseSummary, expenseCount: 7 };
    mockFetchSummary.mockResolvedValue(nextSummary);
    const nextFilters: ReportFilter = { status: ExpenseStatus.PAID };
    rerender({ filters: nextFilters });

    await waitFor(() => {
      expect(result.current.summary?.expenseCount).toBe(7);
    });

    expect(mockFetchSummary).toHaveBeenCalledTimes(2);
    expect(mockFetchSummary).toHaveBeenLastCalledWith(nextFilters);
  });
});
