import * as React from 'react';
import { useMemo } from 'react';
import { ExpenseStatus } from '@/constants/expenses';
import { ExpenseFilter } from '@/types/expenses';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EXPENSE_STATUS_LABELS } from '@/constants/expenses';

export interface FilterModalProps {
  filters: ExpenseFilter;
  onApply: (filters: ExpenseFilter) => void;
  onClear: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export function FilterModal({
  filters,
  onApply,
  onClear,
  onClose,
  isOpen,
}: FilterModalProps) {
  const safeFilters = useMemo(() => filters ?? {}, [filters]);
  const [localFilters, setLocalFilters] = React.useState<ExpenseFilter>(safeFilters);

  React.useEffect(() => {
    setLocalFilters(safeFilters);
  }, [safeFilters]);

  const handleStatusChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      status: value as ExpenseStatus,
    }));
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters((prev) => ({
      ...prev,
      receiver: e.target.value || undefined,
    }));
  };

  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters((prev) => ({
      ...prev,
      municipality: e.target.value || undefined,
    }));
  };

  const handleDueDateStartChange = (date: Date | null) => {
    setLocalFilters((prev) => ({
      ...prev,
      dueDateStart: date || undefined,
    }));
  };

  const handleDueDateEndChange = (date: Date | null) => {
    setLocalFilters((prev) => ({
      ...prev,
      dueDateEnd: date || undefined,
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    const clearedFilters: ExpenseFilter = {};
    setLocalFilters(clearedFilters);
    onClear();
  };

  const handleCancel = () => {
    setLocalFilters(filters);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filtrar Despesas</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select
              value={localFilters.status ?? ''}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ExpenseStatus.OPEN}>
                  {EXPENSE_STATUS_LABELS.OPEN}
                </SelectItem>
                <SelectItem value={ExpenseStatus.OVERDUE}>
                  {EXPENSE_STATUS_LABELS.OVERDUE}
                </SelectItem>
                <SelectItem value={ExpenseStatus.PAID}>
                  {EXPENSE_STATUS_LABELS.PAID}
                </SelectItem>
                <SelectItem value={ExpenseStatus.CANCELLED}>
                  {EXPENSE_STATUS_LABELS.CANCELLED}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="receiver" className="text-sm font-medium">
              Recebedor
            </label>
            <Input
              id="receiver"
              type="text"
              placeholder="Buscar por recebedor"
              value={localFilters.receiver || ''}
              onChange={handleRecipientChange}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="municipality" className="text-sm font-medium">
              Município
            </label>
            <Input
              id="municipality"
              type="text"
              placeholder="Buscar por município"
              value={localFilters.municipality || ''}
              onChange={handleMunicipalityChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="dueDateStart" className="text-sm font-medium">
                Data Inicial
              </label>
              <Input
                id="dueDateStart"
                type="date"
                value={
                  localFilters.dueDateStart
                    ? localFilters.dueDateStart.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  handleDueDateStartChange(
                    e.target.value ? new Date(e.target.value) : null
                  )
                }
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="dueDateEnd" className="text-sm font-medium">
                Data Final
              </label>
              <Input
                id="dueDateEnd"
                type="date"
                value={
                  localFilters.dueDateEnd
                    ? localFilters.dueDateEnd.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  handleDueDateEndChange(
                    e.target.value ? new Date(e.target.value) : null
                  )
                }
              />
            </div>
          </div>
        </div>

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
