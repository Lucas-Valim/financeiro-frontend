import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCancelExpense } from '@/hooks/useCancelExpense';
import type { ExpenseDTO } from '@/types/expenses';

export interface ExpenseCancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseDTO;
}

/**
 * Confirmação de cancelamento de despesa.
 *
 * O botão de dispensa se chama "Voltar" (e não "Cancelar") para não competir
 * com a própria ação de cancelar a despesa, que é destrutiva e irreversível.
 */
export function ExpenseCancelDialog({ isOpen, onClose, expense }: ExpenseCancelDialogProps) {
  const { mutateAsync, isPending } = useCancelExpense();

  const handleConfirm = useCallback(async () => {
    try {
      await mutateAsync(expense.id);
      toast.success('Despesa cancelada com sucesso');
      onClose();
    } catch {
      // A mensagem em pt-BR já é exibida por useCancelExpense.onError; o modal
      // continua aberto para o usuário decidir se tenta de novo ou volta.
    }
  }, [mutateAsync, expense.id, onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isPending) onClose();
    },
    [onClose, isPending]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Cancelar Despesa</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar a despesa &quot;{expense.description}&quot;? Esta ação
            não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
