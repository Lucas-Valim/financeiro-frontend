import { useState } from 'react';
import { Filter, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  StatusFilterSelect,
  ReceiverFilterSelect,
  CategoryFilterSelect,
} from './filters';
import type { CalendarFilters } from '@/types/calendar';
import type { CategoryDTO } from '@/types/categories';

interface CalendarToolbarMobileProps {
  filters: CalendarFilters;
  onStatusChange: (value: string) => void;
  onReceiverChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  categories: CategoryDTO[];
  receivers: string[];
  onCreateExpense: () => void;
}

export function CalendarToolbarMobile({
  filters,
  onStatusChange,
  onReceiverChange,
  onCategoryChange,
  onClearFilters,
  activeFiltersCount,
  categories,
  receivers,
  onCreateExpense,
}: CalendarToolbarMobileProps) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  return (
    <div className="flex w-full items-center justify-end gap-2 xl:hidden">
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Abrir filtros">
            <Filter className="w-4 h-4" aria-hidden="true" />
            <span className="ml-1">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 bg-[var(--event-pending-bg)] text-[var(--event-pending-text)] border-[var(--event-pending-border)] text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--calendar-text-primary)]">Status</label>
              <StatusFilterSelect value={filters.status} onChange={onStatusChange} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--calendar-text-primary)]">Recebedor</label>
              <ReceiverFilterSelect
                value={filters.receiver}
                onChange={onReceiverChange}
                receivers={receivers}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--calendar-text-primary)]">Categoria</label>
              <CategoryFilterSelect
                value={filters.categoryId}
                onChange={onCategoryChange}
                categories={categories}
              />
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="mt-2"
              >
                <X className="w-4 h-4 mr-2" aria-hidden="true" />
                Limpar filtros ({activeFiltersCount})
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Button
        onClick={onCreateExpense}
        aria-label="Nova despesa"
        size="icon"
        className="xl:hidden"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
