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
  hasCalendarSyncFailure,
  isExpenseCancellable,
  isExpenseEditable,
  requiresAmountConfirmation,
} from '@/constants/expenses';
import { useConfirmExpenseAmount } from '@/hooks/useConfirmExpenseAmount';
import { useResyncExpenseCalendar } from '@/hooks/useResyncExpenseCalendar';
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
  const resyncCalendarMutation = useResyncExpenseCalendar();

  // `isPayable` decide APENAS se o item "Pagar" é renderizado (status !==
  // CANCELLED). NÃO trocar por `requiresAmountConfirmation`: o ADR-003 exige que
  // "Pagar" continue visível na despesa com valor a confirmar — o bloqueio é
  // resolvido dentro do PaymentModal, não escondendo o item.
  const isPayable = expense.status !== ExpenseStatus.CANCELLED;
  const isCancellable = isExpenseCancellable(expense.status);
  // `requiresAmountConfirmation` decide uma pergunta diferente: se a via de
  // confirmação fora do pagamento ("Confirmar valor") deve aparecer.
  const canConfirmAmount = requiresAmountConfirmation(expense);
  // `hasCalendarSyncFailure` é a MESMA função que governa o marcador de falha:
  // menu e marcador não podem discordar.
  const canResyncCalendar = hasCalendarSyncFailure(expense);
  // A URL só serve se for utilizável. O gateway inerte do backend grava string
  // vazia ao "sincronizar" sem falar com o Google, e `'' !== null` passaria numa
  // checagem de nulidade — era o que abria `about:blank` numa aba nova.
  const hasUsableCalendarUrl =
    typeof expense.calendarEventUrl === 'string' &&
    expense.calendarEventUrl.trim() !== '';
  // Enquanto houver falha, "Abrir" fica escondido: o reenvio é a ação que
  // resolve, e oferecer as duas ao mesmo tempo divide a atenção da cliente num
  // momento em que só uma delas conserta o problema. Decisão do produto que
  // substitui a independência original — o ADR-002 do frontend guarda o
  // registro de por que um dia elas foram independentes.
  const hasCalendarEvent = hasUsableCalendarUrl && !canResyncCalendar;
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

  const handleResyncCalendar = () => {
    resyncCalendarMutation.mutate(expense.id);
  };

  // `window.open` é chamado dentro do handler (não capturado fora do
  // componente) para que o teste possa espioná-lo com `vi.spyOn(window, 'open')`.
  // O terceiro argumento não é opcional: sem `noopener,noreferrer` a aba aberta
  // recebe referência ao `window` de origem.
  const handleOpenCalendarEvent = () => {
    if (!hasUsableCalendarUrl) return;
    window.open(expense.calendarEventUrl!, '_blank', 'noopener,noreferrer');
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
          {/*
            "Abrir no Google Agenda" é mutuamente exclusivo com "Reenviar":
            havendo falha, só o reenvio aparece (ver `hasCalendarEvent` acima).
            Não usar `text-destructive`: nenhuma das duas ações destrói coisa
            alguma — essa classe marca apenas o "Cancelar".
          */}
          {canResyncCalendar && (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={handleResyncCalendar}
            >
              Reenviar para a agenda
            </DropdownMenuItem>
          )}
          {hasCalendarEvent && (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={handleOpenCalendarEvent}
            >
              Abrir no Google Agenda
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
