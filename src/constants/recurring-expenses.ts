import type {
  RecurrenceAmountType,
  RecurringExpenseStatus,
} from '../types/recurring-expenses';

/** Rótulo de tipo de valor exibido no badge da coluna "Tipo". */
export const RECURRENCE_AMOUNT_TYPE_LABELS: Record<RecurrenceAmountType, string> = {
  FIXED: 'Fixo',
  VARIABLE: 'Variável',
};

/** Rótulo de estado exibido no badge da coluna "Estado". */
export const RECURRING_EXPENSE_STATUS_LABELS: Record<RecurringExpenseStatus, string> = {
  ACTIVE: 'Ativa',
  ENDED: 'Encerrada',
};

/** Texto usado no período quando a recorrência não tem data-fim definida. */
export const NO_END_DATE_LABEL = 'sem fim definido';

const periodDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Exibe o dia de vencimento da série: "Todo dia N". */
export function formatDueDay(dueDay: number): string {
  return `Todo dia ${dueDay}`;
}

/**
 * Exibe o período da recorrência: "dd/MM/aaaa – dd/MM/aaaa", usando
 * `NO_END_DATE_LABEL` quando não há data-fim.
 */
export function formatRecurrencePeriod(startDate: Date, endDate: Date | null): string {
  const start = periodDateFormatter.format(startDate);
  const end = endDate ? periodDateFormatter.format(endDate) : NO_END_DATE_LABEL;
  return `${start} – ${end}`;
}
