import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePayExpense } from '../usePayExpense';
import type { PaymentRequest, PaymentResponse } from '../../schemas/payment-schema';

// Mock the ExpensesApiService class - define mocks inside the callback to avoid hoisting issues
const mockPay = vi.hoisted(() => vi.fn());

vi.mock('../../api/expenses-api', () => {
  return {
    ExpensesApiService: class MockExpensesApiService {
      pay = mockPay;
      fetchExpenses = vi.fn();
      fetchExpenseById = vi.fn();
      create = vi.fn();
      update = vi.fn();
    },
  };
});

// Create a wrapper with QueryClientProvider for testing
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe('usePayExpense', () => {
  const mockPaymentResponse: PaymentResponse = {
    id: 'expense-1',
    status: 'PAID',
    paymentDate: '2024-12-15',
    paymentProofUrl: 'https://example.com/proof.pdf',
  };

  const validPaymentRequest: PaymentRequest = {
    id: 'expense-1',
    paymentDate: '2024-12-15',
    paymentProof: new File(['test content'], 'proof.pdf', { type: 'application/pdf' }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPay.mockResolvedValue(mockPaymentResponse);
  });

  describe('initial state', () => {
    it('should return correct initial state (isPending: false, isError: false, data: undefined)', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('successful payment mutation', () => {
    it('should call API with correct payload', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      result.current.mutate(validPaymentRequest);

      await waitFor(() => {
        expect(mockPay).toHaveBeenCalledTimes(1);
        expect(mockPay).toHaveBeenCalledWith(validPaymentRequest);
      });
    });

    it('should update state correctly on success', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      result.current.mutate(validPaymentRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockPaymentResponse);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isError).toBe(false);
      });
    });

    it('should invalidate expense queries on successful payment', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      result.current.mutate(validPaymentRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] });
    });
  });

  describe('failed payment mutation', () => {
    it('should set error state correctly on API failure', async () => {
      const errorMessage = 'Payment failed';
      mockPay.mockRejectedValue(new Error(errorMessage));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      result.current.mutate(validPaymentRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe(errorMessage);
        expect(result.current.data).toBeUndefined();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
      });
    });

    it('should not invalidate queries on failure', async () => {
      mockPay.mockRejectedValue(new Error('Payment failed'));

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      result.current.mutate(validPaymentRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('mutate function', () => {
    it('should work with mutate function', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      result.current.mutate(validPaymentRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockPaymentResponse);
      });
    });
  });

  describe('mutateAsync function', () => {
    it('should work with mutateAsync function and return response', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      const response = await result.current.mutateAsync(validPaymentRequest);

      expect(response).toEqual(mockPaymentResponse);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should throw error on failure', async () => {
      const errorMessage = 'Payment failed';
      mockPay.mockRejectedValue(new Error(errorMessage));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      await expect(result.current.mutateAsync(validPaymentRequest)).rejects.toThrow(errorMessage);
    });
  });

  describe('isPending state during mutation', () => {
    it('should set isPending to true during API call', async () => {
      let resolvePay: (value: PaymentResponse) => void;
      mockPay.mockImplementation(() => new Promise<PaymentResponse>((resolve) => {
        resolvePay = resolve;
      }));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      result.current.mutate(validPaymentRequest);

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolvePay!(mockPaymentResponse);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('reset function', () => {
    it('should reset mutation state', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      result.current.mutate(validPaymentRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      result.current.reset();

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
        expect(result.current.data).toBeUndefined();
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('TypeScript types', () => {
    it('should have correct types inferred', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      // TypeScript compile-time check - these should all be properly typed
      const _isPending: boolean = result.current.isPending;
      const _isError: boolean = result.current.isError;
      const _isSuccess: boolean = result.current.isSuccess;
      const _isIdle: boolean = result.current.isIdle;
      const _data: PaymentResponse | undefined = result.current.data;
      const _error: Error | null = result.current.error;

      // Verify types are correct at runtime
      expect(typeof _isPending).toBe('boolean');
      expect(typeof _isError).toBe('boolean');
      expect(typeof _isSuccess).toBe('boolean');
      expect(typeof _isIdle).toBe('boolean');
    });
  });

  describe('multiple mutations', () => {
    it('should handle multiple sequential mutations', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => usePayExpense(), { wrapper: Wrapper });

      // First mutation
      result.current.mutate(validPaymentRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Reset for next mutation
      result.current.reset();

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
      });

      const secondRequest: PaymentRequest = {
        id: 'expense-2',
        paymentDate: '2024-12-16',
      };

      // Second mutation
      result.current.mutate(secondRequest);

      await waitFor(() => {
        expect(mockPay).toHaveBeenCalledTimes(2);
        expect(mockPay).toHaveBeenLastCalledWith(secondRequest);
      });
    });
  });
});
