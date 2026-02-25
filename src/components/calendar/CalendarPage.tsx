import { useState, useCallback } from 'react';
import { addMonths, addWeeks, addDays } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { PageCard } from '@/components/shared/PageCard';
import { CalendarToolbar } from './CalendarToolbar';
import { ExpenseCalendar } from './ExpenseCalendar';
import { CalendarSkeleton } from './CalendarSkeleton';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { useExpenseCalendar } from '@/hooks/use-expense-calendar';
import { useCategories } from '@/hooks/use-categories';
import type { CalendarView, CalendarFilters as CalendarFiltersType } from '@/types/calendar';
import type { ExpenseDTO } from '@/types/expenses';

const DEFAULT_ORGANIZATION_ID = 'fca3c088-ba34-43a2-9b32-b2b1a1246915';

const NAVIGATION_FUNCTIONS = {
  month: addMonths,
  week: addWeeks,
  day: addDays,
} as const;

export function CalendarPage() {
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [filters, setFilters] = useState<CalendarFiltersType>({});
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDTO | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'view'>('create');

  const { expenses, isLoading, error, receivers } = useExpenseCalendar({
    currentDate,
    view,
    filters,
  });

  const { categories, isLoading: isLoadingCategories } = useCategories(DEFAULT_ORGANIZATION_ID);

  const handleFilterChange = useCallback((newFilters: Partial<CalendarFiltersType>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else {
      const amount = direction === 'next' ? 1 : -1;
      setCurrentDate((prev) => NAVIGATION_FUNCTIONS[view](prev, amount));
    }
  }, [view]);

  const handleEventClick = useCallback((expense: ExpenseDTO) => {
    setSelectedExpense(expense);
    setFormMode('view');
    setIsFormModalOpen(true);
  }, []);

  const handleCreateExpense = useCallback(() => {
    setSelectedExpense(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsFormModalOpen(false);
    setSelectedExpense(null);
  }, []);

  const handleExpenseCreated = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['expenses', 'calendar'],
    });
    handleCloseModal();
  }, [queryClient, handleCloseModal]);

  const isLoadingData = isLoading || isLoadingCategories;

  if (isLoadingData) {
    return (
      <PageCard title="" description="">
        <CalendarSkeleton view={view} />
      </PageCard>
    );
  }

  if (error) {
    return (
      <PageCard title="Calendário de Despesas" description="Visualize suas despesas em formato de calendário">
        <div className="text-center text-red-500 p-8">
          Erro ao carregar despesas. Tente novamente.
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard title="" description="">
      <CalendarToolbar
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={handleNavigate}
        onCreateExpense={handleCreateExpense}
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        receivers={receivers}
      />

      <ExpenseCalendar
        expenses={expenses}
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onEventClick={handleEventClick}
      />

      <ExpenseFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        expense={selectedExpense}
        onSuccess={handleExpenseCreated}
        readonly={formMode === 'view'}
      />
    </PageCard>
  );
}

export default CalendarPage;
