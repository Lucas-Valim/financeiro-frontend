import { EXPENSE_STATUS_LABELS, ExpenseStatus } from '@/constants/expenses';

export const ALL_VALUE = '__all__';

export const STATUS_OPTIONS: { value: ExpenseStatus; label: string }[] = [
  { value: ExpenseStatus.OPEN, label: EXPENSE_STATUS_LABELS.OPEN },
  { value: ExpenseStatus.PAID, label: EXPENSE_STATUS_LABELS.PAID },
  { value: ExpenseStatus.OVERDUE, label: EXPENSE_STATUS_LABELS.OVERDUE },
];
