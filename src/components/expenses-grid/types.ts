import type { ExpenseDTO } from '@/types/expenses';

export interface ExpensesGridProps {
  expenses: ExpenseDTO[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  total: number;
  onLoadMore: () => void;
  onRefresh: () => void;
}
