import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExpensesApiService } from '../api/expenses-api';
import { translateCancelExpenseError } from '../constants/expenses';
import type { ExpenseDTO } from '../types/expenses';

const expensesApiService = new ExpensesApiService();

/**
 * Cancela uma despesa (DELETE /expenses/:id) e revalida as consultas afetadas.
 *
 * As três invalidações são necessárias: `['expenses']` casa por prefixo com a
 * lista (`['expenses', filters]`) e com o calendário
 * (`['expenses', 'calendar', ...]`), mas os cards de status leem
 * `['expenses-summary', ...]` e os totais do relatório leem
 * `['expense-report-summary', ...]` — outras raízes. Sem as duas últimas
 * chamadas o card "Abertas" e o relatório continuariam contando a despesa
 * cancelada.
 *
 * A variável da mutation é apenas o id: diferente de `/favorecidos`, o
 * namespace `/expenses` recebe o `organizationId` do interceptor do api-client.
 */
export function useCancelExpense(): UseMutationResult<ExpenseDTO, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => expensesApiService.cancel(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report-summary'] });
    },
    onError: (error: Error) => {
      toast.error(translateCancelExpenseError(error.message));
    },
  });
}
