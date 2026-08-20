import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useConfirmExpenseAmount } from '../useConfirmExpenseAmount';
import { CONFIRM_AMOUNT_ERROR_MESSAGES } from '../../constants/expenses';
import type { ConfirmExpenseAmountOutput } from '../../types/expenses';
import { ExpenseStatus } from '../../constants/expenses';

// Mock the ExpensesApiService class - define mocks inside the callback to avoid hoisting issues
const mockConfirmAmount = vi.hoisted(() => vi.fn());

vi.mock('../../api/expenses-api', () => {
  return {
    ExpensesApiService: class MockExpensesApiService {
      confirmAmount = mockConfirmAmount;
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

const mockConfirmResponse: ConfirmExpenseAmountOutput = {
  id: 'expense-1',
  organizationId: 'org-1',
  categoryId: null,
  description: 'Recurring expense',
  amount: 250.75,
  currency: 'BRL',
  dueDate: new Date('2024-12-15'),
  status: ExpenseStatus.OPEN,
  paymentMethod: null,
  paymentProof: null,
  paymentProofUrl: null,
  receiver: 'Receiver',
  municipality: 'City',
  serviceInvoice: null,
  serviceInvoiceUrl: null,
  amountPendingConfirmation: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('useConfirmExpenseAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirmAmount.mockResolvedValue(mockConfirmResponse);
  });

  it('calls the confirm endpoint with the expense id', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConfirmExpenseAmount(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(mockConfirmAmount).toHaveBeenCalledTimes(1);
      expect(mockConfirmAmount).toHaveBeenCalledWith('expense-1');
    });
  });

  it('invalidates exactly expenses, expenses-summary and expense-report-summary on success', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useConfirmExpenseAmount(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses-summary'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expense-report-summary'] });
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });

  it('shows a success toast on success', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConfirmExpenseAmount(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith('Valor confirmado com sucesso');
  });

  it('translates the 409 already-confirmed error into a Portuguese toast', async () => {
    mockConfirmAmount.mockRejectedValue(
      new Error('Expense amount is already confirmed')
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConfirmExpenseAmount(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(
      CONFIRM_AMOUNT_ERROR_MESSAGES.ALREADY_CONFIRMED
    );
    expect(toast.error).not.toHaveBeenCalledWith('Expense amount is already confirmed');
  });

  it('does not invalidate any query on failure', async () => {
    mockConfirmAmount.mockRejectedValue(new Error('Network error'));

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useConfirmExpenseAmount(), { wrapper: Wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
