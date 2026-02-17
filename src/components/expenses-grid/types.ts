import type { ExpenseDTO } from '@/types/expenses';

export interface ExpensesGridProps {
  expenses: ExpenseDTO[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  total: number;
  onLoadMore: () => void;
  onRefresh: () => void;
  /** Callback fired when user clicks to create a new expense */
  onCreate?: () => void;
  /** Callback fired when user clicks to edit an expense */
  onEdit?: (expense: ExpenseDTO) => void;
}
