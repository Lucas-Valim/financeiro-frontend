import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RecurringExpenseFormModal } from './RecurringExpenseFormModal';
import { TerminateRecurringExpenseDialog } from './TerminateRecurringExpenseDialog';
import type { RecurringExpenseDTO } from '@/types/recurring-expenses';

interface RecurringExpenseActionsProps {
  recurringExpense: RecurringExpenseDTO;
}

/**
 * Menu de ações por linha da recorrência, no mesmo padrão de `ExpenseActions`:
 * um `DropdownMenu` com gatilho `MoreVertical` e os modais renderizados como
 * IRMÃOS do menu, cada um com seu próprio estado local — nunca aninhados dentro
 * do `DropdownMenuContent` nem de outro `DialogContent`.
 *
 * Numa recorrência encerrada, "Editar" vira "Ver detalhes" e o formulário abre
 * somente-leitura — a interface explica o motivo em vez de apenas desabilitar o
 * controle. "Encerrar" só aparece enquanto o estado é `ACTIVE`, com estilo
 * destrutivo, como o item de cancelamento de despesa.
 */
export function RecurringExpenseActions({ recurringExpense }: RecurringExpenseActionsProps) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);

  const isActive = recurringExpense.status === 'ACTIVE';
  const editMenuLabel = isActive ? 'Editar' : 'Ver detalhes';

  const handleEdit = () => {
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
  };

  const handleTerminate = () => {
    setIsTerminateDialogOpen(true);
  };

  const handleCloseTerminateDialog = () => {
    setIsTerminateDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" data-testid="morevertical-icon" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer" onSelect={handleEdit}>
            {editMenuLabel}
          </DropdownMenuItem>
          {isActive && (
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={handleTerminate}
            >
              Encerrar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <RecurringExpenseFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        recurringExpense={recurringExpense}
        readOnly={!isActive}
      />
      <TerminateRecurringExpenseDialog
        isOpen={isTerminateDialogOpen}
        onClose={handleCloseTerminateDialog}
        recurringExpense={recurringExpense}
      />
    </>
  );
}
