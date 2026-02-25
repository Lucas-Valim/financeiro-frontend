import {
  StatusFilterSelect,
  ReceiverFilterSelect,
  CategoryFilterSelect,
  ActiveFiltersBadge,
} from './filters';
import type { CalendarFilters } from '@/types/calendar';
import type { CategoryDTO } from '@/types/categories';

interface CalendarToolbarDesktopProps {
  filters: CalendarFilters;
  onStatusChange: (value: string) => void;
  onReceiverChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  categories: CategoryDTO[];
  receivers: string[];
}

export function CalendarToolbarDesktop({
  filters,
  onStatusChange,
  onReceiverChange,
  onCategoryChange,
  onClearFilters,
  activeFiltersCount,
  categories,
  receivers,
}: CalendarToolbarDesktopProps) {
  return (
    <div className="hidden items-center gap-1 xl:flex">
      <StatusFilterSelect
        value={filters.status}
        onChange={onStatusChange}
        size="sm"
      />
      <ReceiverFilterSelect
        value={filters.receiver}
        onChange={onReceiverChange}
        receivers={receivers}
        size="sm"
      />
      <CategoryFilterSelect
        value={filters.categoryId}
        onChange={onCategoryChange}
        categories={categories}
        size="sm"
      />

      {activeFiltersCount > 0 && (
        <ActiveFiltersBadge
          count={activeFiltersCount}
          onClear={onClearFilters}
          size="sm"
        />
      )}
    </div>
  );
}
