import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { recurringExpensesApiService } from '../api/recurring-expenses-api';
import type { TerminateInput, TerminationResult } from '../types/recurring-expenses';

interface TerminateVariables {
  id: string;
  input: TerminateInput;
}

/**
 * Encerra uma recorrência (`POST /recurring-expenses/:id/termination`), no formato
 * de `usePayExpense`.
 *
 * Invalida as QUATRO raízes (ADR-006): `recurring-expenses`, porque a série passa
 * a "Encerrada"; e `expenses` + `expenses-summary` + `expense-report-summary`,
 * porque o encerramento cancela as ocorrências em aberto — os cards e o relatório
 * leem raízes que o prefixo `['expenses']` não alcança.
 *
 * O `onError` exibe `error.message` como veio: as exceções de recorrência já
 * nascem em português no backend, então aplicar um tradutor as pioraria.
 */
export function useTerminateRecurringExpense(): UseMutationResult<
  TerminationResult,
  Error,
  TerminateVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: TerminateVariables) =>
      recurringExpensesApiService.terminate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report-summary'] });
      toast.success('Recorrência encerrada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ocorreu um erro ao encerrar a recorrência');
    },
  });
}
