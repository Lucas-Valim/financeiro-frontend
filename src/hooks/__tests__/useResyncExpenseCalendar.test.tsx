import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useResyncExpenseCalendar } from '../useResyncExpenseCalendar';
import { RESYNC_CALENDAR_MESSAGES } from '../../constants/expenses';
import type { CalendarSyncStatus, ResyncCalendarOutput } from '../../types/expenses';

// Mock the ExpensesApiService class - define mocks inside the callback to avoid hoisting issues
const mockResyncCalendar = vi.hoisted(() => vi.fn());

vi.mock('../../api/expenses-api', () => {
  return {
    ExpensesApiService: class MockExpensesApiService {
      resyncCalendar = mockResyncCalendar;
      confirmAmount = vi.fn();
      pay = vi.fn();
      cancel = vi.fn();
      fetchExpenses = vi.fn();
      fetchExpenseById = vi.fn();
      create = vi.fn();
      update = vi.fn();
    },
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, queryClient };
}

function buildResponse(status: CalendarSyncStatus | string): ResyncCalendarOutput {
  return {
    calendarSyncStatus: status as CalendarSyncStatus,
    calendarEventUrl:
      status === 'SYNCED' ? 'https://calendar.google.com/event/abc' : null,
    calendarSyncedAt: '2026-08-21T10:00:00.000Z',
  };
}

describe('useResyncExpenseCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResyncCalendar.mockResolvedValue(buildResponse('SYNCED'));
  });

  it('calls the calendar-sync endpoint with the expense id', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useResyncExpenseCalendar(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(mockResyncCalendar).toHaveBeenCalledTimes(1);
      expect(mockResyncCalendar).toHaveBeenCalledWith('expense-1');
    });
  });

  it('shows a success toast when the body status is SYNCED', async () => {
    mockResyncCalendar.mockResolvedValue(buildResponse('SYNCED'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useResyncExpenseCalendar(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith(RESYNC_CALENDAR_MESSAGES.SUCCESS);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows an error toast promising a retry when the body status is FAILED', async () => {
    mockResyncCalendar.mockResolvedValue(buildResponse('FAILED'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useResyncExpenseCalendar(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(RESYNC_CALENDAR_MESSAGES.FAILED);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('shows an error toast pointing to support when the body status is UNAUTHORIZED', async () => {
    mockResyncCalendar.mockResolvedValue(buildResponse('UNAUTHORIZED'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useResyncExpenseCalendar(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(RESYNC_CALENDAR_MESSAGES.UNAUTHORIZED);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('falls back to the generic message on an unknown status, without throwing', async () => {
    mockResyncCalendar.mockResolvedValue(buildResponse('PARTIAL'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useResyncExpenseCalendar(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(RESYNC_CALENDAR_MESSAGES.DEFAULT);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('invalidates exactly the expenses root once on success', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useResyncExpenseCalendar(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it('does not invalidate expenses-summary nor expense-report-summary', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useResyncExpenseCalendar(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['expenses-summary'] });
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: ['expense-report-summary'],
    });
  });

  it('never writes the response into the cache with setQueryData', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => useResyncExpenseCalendar(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(setQueryDataSpy).not.toHaveBeenCalled();
  });

  it('shows the interceptor error message in the error toast on rejection (404 / network)', async () => {
    mockResyncCalendar.mockRejectedValue(new Error('Despesa não encontrada'));

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useResyncExpenseCalendar(), { wrapper: Wrapper });

    result.current.mutate('missing');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Despesa não encontrada');
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('useResyncExpenseCalendar — integration with a real QueryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the expenses list query as stale and triggers a refetch after a SYNCED mutation', async () => {
    mockResyncCalendar.mockResolvedValue(buildResponse('SYNCED'));

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const filters = { status: 'OPEN' };
    const fetcher = vi.fn().mockResolvedValue({ data: [], pagination: { total: 0 } });

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    // A live observer on ['expenses', filters] — invalidation refetches only
    // active queries, so the list must be observed for the refetch to fire.
    const { result } = renderHook(
      () => ({
        list: useQuery({ queryKey: ['expenses', filters], queryFn: fetcher }),
        resync: useResyncExpenseCalendar(),
      }),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    result.current.resync.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.resync.isSuccess).toBe(true);
    });

    // Invalidation of ['expenses'] matches the list by prefix, marking it stale
    // and triggering exactly one refetch.
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});
