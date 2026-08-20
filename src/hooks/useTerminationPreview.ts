import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recurringExpensesApiService } from '../api/recurring-expenses-api';
import type { TerminationPreview } from '../types/recurring-expenses';

interface UseTerminationPreviewParams {
  recurringExpenseId: string | null;
  effectiveDate: Date | null;
  enabled?: boolean;
}

interface UseTerminationPreviewReturn {
  preview: TerminationPreview | null;
  isLoading: boolean;
  error: Error | null;
}

// Debounce da data de efeito, no mesmo formato do debounce de `use-expenses`: o
// seletor de data dispara muitas alterações em sequência, e só a última deve
// virar requisição.
const PREVIEW_DEBOUNCE_MS = 300;

/**
 * Prévia de encerramento (`useQuery` com a data de efeito na chave, ADR-006).
 * Alterar a data troca a chave e refaz a busca naturalmente; o debounce evita
 * disparar a cada interação com o seletor de data.
 */
export function useTerminationPreview({
  recurringExpenseId,
  effectiveDate,
  enabled = true,
}: UseTerminationPreviewParams): UseTerminationPreviewReturn {
  const [debouncedDate, setDebouncedDate] = useState<Date | null>(effectiveDate);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedDate(effectiveDate);
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [effectiveDate]);

  const dateKey = debouncedDate ? debouncedDate.toISOString() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['termination-preview', recurringExpenseId, dateKey],
    queryFn: () =>
      recurringExpensesApiService.fetchTerminationPreview(
        recurringExpenseId as string,
        debouncedDate as Date
      ),
    enabled: enabled && !!recurringExpenseId && !!debouncedDate,
  });

  return {
    preview: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}
