import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCancelExpense } from '../useCancelExpense';
import { CANCEL_EXPENSE_ERROR_MESSAGES, ExpenseStatus } from '../../constants/expenses';
import type { ExpenseDTO } from '../../types/expenses';

const mockCancel = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock('../../api/expenses-api', () => ({
  ExpensesApiService: class {
    cancel = mockCancel;
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}));

const cancelledExpense = {
  id: 'expense-1',
  status: ExpenseStatus.CANCELLED,
} as ExpenseDTO;

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

describe('useCancelExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCancel.mockResolvedValue(cancelledExpense);
  });

  describe('initial state', () => {
    it('should return correct initial state', () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('successful cancellation', () => {
    it('should call the cancel API with the expense id only', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      result.current.mutate('expense-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(mockCancel).toHaveBeenCalledWith('expense-1');
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should expose the cancelled expense returned by the backend', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      result.current.mutate('expense-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data?.status).toBe(ExpenseStatus.CANCELLED);
    });

    it('should invalidate the expenses list, the status summary and the report summary', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      result.current.mutate('expense-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses-summary'] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['expense-report-summary'],
      });
      expect(invalidateSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('failed cancellation', () => {
    it('should NOT invalidate queries on failure', async () => {
      mockCancel.mockRejectedValue(new Error('Cannot cancel expense with status PAID'));
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      result.current.mutate('expense-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('should toast the pt-BR message for the status-guard error', async () => {
      mockCancel.mockRejectedValue(new Error('Cannot cancel expense with status PAID'));
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      result.current.mutate('expense-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(mockToastError).toHaveBeenCalledWith(
        CANCEL_EXPENSE_ERROR_MESSAGES.NOT_CANCELLABLE
      );
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });

    it('should toast the pt-BR message for the CANCELLED status guard', async () => {
      mockCancel.mockRejectedValue(
        new Error('Cannot cancel expense with status CANCELLED')
      );
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      result.current.mutate('expense-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(mockToastError).toHaveBeenCalledWith(
        CANCEL_EXPENSE_ERROR_MESSAGES.NOT_CANCELLABLE
      );
    });

    it('should toast the not-found message when the expense no longer exists', async () => {
      mockCancel.mockRejectedValue(new Error('Expense with id expense-1 not found'));
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      result.current.mutate('expense-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(mockToastError).toHaveBeenCalledWith(CANCEL_EXPENSE_ERROR_MESSAGES.NOT_FOUND);
    });

    it('should toast the generic message for a network error', async () => {
      mockCancel.mockRejectedValue(
        new Error('Erro de rede: Não foi possível conectar ao servidor')
      );
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      result.current.mutate('expense-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(mockToastError).toHaveBeenCalledWith(CANCEL_EXPENSE_ERROR_MESSAGES.DEFAULT);
    });
  });

  describe('isPending state', () => {
    it('should set isPending to true during the API call', async () => {
      let resolveCancel: (value: ExpenseDTO) => void;
      mockCancel.mockImplementation(
        () =>
          new Promise<ExpenseDTO>((resolve) => {
            resolveCancel = resolve;
          })
      );
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCancelExpense(), { wrapper: Wrapper });

      result.current.mutate('expense-1');

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolveCancel!(cancelledExpense);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
