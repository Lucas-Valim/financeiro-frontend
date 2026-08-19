import { startOfMonth, endOfMonth } from 'date-fns';
import type { ExpenseFilter } from '@/types/expenses';

export const EXPENSE_STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800',
  OVERDUE: 'bg-red-100 text-red-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
} as const;

export const EXPENSE_PAGE_LIMIT = 10;

export const ORGANIZATION_ID = 'fca3c088-ba34-43a2-9b32-b2b1a1246915';

export enum ExpenseStatus {
  OPEN = 'OPEN',
  OVERDUE = 'OVERDUE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

/**
 * Canonical payment methods accepted by the expense form and matched exactly by
 * the list/report queries (`payment_method` is compared verbatim on the
 * backend), which is why both the form and the filters offer a fixed list
 * instead of free text.
 */
export const PAYMENT_METHODS = [
  'Boleto',
  'PIX',
  'Transferência',
  'Guia',
] as const;

export const EXPENSE_STATUS_LABELS = {
  OPEN: 'Aberta',
  OVERDUE: 'Atrasada',
  PAID: 'Paga',
  CANCELLED: 'Cancelada',
} as const;

/**
 * Espelha a regra de domínio do backend (`ExpenseStatus.allowsEditing`):
 * despesas PAID e CANCELLED são estados terminais e não podem ser editadas.
 */
export function isExpenseEditable(status: ExpenseStatus): boolean {
  return status === ExpenseStatus.OPEN || status === ExpenseStatus.OVERDUE;
}

/**
 * Espelha a regra de domínio do backend (`ExpenseStatus.allowsCancellation`):
 * apenas despesas OPEN e OVERDUE podem ser canceladas. Mantida separada de
 * `isExpenseEditable` porque são regras distintas no backend que hoje apenas
 * coincidem.
 */
export function isExpenseCancellable(status: ExpenseStatus): boolean {
  return status === ExpenseStatus.OPEN || status === ExpenseStatus.OVERDUE;
}

/** Trechos das mensagens de domínio (em inglês) devolvidas pelo backend. */
const CANNOT_CANCEL_BACKEND_PREFIX = 'Cannot cancel expense with status';
const NOT_FOUND_BACKEND_SUFFIX = 'not found';

export const CANCEL_EXPENSE_ERROR_MESSAGES = {
  NOT_CANCELLABLE: 'Não é possível cancelar uma despesa paga ou já cancelada',
  NOT_FOUND: 'Despesa não encontrada',
  DEFAULT: 'Ocorreu um erro ao cancelar a despesa',
} as const;

/**
 * Traduz a mensagem de domínio do backend para o texto exibido no toast.
 * Qualquer mensagem desconhecida (inclusive erro de rede) cai no texto
 * genérico, para nunca vazar inglês ou detalhe técnico para o usuário.
 */
export function translateCancelExpenseError(message: string): string {
  if (message.startsWith(CANNOT_CANCEL_BACKEND_PREFIX)) {
    return CANCEL_EXPENSE_ERROR_MESSAGES.NOT_CANCELLABLE;
  }
  if (message.endsWith(NOT_FOUND_BACKEND_SUFFIX)) {
    return CANCEL_EXPENSE_ERROR_MESSAGES.NOT_FOUND;
  }
  return CANCEL_EXPENSE_ERROR_MESSAGES.DEFAULT;
}

/**
 * Builds the default expense filters applied when the page first loads:
 * open expenses within the current month. Returns fresh Date instances on
 * every call to avoid sharing mutable Date objects across renders.
 */
export function getDefaultExpenseFilters(): ExpenseFilter {
  const now = new Date();
  return {
    status: ExpenseStatus.OPEN,
    dueDateStart: startOfMonth(now),
    dueDateEnd: endOfMonth(now),
  };
}

/**
 * Checks whether the given filters match the default view (open + current
 * month with no extra filters). Used to decide when to show the "Limpar
 * Filtros" button.
 */
export function isDefaultExpenseFilters(filters: ExpenseFilter): boolean {
  const defaults = getDefaultExpenseFilters();
  return (
    filters.status === defaults.status &&
    filters.dueDateStart?.getTime() === defaults.dueDateStart?.getTime() &&
    filters.dueDateEnd?.getTime() === defaults.dueDateEnd?.getTime() &&
    !filters.receiver &&
    !filters.municipality &&
    !filters.paymentMethod &&
    !filters.categoryId
  );
}
