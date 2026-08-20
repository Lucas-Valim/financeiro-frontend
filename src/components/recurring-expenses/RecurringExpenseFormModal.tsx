import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DiscardChangesDialog } from '@/components/shared/DiscardChangesDialog';
import { Form } from '@/components/ui/form';
import { ORGANIZATION_ID } from '@/constants/expenses';
import { useRecurringExpenseForm } from '@/hooks/useRecurringExpenseForm';
import { RecurringExpenseFormFields } from './RecurringExpenseFormFields';
import { DuplicateWarningDialog } from './DuplicateWarningDialog';
import { formatCurrency } from './recurring-expense-columns';
import type {
  RecurringExpenseDTO,
  GeneratedOccurrenceDTO,
} from '@/types/recurring-expenses';

export interface RecurringExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Recorrência em edição/visualização; ausente ao criar. */
  recurringExpense?: RecurringExpenseDTO;
  /** Abre o formulário somente-leitura (recorrência encerrada). */
  readOnly?: boolean;
  /** Disparado quando a criação/edição é bem-sucedida. */
  onSuccess?: (recurringExpense: RecurringExpenseDTO) => void;
}

/**
 * Modal de criação e edição de recorrência. `Dialog` de aba única — sem `Tabs`,
 * porque recorrências não têm upload. Reaproveita de `ExpenseFormModal` a
 * confirmação de descarte quando o formulário está sujo e o modo somente-leitura.
 *
 * O aviso de duplicidade (`DuplicateWarningDialog`) é renderizado como IRMÃO do
 * formulário — nunca dentro do seu `DialogContent` —, no mesmo padrão do
 * discard-confirm: enquanto ele está aberto o `Dialog` do formulário fica
 * fechado, evitando dois focus traps empilhados.
 *
 * Após uma criação bem-sucedida, o modal NÃO fecha: exibe as `generatedOccurrences`
 * da resposta (descrição, vencimento e valor) para tornar visível o resultado. A
 * edição, que não gera ocorrências, fecha imediatamente.
 */
export function RecurringExpenseFormModal({
  isOpen,
  onClose,
  recurringExpense,
  readOnly = false,
  onSuccess,
}: RecurringExpenseFormModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Estável durante o ciclo de vida do modal: decide se o sucesso fecha (edição)
  // ou mantém aberto para exibir as ocorrências (criação). NÃO usar o `isEditMode`
  // do hook, que vira `true` após a criação definir a recorrência.
  const isEditModeInitial = Boolean(recurringExpense?.id);

  const title = readOnly
    ? 'Detalhes da recorrência'
    : isEditModeInitial
      ? 'Editar recorrência'
      : 'Nova recorrência';
  const description = readOnly
    ? 'Visualize os dados da recorrência.'
    : isEditModeInitial
      ? 'Altere os dados da recorrência abaixo.'
      : 'Preencha os dados para criar uma nova recorrência.';
  const submitButtonText = isEditModeInitial ? 'Salvar Alterações' : 'Criar Recorrência';

  const {
    form,
    isDirty,
    isSubmitting,
    onSubmit,
    resetForm,
    generatedOccurrences,
    duplicates,
    isDuplicateDialogOpen,
    confirmDuplicate,
    cancelDuplicate,
  } = useRecurringExpenseForm({
    initialRecurringExpense: recurringExpense ?? null,
    onSuccess: (result) => {
      onSuccess?.(result);
      // Edição fecha na hora; criação permanece aberta para exibir as ocorrências.
      if (isEditModeInitial) {
        onClose();
      }
    },
  });

  const showOccurrences = generatedOccurrences.length > 0;

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleClose = useCallback(
    (force = false) => {
      if (!force && isDirty) {
        setShowConfirmDialog(true);
      } else {
        onClose();
      }
    },
    [isDirty, onClose],
  );

  const handleConfirmDiscard = useCallback(() => {
    setShowConfirmDialog(false);
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleCancelDiscard = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Na visualização de ocorrências e no modo leitura, fechar é direto: não
        // há alterações pendentes a confirmar.
        if (readOnly || showOccurrences) {
          onClose();
        } else {
          handleClose();
        }
      }
    },
    [handleClose, onClose, readOnly, showOccurrences],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onSubmit();
    },
    [onSubmit],
  );

  return (
    <>
      {/* Formulário — fechado enquanto o discard-confirm ou o aviso de duplicidade
          estão abertos, para nunca empilhar dois focus traps Radix. */}
      <Dialog
        open={isOpen && !showConfirmDialog && !isDuplicateDialogOpen}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{showOccurrences ? 'Recorrência criada' : title}</DialogTitle>
            <DialogDescription>
              {showOccurrences
                ? 'As ocorrências abaixo foram geradas para esta recorrência.'
                : description}
            </DialogDescription>
          </DialogHeader>

          {showOccurrences ? (
            <GeneratedOccurrencesView
              occurrences={generatedOccurrences}
              onDone={onClose}
            />
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0">
              <Form {...form}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className={readOnly ? 'opacity-80' : ''}>
                    <RecurringExpenseFormFields
                      disabled={isSubmitting || readOnly}
                      organizationId={ORGANIZATION_ID}
                      isEditMode={isEditModeInitial}
                    />
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    {readOnly ? (
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
                          onClick={() => handleClose()}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto"
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin mr-2">&#9696;</span>
                              {isEditModeInitial ? 'Salvando...' : 'Criando...'}
                            </>
                          ) : (
                            submitButtonText
                          )}
                        </Button>
                      </>
                    )}
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de descarte — irmão do formulário. */}
      <DiscardChangesDialog
        isOpen={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onKeepEditing={handleCancelDiscard}
        onDiscard={handleConfirmDiscard}
      />

      {/* Aviso de duplicidade — irmão do formulário, não bloqueante. */}
      <DuplicateWarningDialog
        isOpen={isDuplicateDialogOpen}
        duplicates={duplicates}
        onConfirm={confirmDuplicate}
        onCancel={cancelDuplicate}
      />
    </>
  );
}

interface GeneratedOccurrencesViewProps {
  occurrences: GeneratedOccurrenceDTO[];
  onDone: () => void;
}

function GeneratedOccurrencesView({ occurrences, onDone }: GeneratedOccurrencesViewProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ul
        className="flex-1 space-y-2 overflow-y-auto"
        data-testid="generated-occurrences-list"
      >
        {occurrences.map((occurrence) => (
          <li
            key={occurrence.id}
            className="rounded-md border border-border p-3 text-sm"
            data-testid="generated-occurrence-item"
          >
            <p className="font-medium">{occurrence.description}</p>
            <p className="text-muted-foreground">
              Vence em {format(occurrence.dueDate, 'dd/MM/yyyy', { locale: ptBR })} ·{' '}
              {formatCurrency(occurrence.amount)}
            </p>
          </li>
        ))}
      </ul>

      <DialogFooter className="mt-4 gap-2 sm:gap-0">
        <Button type="button" onClick={onDone} className="w-full sm:w-auto">
          Concluir
        </Button>
      </DialogFooter>
    </div>
  );
}
