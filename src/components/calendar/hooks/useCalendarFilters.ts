import { useMemo, useCallback } from 'react';
import type { CalendarFilters } from '@/types/calendar';
import type { ExpenseStatus } from '@/constants/expenses';
import { ALL_VALUE } from '../constants/calendar-filters';

interface UseCalendarFiltersParams {
  filters: CalendarFilters;
  onFilterChange: (filters: Partial<CalendarFilters>) => void;
}

interface UseCalendarFiltersReturn {
  activeFiltersCount: number;
  handleStatusChange: (value: string) => void;
  handleReceiverChange: (value: string) => void;
  handleCategoryChange: (value: string) => void;
  handleClearFilters: () => void;
}

export function useCalendarFilters({
  filters,
  onFilterChange,
}: UseCalendarFiltersParams): UseCalendarFiltersReturn {
  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter((value) => value !== undefined && value !== '').length,
    [filters]
  );

  const handleStatusChange = useCallback(
    (value: string) => onFilterChange({ status: value === ALL_VALUE ? undefined : (value as ExpenseStatus) }),
    [onFilterChange]
  );

  const handleReceiverChange = useCallback(
    (value: string) => onFilterChange({ receiver: value === ALL_VALUE ? undefined : value }),
    [onFilterChange]
  );

  const handleCategoryChange = useCallback(
    (value: string) => onFilterChange({ categoryId: value === ALL_VALUE ? undefined : value }),
    [onFilterChange]
  );

  const handleClearFilters = useCallback(
    () => onFilterChange({ status: undefined, receiver: undefined, categoryId: undefined }),
    [onFilterChange]
  );

  return {
    activeFiltersCount,
    handleStatusChange,
    handleReceiverChange,
    handleCategoryChange,
    handleClearFilters,
  };
}
