import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CalendarView, CalendarFilters as CalendarFiltersType } from '@/types/calendar';
import type { CategoryDTO } from '@/types/categories';
import { useCalendarFilters } from './hooks/useCalendarFilters';
import { CalendarToolbarDesktop } from './CalendarToolbarDesktop';
import { CalendarToolbarMobile } from './CalendarToolbarMobile';

interface CalendarToolbarProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onCreateExpense: () => void;
  filters: CalendarFiltersType;
  onFilterChange: (filters: Partial<CalendarFiltersType>) => void;
  categories: CategoryDTO[];
  receivers: string[];
}

function getPeriodLabel(date: Date, view: CalendarView): string {
  switch (view) {
    case 'month':
      return format(date, 'MMMM yyyy', { locale: ptBR });
    case 'week':
      return `Semana de ${format(date, 'd MMM', { locale: ptBR })}`;
    case 'day':
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  }
}

function getCompactPeriodLabel(date: Date, view: CalendarView): string {
  switch (view) {
    case 'month':
      return format(date, 'MMM yy', { locale: ptBR });
    case 'week':
      return format(date, 'd MMM', { locale: ptBR });
    case 'day':
      return format(date, 'd MMM', { locale: ptBR });
  }
}

export function CalendarToolbar({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onCreateExpense,
  filters,
  onFilterChange,
  categories,
  receivers,
}: CalendarToolbarProps) {
  const {
    activeFiltersCount,
    handleStatusChange,
    handleReceiverChange,
    handleCategoryChange,
    handleClearFilters,
  } = useCalendarFilters({ filters, onFilterChange });

  const periodLabel = useMemo(
    () => getPeriodLabel(currentDate, view),
    [currentDate, view]
  );

  const compactPeriodLabel = useMemo(
    () => getCompactPeriodLabel(currentDate, view),
    [currentDate, view]
  );

  return (
    <div
      className="sticky top-0 z-20 flex flex-col gap-2 p-3 border-b bg-[var(--calendar-bg)] xl:flex-row xl:flex-nowrap xl:items-center xl:justify-between xl:gap-2"
      style={{ borderColor: 'var(--calendar-border)' }}
      role="toolbar"
      aria-label="Controles e filtros do calendário"
    >
      <div className="flex w-full items-center justify-between gap-2 xl:w-auto xl:justify-start xl:gap-2">
        <Tabs
          value={view}
          onValueChange={(v) => onViewChange(v as CalendarView)}
          aria-label="Visualização do calendário"
        >
          <TabsList className="bg-gray-100">
            <TabsTrigger
              value="month"
              className="px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm xl:px-3"
            >
              <span className="xl:hidden">M</span>
              <span className="hidden xl:inline">Mensal</span>
            </TabsTrigger>
            <TabsTrigger
              value="week"
              className="px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm xl:px-3"
            >
              <span className="xl:hidden">S</span>
              <span className="hidden xl:inline">Semanal</span>
            </TabsTrigger>
            <TabsTrigger
              value="day"
              className="px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm xl:px-3"
            >
              <span className="xl:hidden">D</span>
              <span className="hidden xl:inline">Dia</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1 xl:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('prev')}
            aria-label="Período anterior"
            className="h-8 w-8 hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Button>

          <span
            className="hidden min-w-[80px] text-center text-sm font-semibold capitalize xl:block xl:min-w-[120px] xl:text-base"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-live="polite"
          >
            {periodLabel}
          </span>
          <span
            className="min-w-[50px] text-center text-sm font-semibold capitalize xl:hidden"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-live="polite"
          >
            {compactPeriodLabel}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('next')}
            aria-label="Próximo período"
            className="h-8 w-8 hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <CalendarToolbarDesktop
        filters={filters}
        onStatusChange={handleStatusChange}
        onReceiverChange={handleReceiverChange}
        onCategoryChange={handleCategoryChange}
        onClearFilters={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        categories={categories}
        receivers={receivers}
      />

      <CalendarToolbarMobile
        filters={filters}
        onStatusChange={handleStatusChange}
        onReceiverChange={handleReceiverChange}
        onCategoryChange={handleCategoryChange}
        onClearFilters={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        categories={categories}
        receivers={receivers}
        onCreateExpense={onCreateExpense}
      />

      <Button
        onClick={onCreateExpense}
        aria-label="Nova despesa"
        size="sm"
        className="hidden xl:inline-flex"
      >
        <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
        Nova Despesa
      </Button>
    </div>
  );
}
