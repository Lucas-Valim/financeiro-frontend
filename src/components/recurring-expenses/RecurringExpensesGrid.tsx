import { AlertTriangle } from 'lucide-react';
import { DataGrid } from '@/components/shared/DataGrid/DataGrid';
import { RECURRING_EXPENSE_COLUMNS } from './recurring-expense-columns';
import { RecurringExpenseActions } from './RecurringExpenseActions';
import type { RecurringExpenseDTO } from '@/types/recurring-expenses';

export interface RecurringExpensesGridProps {
  recurringExpenses: RecurringExpenseDTO[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  /**
   * Sinal de truncamento vindo de `useRecurringExpenses`: a lista recebida veio
   * menor que o total paginado. Exibido na tela para que uma lista cortada nunca
   * conviva em silêncio com um contador de rodapé que a desmente.
   */
  isTruncated: boolean;
  onRefresh: () => void;
  /** Abre a criação de recorrência. */
  onCreate?: () => void;
}

/**
 * Configuração fina do `DataGrid` compartilhado — a mesma relação que
 * `ExpensesGrid` tem com ele. Tabela, cards responsivos, skeleton, estado de
 * erro, estado vazio e contador de rodapé vêm todos de `RECURRING_EXPENSE_COLUMNS`
 * e do `DataGrid`; nada disso é reimplementado aqui.
 *
 * A listagem do MVP não rola infinitamente: `hasNextPage` e `onLoadMore` são
 * omitidos de propósito. `total` e `footerNoun` continuam, para o rodapé.
 */
export function RecurringExpensesGrid({
  recurringExpenses,
  isLoading,
  error,
  total,
  isTruncated,
  onRefresh,
  onCreate,
}: RecurringExpensesGridProps) {
  const renderActions = (recurringExpense: RecurringExpenseDTO) => (
    <RecurringExpenseActions recurringExpense={recurringExpense} />
  );

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {isTruncated && (
        <div
          role="alert"
          data-testid="recurring-expenses-truncation-warning"
          className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Exibindo {recurringExpenses.length} de {total} recorrências: a lista foi
            cortada.
          </span>
        </div>
      )}
      <DataGrid<RecurringExpenseDTO>
        items={recurringExpenses}
        columns={RECURRING_EXPENSE_COLUMNS}
        getRowId={(recurringExpense) => recurringExpense.id}
        renderActions={renderActions}
        actionsLabel="Ações"
        isLoading={isLoading}
        error={error}
        errorTitle="Erro ao carregar recorrências"
        onRefresh={onRefresh}
        emptyMessage="Nenhuma recorrência encontrada"
        total={total}
        footerNoun="recorrências"
        onCreate={onCreate}
        createLabel="Nova Recorrência"
        testIdPrefix="recurring-expenses"
      />
    </div>
  );
}
