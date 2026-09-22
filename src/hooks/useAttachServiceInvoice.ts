import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExpensesApiService } from '../api/expenses-api';
import { translateAttachServiceInvoiceError } from '../constants/expenses';
import type { AttachServiceInvoiceInput, ExpenseDTO } from '../types/expenses';

const expensesApiService = new ExpensesApiService();

/**
 * Anexa a nota de serviço de uma despesa (PUT /expenses/:id/service-invoice) e
 * revalida as consultas afetadas.
 *
 * Aqui basta UMA invalidação, diferente de `usePayExpense` e
 * `useCancelExpense`: `['expenses']` casa por prefixo com a lista
 * (`['expenses', filters]`) e com o calendário (`['expenses', 'calendar', ...]`),
 * e anexar a nota não altera valor nem situação — os cards de status
 * (`['expenses-summary']`) e os totais do relatório
 * (`['expense-report-summary']`) continuam corretos, então invalidá-los seria
 * tráfego à toa.
 *
 * O `onError` traduz a mensagem de domínio em inglês (403/422/404) para o toast.
 */
export function useAttachServiceInvoice(): UseMutationResult<
  ExpenseDTO,
  Error,
  AttachServiceInvoiceInput,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AttachServiceInvoiceInput) =>
      expensesApiService.attachServiceInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (error: Error) => {
      toast.error(translateAttachServiceInvoiceError(error.message));
    },
  });
}
