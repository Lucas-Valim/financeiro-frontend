import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRecurringExpenses } from '../use-recurring-expenses';
import type {
  ListRecurringExpensesOutput,
  RecurringExpenseDTO,
} from '../../types/recurring-expenses';

const mockFetchRecurringExpenses = vi.hoisted(() => vi.fn());

vi.mock('../../api/recurring-expenses-api', () => ({
  recurringExpensesApiService: {
    fetchRecurringExpenses: mockFetchRecurringExpenses,
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

function buildRecurringExpense(id: string): RecurringExpenseDTO {
  return {
    id,
    organizationId: 'org-1',
    description: `Recorrência ${id}`,
    favorecidoId: '550e8400-e29b-41d4-a716-446655440000',
    categoryId: null,
    amountType: 'FIXED',
    amount: 100,
    paymentMethod: null,
    municipality: 'São Paulo',
    dueDay: 10,
    startDate: new Date('2026-01-01'),
    endDate: null,
    status: 'ACTIVE',
    terminationReason: null,
    terminatedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

function buildResponse(count: number, total: number): ListRecurringExpensesOutput {
  return {
    data: Array.from({ length: count }, (_, i) => buildRecurringExpense(String(i + 1))),
    pagination: { page: 1, limit: 100, total },
  };
}

describe('useRecurringExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the recurrences from the response and the pagination total', async () => {
    mockFetchRecurringExpenses.mockResolvedValue(buildResponse(3, 3));

    const { result } = renderHook(() => useRecurringExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(3);
    expect(result.current.total).toBe(3);
  });

  it('exposes the truncation signal when data.length is below the total', async () => {
    mockFetchRecurringExpenses.mockResolvedValue(buildResponse(100, 137));

    const { result } = renderHook(() => useRecurringExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isTruncated).toBe(true);
  });

  it('keeps the truncation signal false when data.length equals the total', async () => {
    mockFetchRecurringExpenses.mockResolvedValue(buildResponse(12, 12));

    const { result } = renderHook(() => useRecurringExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isTruncated).toBe(false);
  });

  it('surfaces query errors', async () => {
    mockFetchRecurringExpenses.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRecurringExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.total).toBe(0);
  });
});
