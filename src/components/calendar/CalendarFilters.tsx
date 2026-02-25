import { Filter } from 'lucide-react';
import type { CalendarFilters as CalendarFiltersType } from '@/types/calendar';
import type { CategoryDTO } from '@/types/categories';
import { useCalendarFilters } from './hooks/useCalendarFilters';
import {
  StatusFilterSelect,
  ReceiverFilterSelect,
  CategoryFilterSelect,
  ActiveFiltersBadge,
} from './filters';

interface CalendarFiltersProps {
  filters: CalendarFiltersType;
  onFilterChange: (filters: Partial<CalendarFiltersType>) => void;
  categories: CategoryDTO[];
  receivers: string[];
}

export function CalendarFilters({
  filters,
  onFilterChange,
  categories,
  receivers,
}: CalendarFiltersProps) {
  const {
    activeFiltersCount,
    handleStatusChange,
    handleReceiverChange,
    handleCategoryChange,
    handleClearFilters,
  } = useCalendarFilters({ filters, onFilterChange });

  return (
    <div
      className="flex flex-wrap items-center gap-3 p-4 border-b bg-[var(--calendar-bg)]"
      style={{ borderColor: 'var(--calendar-border)' }}
      role="toolbar"
      aria-label="Filtros do calendário"
    >
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" aria-hidden="true" />
        <span
          className="text-sm font-medium text-[var(--calendar-text-primary)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Filtros:
        </span>
      </div>

      <StatusFilterSelect value={filters.status} onChange={handleStatusChange} />
      <ReceiverFilterSelect
        value={filters.receiver}
        onChange={handleReceiverChange}
        receivers={receivers}
      />
      <CategoryFilterSelect
        value={filters.categoryId}
        onChange={handleCategoryChange}
        categories={categories}
      />

      <ActiveFiltersBadge
        count={activeFiltersCount}
        onClear={handleClearFilters}
        showLabel
      />
    </div>
  );
}
