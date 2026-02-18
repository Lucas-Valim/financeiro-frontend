import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { ExpensesApiService } from '../api/expenses-api';
import type { PaymentRequest, PaymentResponse } from '../schemas/payment-schema';

const expensesApiService = new ExpensesApiService();

/**
 * Custom hook for paying an expense
 *
 * Wraps TanStack Query's useMutation to provide a clean, reusable interface
 * for submitting expense payments with automatic cache invalidation.
 *
 * @example
 * ```tsx
 * const { mutate, mutateAsync, isPending, isError, error, data } = usePayExpense();
 *
 * // Using mutate (fire and forget)
 * mutate({
 *   id: 'expense-123',
 *   paymentDate: new Date().toISOString().split('T')[0],
 *   paymentProof: file,
 * });
 *
 * // Using mutateAsync (with await)
 * const result = await mutateAsync({
 *   id: 'expense-123',
 *   paymentDate: new Date().toISOString().split('T')[0],
 *   paymentProof: file,
 * });
 * ```
 */
export function usePayExpense(): UseMutationResult<
  PaymentResponse,
  Error,
  PaymentRequest,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentRequest) => expensesApiService.pay(data),
    onSuccess: () => {
      // Invalidate all expense queries to refresh the UI
      // This will refetch the expense list and update the grid
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
