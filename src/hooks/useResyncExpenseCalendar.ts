import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExpensesApiService } from '../api/expenses-api';
import { RESYNC_CALENDAR_MESSAGES } from '../constants/expenses';
import type { ResyncCalendarOutput } from '../types/expenses';

const expensesApiService = new ExpensesApiService();

/**
 * Reenvia manualmente uma despesa para o Google Agenda
 * (POST /expenses/:id/calendar-sync) e revalida as consultas afetadas.
 *
 * DUAS COISAS AQUI CONTRARIAM QUEM VEM DO MOLDE `useConfirmExpenseAmount`:
 *
 * 1. O toast do caso principal é escolhido no `onSuccess`, não no `onError`. O
 *    endpoint responde `200` sempre que a despesa existe, com o RESULTADO da
 *    tentativa em `data.calendarSyncStatus` — uma falha também é `200`, porque o
 *    recurso lido é o estado da sincronização, e ele foi lido. Não se mapeia
 *    código HTTP para desfecho, e não se inspeciona o texto da `Error`: as duas
 *    alternativas foram avaliadas e rejeitadas no ADR-002 (o interceptor do
 *    api-client colapsa toda resposta de erro em texto genérico, apagando a
 *    diferença entre "tente de novo" e "acione o suporte"). O `default` do
 *    `switch` é obrigatório: um quarto status futuro do backend não pode produzir
 *    ausência silenciosa de toast.
 *
 * 2. A invalidação alcança APENAS `['expenses']` (lista + calendário, por
 *    prefixo), e não as três raízes de `useConfirmExpenseAmount`. A sincronização
 *    não move valor, status nem competência, então `['expenses-summary']` e
 *    `['expense-report-summary']` não têm número para recalcular — invalidá-las
 *    custaria três requisições para não mudar nada (ADR-002).
 *
 * A resposta NÃO é escrita no cache (`setQueryData`): `ResyncCalendarOutput` é
 * uma projeção reduzida, sem os campos que os marcadores leem — a mesma armadilha
 * de `ConfirmExpenseAmountOutput`. A atualização das telas vem sempre da
 * invalidação.
 *
 * O `onError` permanece o caminho do `404` e da queda de rede — deixou de ser o
 * caminho do resultado, não o caminho do erro.
 */
export function useResyncExpenseCalendar(): UseMutationResult<
  ResyncCalendarOutput,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => expensesApiService.resyncCalendar(expenseId),
    onSuccess: (data: ResyncCalendarOutput) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });

      switch (data.calendarSyncStatus) {
        case 'SYNCED':
          toast.success(RESYNC_CALENDAR_MESSAGES.SUCCESS);
          break;
        case 'FAILED':
          toast.error(RESYNC_CALENDAR_MESSAGES.FAILED);
          break;
        case 'UNAUTHORIZED':
          toast.error(RESYNC_CALENDAR_MESSAGES.UNAUTHORIZED);
          break;
        default:
          toast.error(RESYNC_CALENDAR_MESSAGES.DEFAULT);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
