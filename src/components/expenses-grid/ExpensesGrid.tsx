import { DataGrid } from '@/components/shared/DataGrid/DataGrid';
import { EXPENSE_COLUMNS } from './expense-columns';
import { ExpenseActions } from './ExpenseActions';
import type { ExpensesGridProps } from './types';
import type { ExpenseDTO } from '@/types/expenses';

export function ExpensesGrid({
  expenses,
  isLoading,
  error,
  hasNextPage,
  total,
  onLoadMore,
  onRefresh,
  onCreate,
  onEdit,
}: ExpensesGridProps) {
  const renderActions = (expense: ExpenseDTO) => (
    <ExpenseActions expense={expense} onEdit={onEdit} />
  );

  return (
    <DataGrid<ExpenseDTO>
      items={expenses}
      columns={EXPENSE_COLUMNS}
      getRowId={(expense) => expense.id}
      renderActions={renderActions}
      actionsLabel="Actions"
      isLoading={isLoading}
      error={error}
      errorTitle="Error loading expenses"
      onRefresh={onRefresh}
      emptyMessage="Nenhuma despesa encontrada"
      hasNextPage={hasNextPage}
      onLoadMore={onLoadMore}
      total={total}
      footerNoun="despesas"
      onCreate={onCreate}
      createLabel="Nova Despesa"
      testIdPrefix="expenses"
    />
  );
}
