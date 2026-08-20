import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExpensesApiService } from '../api/expenses-api';
import { translateConfirmAmountError } from '../constants/expenses';
import type { ConfirmExpenseAmountOutput } from '../types/expenses';

const expensesApiService = new ExpensesApiService();

/**
 * Confirma o valor de uma despesa gerada por recorrência de valor variável
 * (POST /expenses/:id/confirm-amount) e revalida as consultas afetadas.
 *
 * As três invalidações são necessárias: `['expenses']` casa por prefixo com a
 * lista (`['expenses', filters]`) e com o calendário
 * (`['expenses', 'calendar', ...]`), mas os cards de status leem
 * `['expenses-summary', ...]` e os totais do relatório leem
 * `['expense-report-summary', ...]` — outras raízes. Sem as duas últimas
 * chamadas o card e o relatório continuariam contando o valor como estimado
 * logo depois de confirmado.
 *
 * A resposta NÃO é escrita no cache (`setQueryData`): o backend devolve um
 * `ConfirmExpenseAmountOutput` reduzido, sem os campos que os marcadores leem —
 * a atualização vem sempre da invalidação (ADR-006).
 *
 * O `onError` traduz a mensagem em inglês do `409` (`translateConfirmAmountError`,
 * task 01) para o toast, cobrindo o caso de a despesa já ter sido confirmada em
 * outra aba.
 */
export function useConfirmExpenseAmount(): UseMutationResult<
  ConfirmExpenseAmountOutput,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => expensesApiService.confirmAmount(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report-summary'] });
      toast.success('Valor confirmado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(translateConfirmAmountError(error.message));
    },
  });
}
