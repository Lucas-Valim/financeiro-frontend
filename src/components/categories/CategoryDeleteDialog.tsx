import { useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteCategory } from '@/hooks/useDeleteCategory';
import type { CategoryDTO } from '@/types/categories';
import { ORGANIZATION_ID } from '@/constants/expenses';
import { LINKED_EXPENSES_ERROR_MESSAGE } from '@/constants/categories';

export interface CategoryDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryDTO;
}

export function CategoryDeleteDialog({ isOpen, onClose, category }: CategoryDeleteDialogProps) {
  const deleteMutation = useDeleteCategory();
  const { reset } = deleteMutation;

  const isBlocked =
    deleteMutation.isError &&
    deleteMutation.error?.message === LINKED_EXPENSES_ERROR_MESSAGE;

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync({
        id: category.id,
        organizationId: ORGANIZATION_ID,
      });
      onClose();
    } catch {
      // Non-blocked errors are toasted by useDeleteCategory.onError; blocked state renders inline below
    }
  }, [deleteMutation, category.id, onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !deleteMutation.isPending) onClose();
    },
    [onClose, deleteMutation.isPending]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Excluir Categoria</DialogTitle>
          <DialogDescription>
            {isBlocked
              ? LINKED_EXPENSES_ERROR_MESSAGE
              : 'Tem certeza que deseja excluir esta categoria?'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          {isBlocked ? (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
