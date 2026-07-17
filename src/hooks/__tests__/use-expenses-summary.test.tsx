import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useExpensesSummary } from '../use-expenses-summary';
import { ExpenseStatus } from '../../constants/expenses';
import type { ExpenseStatusSummary } from '../../types/expenses';

const mockFetchExpensesSummary = vi.hoisted(() => vi.fn());

vi.mock('../../api/expenses-api', () => ({
  ExpensesApiService: class MockExpensesApiService {
    fetchExpensesSummary = mockFetchExpensesSummary;
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useExpensesSummary', () => {
  const summary: ExpenseStatusSummary = {
    [ExpenseStatus.OPEN]: { count: 2, total: 500 },
    [ExpenseStatus.OVERDUE]: { count: 1, total: 150 },
    [ExpenseStatus.PAID]: { count: 3, total: 900 },
    [ExpenseStatus.CANCELLED]: { count: 0, total: 0 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchExpensesSummary.mockResolvedValue(summary);
  });

  it('should return an empty summary before data loads', () => {
    const { result } = renderHook(() => useExpensesSummary({ filters: {} }), {
      wrapper: createWrapper(),
    });

    expect(result.current.summary.OPEN).toEqual({ count: 0, total: 0 });
  });

  it('should return the fetched summary', async () => {
    const { result } = renderHook(() => useExpensesSummary({ filters: {} }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.summary.OPEN.total).toBe(500);
    });

    expect(result.current.summary.PAID.count).toBe(3);
  });

  it('should call the service without the status filter', async () => {
    const dueDateStart = new Date('2026-07-01');

    renderHook(
      () =>
        useExpensesSummary({
          filters: { status: ExpenseStatus.OPEN, dueDateStart },
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockFetchExpensesSummary).toHaveBeenCalled();
    });

    expect(mockFetchExpensesSummary).toHaveBeenCalledWith({ dueDateStart });
    const filterArg = mockFetchExpensesSummary.mock.calls[0][0];
    expect(filterArg).not.toHaveProperty('status');
  });
});
