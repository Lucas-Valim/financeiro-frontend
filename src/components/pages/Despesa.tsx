import { useState, useCallback, useMemo } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { StatusCards } from '@/components/status-cards/StatusCards';
import { FilterModal } from '@/components/filter-modal/FilterModal';
import { ExpensesGrid } from '@/components/expenses-grid/ExpensesGrid';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { Button } from '@/components/ui/button';
import { Loader2, Filter, AlertCircle, X } from 'lucide-react';
import type { ExpenseFilter, ExpenseDTO } from '@/types/expenses';
import { ExpenseStatus } from '@/constants/expenses';
import { PageCard } from '@/components/shared/PageCard';

export function Despesa() {
  const [filters, setFilters] = useState<ExpenseFilter>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDTO | null>(null);

  const {
    data: expenses,
    total,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
  } = useExpenses({ filters });

  const statusCounts = useMemo(() => {
    const counts = {
      openCount: 0,
      overdueCount: 0,
      paidCount: 0,
      cancelledCount: 0,
    };

    expenses.forEach((expense) => {
      switch (expense.status) {
        case ExpenseStatus.OPEN:
          counts.openCount++;
          break;
        case ExpenseStatus.OVERDUE:
          counts.overdueCount++;
          break;
        case ExpenseStatus.PAID:
          counts.paidCount++;
          break;
        case ExpenseStatus.CANCELLED:
          counts.cancelledCount++;
          break;
      }
    });

    return counts;
  }, [expenses]);

  const handleOpenFilterModal = useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const handleApplyFilters = useCallback(
    (newFilters: ExpenseFilter) => {
      setFilters(newFilters);
      reset();
      setIsFilterModalOpen(false);
    },
    [reset]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({});
    reset();
    setIsFilterModalOpen(false);
  }, [reset]);

  const handleFilterByStatus = useCallback(
    (status: ExpenseStatus) => {
      if (filters.status === status) {
        setFilters({});
        reset();
        return;
      }
      const newFilters = { ...filters, status };
      setFilters(newFilters);
      reset();
    },
    [filters, reset]
  );

  const handleRefresh = useCallback(() => {
    reset();
  }, [reset]);

  const handleCreateExpense = useCallback(() => {
    setSelectedExpense(null);
    setIsExpenseModalOpen(true);
  }, []);

  const handleEditExpense = useCallback((expense: ExpenseDTO) => {
    setSelectedExpense(expense);
    setIsExpenseModalOpen(true);
  }, []);

  const handleCloseExpenseModal = useCallback(() => {
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
  }, []);

  const handleExpenseSuccess = useCallback(() => {
    reset();
  }, [reset]);

  if (error && !isLoading && expenses.length === 0) {
    return (
      <PageCard
        title="Gerenciamento de Despesas"
        description="Controle e organize suas despesas de forma eficiente"
      >
        <div
          className="flex flex-col items-center justify-center p-8 text-center"
          data-testid="error-state"
        >
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Erro ao carregar despesas
          </h3>
          <p className="text-muted-foreground mb-4">
            {(error as Error)?.message ||
              'Ocorreu um erro inesperado ao carregar as despesas'}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard
      title="Gerenciamento de Despesas"
      description="Controle e organize suas despesas de forma eficiente"
    >
      <div className="space-y-3 flex-1 md:overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <Button
            onClick={handleOpenFilterModal}
            variant="outline"
            className="flex items-center gap-2"
            data-testid="filter-button"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>

          <div className="flex-1 flex justify-center">
            <StatusCards
              openCount={statusCounts.openCount}
              overdueCount={statusCounts.overdueCount}
              paidCount={statusCounts.paidCount}
              cancelledCount={statusCounts.cancelledCount}
              onCardClick={handleFilterByStatus}
              activeStatus={filters.status || null}
            />
          </div>

          {Object.keys(filters).length > 0 && (
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              className="flex items-center gap-2"
              data-testid="clear-filters-button"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:overflow-hidden">
          {isLoading && expenses.length === 0 ? (
            <div
              className="flex items-center justify-center p-8"
              data-testid="loading-state"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Carregando despesas...
              </span>
            </div>
          ) : (
            <ExpensesGrid
              expenses={expenses}
              isLoading={isLoading}
              error={error as Error | null}
              hasNextPage={hasMore}
              total={total}
              onLoadMore={loadMore}
              onRefresh={handleRefresh}
              onCreate={handleCreateExpense}
              onEdit={handleEditExpense}
            />
          )}
        </div>

        <FilterModal
          filters={filters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          onClose={handleCloseFilterModal}
          isOpen={isFilterModalOpen}
        />

        <ExpenseFormModal
          isOpen={isExpenseModalOpen}
          onClose={handleCloseExpenseModal}
          onSuccess={handleExpenseSuccess}
          expense={selectedExpense}
        />
      </div>
    </PageCard>
  );
}
