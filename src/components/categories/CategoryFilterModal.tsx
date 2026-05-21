import { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface CategoryFilter {
  name: string;
}

export const EMPTY_CATEGORY_FILTER: CategoryFilter = { name: '' };

export interface CategoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
}

export function CategoryFilterModal({
  isOpen,
  onClose,
  filter,
  onFilterChange,
}: CategoryFilterModalProps) {
  const isActive = filter.name !== '';

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ ...filter, name: e.target.value });
    },
    [onFilterChange, filter]
  );

  const handleClear = useCallback(() => {
    onFilterChange({ ...EMPTY_CATEGORY_FILTER });
  }, [onFilterChange]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Filtrar Categorias
            {isActive && (
              <span
                data-testid="filter-active-badge"
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                Filtro ativo
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Busque categorias pelo nome. O filtro é aplicado em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          <label htmlFor="category-filter-name" className="text-sm font-medium">
            Nome
          </label>
          <Input
            id="category-filter-name"
            type="text"
            placeholder="Buscar por nome"
            value={filter.name}
            onChange={handleNameChange}
            autoFocus
          />
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:items-center sm:justify-between">
          {isActive ? (
            <Button
              type="button"
              variant="link"
              onClick={handleClear}
              className="h-auto px-0 sm:px-0"
            >
              Limpar filtros
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}
          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
