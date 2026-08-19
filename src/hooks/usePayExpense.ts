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
      // As três invalidações são necessárias: `['expenses']` casa por prefixo
      // com a lista (`['expenses', filters]`) e com o calendário
      // (`['expenses', 'calendar', ...]`), mas os cards de status leem
      // `['expenses-summary', ...]` e os totais do relatório leem
      // `['expense-report-summary', ...]` — outras raízes. Sem elas o card
      // "Abertas" e o relatório continuariam contando a despesa como aberta.
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report-summary'] });
    },
  });
}
