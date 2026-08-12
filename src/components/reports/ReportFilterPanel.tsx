import { useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseFilterFields } from '@/components/filters/ExpenseFilterFields';
import type { ReportFilter } from '@/types/reports';

export interface ReportFilterPanelProps {
  filters: ReportFilter;
  onFiltersChange: (filters: ReportFilter) => void;
  onClear: () => void;
}

/**
 * Grouped filter panel at the top of the report screen. The fields themselves
 * are shared with the expense grid's filter modal ({@link ExpenseFilterFields});
 * what this panel adds is the always-visible layout and the fact that every
 * change is applied immediately, so the summary reacts on each interaction. It
 * holds no state of its own: the filters live on the page.
 */
export function ReportFilterPanel({
  filters,
  onFiltersChange,
  onClear,
}: ReportFilterPanelProps) {
  const handleChange = useCallback(
    (patch: Partial<ReportFilter>) => {
      onFiltersChange({ ...filters, ...patch });
    },
    [filters, onFiltersChange]
  );

  return (
    <div
      className="rounded-lg border bg-card p-4"
      data-testid="report-filter-panel"
    >
      <ExpenseFilterFields
        filters={filters}
        onChange={handleChange}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      />

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="flex items-center gap-2"
          data-testid="clear-filters-button"
        >
          <X className="h-4 w-4" />
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
