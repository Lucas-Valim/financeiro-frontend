import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageCard } from '@/components/shared/PageCard';
import { RecurringExpensesGrid } from '@/components/recurring-expenses/RecurringExpensesGrid';
import { RecurringExpenseFormModal } from '@/components/recurring-expenses/RecurringExpenseFormModal';
import { useRecurringExpenses } from '@/hooks/use-recurring-expenses';

const RECURRING_EXPENSES_QUERY_KEY = ['recurring-expenses'] as const;

export interface RecorrenciasProps {
  /**
   * Abre o formulário de criação já no primeiro render. É o ponto de entrada
   * secundário: quem sai de `/despesa` ao perceber que a despesa se repete chega
   * aqui com o formulário aberto. A rota deriva isto do search param `novo`.
   */
  initialCreateOpen?: boolean;
}

/**
 * Área de gestão de recorrências. Segue a estrutura de `Despesa.tsx`: casca
 * `PageCard`, estado local dos diálogos e o grid preenchendo a altura restante.
 *
 * A criação é da página (o formulário sem `recurringExpense`, aberto pelo botão
 * "Nova Recorrência" do grid). Edição, visualização e encerramento vivem em
 * `RecurringExpenseActions`, por linha — a página não os controla. Estados de
 * carregamento, erro e vazio vêm do `DataGrid`, não são reimplementados aqui.
 */
export function Recorrencias({ initialCreateOpen = false }: RecorrenciasProps) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(initialCreateOpen);

  const { data, total, isTruncated, isLoading, error } = useRecurringExpenses();

  const queryClient = useQueryClient();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSES_QUERY_KEY });
  }, [queryClient]);

  const handleOpenCreateModal = useCallback(() => {
    setIsFormModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsFormModalOpen(false);
  }, []);

  return (
    <PageCard
      title="Recorrências"
      description="Cadastre e acompanhe as despesas que se repetem todo mês"
    >
      <div className="space-y-3 flex-1 md:overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col md:overflow-hidden">
          <RecurringExpensesGrid
            recurringExpenses={data}
            isLoading={isLoading}
            error={error}
            total={total}
            isTruncated={isTruncated}
            onRefresh={handleRefresh}
            onCreate={handleOpenCreateModal}
          />
        </div>

        <RecurringExpenseFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseCreateModal}
          onSuccess={handleRefresh}
        />
      </div>
    </PageCard>
  );
}
