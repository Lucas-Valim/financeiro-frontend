import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTerminationPreview } from '../useTerminationPreview';
import type { TerminationPreview } from '../../types/recurring-expenses';

const mockFetchTerminationPreview = vi.hoisted(() => vi.fn());

vi.mock('../../api/recurring-expenses-api', () => ({
  recurringExpensesApiService: {
    fetchTerminationPreview: mockFetchTerminationPreview,
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return Wrapper;
}

function buildPreview(effectiveDate: Date): TerminationPreview {
  return {
    effectiveDate,
    cancellableExpenses: [
      {
        id: 'exp-1',
        description: 'Ocorrência de abril',
        amount: 500,
        dueDate: new Date('2026-04-10'),
        occurrenceMonth: new Date('2026-04-01'),
        status: 'OPEN' as never,
      },
    ],
  };
}

describe('useTerminationPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTerminationPreview.mockImplementation((_id: string, date: Date) =>
      Promise.resolve(buildPreview(date))
    );
  });

  it('does not fetch while the effective date is null', async () => {
    renderHook(
      () => useTerminationPreview({ recurringExpenseId: 'rec-1', effectiveDate: null }),
      { wrapper: createWrapper() }
    );

    // Give the debounce window time to elapse; still nothing should fire.
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(mockFetchTerminationPreview).not.toHaveBeenCalled();
  });

  it('changing the effective date swaps the query key and refetches', async () => {
    const { rerender } = renderHook(
      ({ effectiveDate }) =>
        useTerminationPreview({ recurringExpenseId: 'rec-1', effectiveDate }),
      {
        wrapper: createWrapper(),
        initialProps: { effectiveDate: new Date('2026-04-01') as Date | null },
      }
    );

    await waitFor(() => {
      expect(mockFetchTerminationPreview).toHaveBeenCalledTimes(1);
    });

    rerender({ effectiveDate: new Date('2026-05-01') });

    await waitFor(() => {
      expect(mockFetchTerminationPreview).toHaveBeenCalledTimes(2);
    });

    expect(mockFetchTerminationPreview.mock.calls[0][1]).toEqual(new Date('2026-04-01'));
    expect(mockFetchTerminationPreview.mock.calls[1][1]).toEqual(new Date('2026-05-01'));
  });

  it('collapses rapid successive date changes into a single request via debounce', async () => {
    const { rerender } = renderHook(
      ({ effectiveDate }) =>
        useTerminationPreview({ recurringExpenseId: 'rec-1', effectiveDate }),
      {
        wrapper: createWrapper(),
        initialProps: { effectiveDate: null as Date | null },
      }
    );

    // Fire three changes within the debounce window; only the last should survive.
    rerender({ effectiveDate: new Date('2026-06-01') });
    rerender({ effectiveDate: new Date('2026-06-02') });
    rerender({ effectiveDate: new Date('2026-06-03') });

    await waitFor(() => {
      expect(mockFetchTerminationPreview).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchTerminationPreview.mock.calls[0][1]).toEqual(new Date('2026-06-03'));
  });

  it('returns the preview once resolved', async () => {
    const { result } = renderHook(
      () =>
        useTerminationPreview({
          recurringExpenseId: 'rec-1',
          effectiveDate: new Date('2026-04-01'),
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.preview).not.toBeNull();
    });

    expect(result.current.preview?.cancellableExpenses).toHaveLength(1);
  });
});
