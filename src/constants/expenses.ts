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

export const EXPENSE_STATUS_LABELS = {
  OPEN: 'Aberta',
  OVERDUE: 'Atrasada',
  PAID: 'Paga',
  CANCELLED: 'Cancelada',
} as const;

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
    !filters.categoryId
  );
}
