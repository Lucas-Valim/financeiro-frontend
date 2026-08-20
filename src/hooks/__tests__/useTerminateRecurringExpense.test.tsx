import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useTerminateRecurringExpense } from '../useTerminateRecurringExpense';
import type { TerminationResult } from '../../types/recurring-expenses';

const mockTerminate = vi.hoisted(() => vi.fn());

vi.mock('../../api/recurring-expenses-api', () => ({
  recurringExpensesApiService: {
    terminate: mockTerminate,
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const terminationResult: TerminationResult = {
  recurrence: {
    id: 'rec-1',
    organizationId: 'org-1',
    description: 'Aluguel',
    favorecidoId: '550e8400-e29b-41d4-a716-446655440000',
    categoryId: null,
    amountType: 'FIXED',
    amount: 1500,
    paymentMethod: null,
    municipality: 'São Paulo',
    dueDay: 10,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-06-01'),
    status: 'ENDED',
    terminationReason: 'Contrato encerrado',
    terminatedAt: new Date('2026-06-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-06-01'),
  },
  cancelledExpenseIds: ['exp-1', 'exp-2'],
};

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

describe('useTerminateRecurringExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTerminate.mockResolvedValue(terminationResult);
  });

  it('terminates with the given id and input', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTerminateRecurringExpense(), {
      wrapper: Wrapper,
    });

    const input = { effectiveDate: new Date('2026-06-01'), reason: 'Contrato encerrado' };
    result.current.mutate({ id: 'rec-1', input });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockTerminate).toHaveBeenCalledWith('rec-1', input);
  });

  it('invalidates the four roots on success', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTerminateRecurringExpense(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      id: 'rec-1',
      input: { effectiveDate: new Date('2026-06-01') },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recurring-expenses'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses-summary'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expense-report-summary'] });
    expect(invalidateSpy).toHaveBeenCalledTimes(4);
  });

  it('shows a success toast on success', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTerminateRecurringExpense(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      id: 'rec-1',
      input: { effectiveDate: new Date('2026-06-01') },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith('Recorrência encerrada com sucesso');
  });

  it('shows the untranslated backend message on error', async () => {
    mockTerminate.mockRejectedValue(new Error('Recorrência já está encerrada'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTerminateRecurringExpense(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      id: 'rec-1',
      input: { effectiveDate: new Date('2026-06-01') },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Recorrência já está encerrada');
  });

  it('falls back to a generic message when the error carries no message', async () => {
    mockTerminate.mockRejectedValue(new Error(''));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTerminateRecurringExpense(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      id: 'rec-1',
      input: { effectiveDate: new Date('2026-06-01') },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro ao encerrar a recorrência');
  });

  it('does not invalidate any query on failure', async () => {
    mockTerminate.mockRejectedValue(new Error('Network error'));

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTerminateRecurringExpense(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      id: 'rec-1',
      input: { effectiveDate: new Date('2026-06-01') },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
