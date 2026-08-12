import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { ExpenseFilter } from '@/types/expenses';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExpenseFilterFields } from '@/components/filters/ExpenseFilterFields';

export interface FilterModalProps {
  filters: ExpenseFilter;
  onApply: (filters: ExpenseFilter) => void;
  onClear: () => void;
  onClose: () => void;
  isOpen: boolean;
}

/**
 * Filter dialog for the expense grid. It renders the same fields as the report
 * screen ({@link ExpenseFilterFields}) but buffers the changes in a local draft
 * so nothing is fetched until the user confirms with "Aplicar".
 */
export function FilterModal({
  filters,
  onApply,
  onClear,
  onClose,
  isOpen,
}: FilterModalProps) {
  const safeFilters = useMemo(() => filters ?? {}, [filters]);
  const [localFilters, setLocalFilters] =
    React.useState<ExpenseFilter>(safeFilters);

  React.useEffect(() => {
    setLocalFilters(safeFilters);
  }, [safeFilters]);

  const handleFieldsChange = useCallback((patch: Partial<ExpenseFilter>) => {
    setLocalFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear();
  };

  const handleCancel = () => {
    setLocalFilters(safeFilters);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filtrar Despesas</DialogTitle>
        </DialogHeader>

        <ExpenseFilterFields
          filters={localFilters}
          onChange={handleFieldsChange}
          className="grid-cols-1 py-4"
        />

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="w-full sm:w-auto"
          >
            Limpar
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto"
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
