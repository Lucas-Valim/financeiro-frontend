import { useQuery } from '@tanstack/react-query';
import { recurringExpensesApiService } from '../api/recurring-expenses-api';
import type { RecurringExpenseDTO } from '../types/recurring-expenses';

interface UseRecurringExpensesReturn {
  data: RecurringExpenseDTO[];
  total: number;
  /**
   * Sinal de truncamento: a lista recebida veio menor que o total paginado, então
   * o contador de rodapé estaria desmentindo o que está na tela. A tela usa isto
   * para avisar sobre o corte. Ver TechSpec — o serviço envia `limit: 100`; se este
   * sinal aparecer na vida real, a troca por `useInfiniteQuery` é local a este hook.
   */
  isTruncated: boolean;
  isLoading: boolean;
  error: Error | null;
}

// 5-min stale time, no padrão de `use-categories`/`use-favorecidos`: invalidações
// desta aba refazem a busca imediatamente.
const RECURRING_EXPENSES_STALE_TIME = 5 * 60 * 1000;

/**
 * Lista as recorrências da organização com um `useQuery` simples — NÃO um
 * `useInfiniteQuery`. O volume por organização é de dezenas de recorrências; o
 * serviço já pede `limit: 100`, e o corte, se acontecer, aparece via `isTruncated`.
 */
export function useRecurringExpenses(): UseRecurringExpensesReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: () => recurringExpensesApiService.fetchRecurringExpenses(),
    staleTime: RECURRING_EXPENSES_STALE_TIME,
  });

  const recurringExpenses = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  return {
    data: recurringExpenses,
    total,
    isTruncated: recurringExpenses.length < total,
    isLoading,
    error: error as Error | null,
  };
}
