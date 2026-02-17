import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ExpenseFormFields } from './ExpenseFormFields';
import { useExpenseForm } from '@/hooks/useExpenseForm';
import type { ExpenseDTO } from '@/types/expenses';

export interface ExpenseFormModalProps {
  /** Controls whether the modal is open */
  isOpen: boolean;
  /** Callback fired when the modal should close */
  onClose: () => void;
  /** Callback fired when form submission succeeds */
  onSuccess?: (expense: ExpenseDTO) => void;
  /** Optional expense to edit. If provided, modal will be in edit mode */
  expense?: ExpenseDTO | null;
}

/**
 * Modal component for creating and editing expenses
 * Features:
 * - Unsaved changes confirmation dialog
 * - Real-time form validation
 * - Support for create and update modes
 * - Loading state during submission
 */
export function ExpenseFormModal({
  isOpen,
  onClose,
  onSuccess,
  expense = null,
}: ExpenseFormModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isEditMode = Boolean(expense?.id);
  const modalTitle = isEditMode ? 'Editar Despesa' : 'Nova Despesa';
  const modalDescription = isEditMode
    ? 'Altere os dados da despesa abaixo.'
    : 'Preencha os dados para criar uma nova despesa.';
  const submitButtonText = isEditMode ? 'Salvar Alterações' : 'Criar Despesa';

  const {
    form,
    isDirty,
    isSubmitting,
    onSubmit,
    resetForm,
  } = useExpenseForm({
    initialExpense: expense,
    onSuccess: (result) => {
      onSuccess?.(result);
      handleClose();
    },
  });

  // Reset form when modal opens with new expense data
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Handle confirm discard
  const handleConfirmDiscard = useCallback(() => {
    setShowConfirmDialog(false);
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Handle cancel discard (stay in modal)
  const handleCancelDiscard = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // Handle dialog open change (from clicking outside or escape)
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onSubmit();
    },
    [onSubmit]
  );

  return (
    <>
      {/* Main Form Modal */}
      <Dialog open={isOpen && !showConfirmDialog} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ExpenseFormFields disabled={isSubmitting} />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">&#9696;</span>
                      {isEditMode ? 'Salvando...' : 'Criando...'}
                    </>
                  ) : (
                    submitButtonText
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Alterações não salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Deseja descartar as alterações e sair?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDiscard}
              className="w-full sm:w-auto"
            >
              Continuar Editando
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDiscard}
              className="w-full sm:w-auto"
            >
              Descartar e Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
