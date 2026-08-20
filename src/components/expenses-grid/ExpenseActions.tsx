import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { ExpenseCancelDialog } from '@/components/expenses/ExpenseCancelDialog';
import {
  ExpenseStatus,
  isExpenseCancellable,
  isExpenseEditable,
  requiresAmountConfirmation,
} from '@/constants/expenses';
import { useConfirmExpenseAmount } from '@/hooks/useConfirmExpenseAmount';
import type { ExpenseDTO } from '@/types/expenses';

interface ExpenseActionsProps {
  expense: ExpenseDTO;
  /** Callback fired when the user selects "Editar". */
  onEdit?: (expense: ExpenseDTO) => void;
}

export function ExpenseActions({ expense, onEdit }: ExpenseActionsProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const confirmAmountMutation = useConfirmExpenseAmount();

  // `isPayable` decide APENAS se o item "Pagar" é renderizado (status !==
  // CANCELLED). NÃO trocar por `requiresAmountConfirmation`: o ADR-003 exige que
  // "Pagar" continue visível na despesa com valor a confirmar — o bloqueio é
  // resolvido dentro do PaymentModal, não escondendo o item.
  const isPayable = expense.status !== ExpenseStatus.CANCELLED;
  const isCancellable = isExpenseCancellable(expense.status);
  // `requiresAmountConfirmation` decide uma pergunta diferente: se a via de
  // confirmação fora do pagamento ("Confirmar valor") deve aparecer.
  const canConfirmAmount = requiresAmountConfirmation(expense);
  const payMenuLabel =
    expense.status === ExpenseStatus.PAID ? 'Ver Comprovante' : 'Pagar';
  const editMenuLabel = isExpenseEditable(expense.status)
    ? 'Editar'
    : 'Ver Detalhes';

  const handleEdit = () => {
    onEdit?.(expense);
  };

  const handlePay = () => {
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const handleConfirmAmount = () => {
    confirmAmountMutation.mutate(expense.id);
  };

  const handleCancel = () => {
    setIsCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setIsCancelDialogOpen(false);
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
          {isPayable && (
            <DropdownMenuItem className="cursor-pointer" onSelect={handlePay}>
              {payMenuLabel}
            </DropdownMenuItem>
          )}
          {canConfirmAmount && (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={handleConfirmAmount}
            >
              Confirmar valor
            </DropdownMenuItem>
          )}
          {isCancellable && (
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={handleCancel}
            >
              Cancelar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        expense={expense}
      />
      <ExpenseCancelDialog
        isOpen={isCancelDialogOpen}
        onClose={handleCloseCancelDialog}
        expense={expense}
      />
    </>
  );
}
