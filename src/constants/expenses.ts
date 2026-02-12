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
