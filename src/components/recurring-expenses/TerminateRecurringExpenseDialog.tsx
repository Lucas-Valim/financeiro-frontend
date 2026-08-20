import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTerminationPreview } from '@/hooks/useTerminationPreview';
import { useTerminateRecurringExpense } from '@/hooks/useTerminateRecurringExpense';
import { formatCurrency } from './recurring-expense-columns';
import type {
  RecurringExpenseDTO,
  TerminationExpenseDTO,
} from '@/types/recurring-expenses';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

export interface TerminateRecurringExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recurringExpense: RecurringExpenseDTO;
}

/**
 * Encerramento de recorrência com prévia. Campo de data de efeito, motivo opcional
 * e, abaixo deles, a prévia das despesas que serão canceladas.
 *
 * A prévia é lida de `cancellableExpenses` — o campo exato do contrato do backend.
 * Ler o nome errado devolveria `undefined` e a tela informaria que nada será
 * cancelado logo antes de cancelar despesas (o modo de falha mais caro da
 * funcionalidade). Alterar a data de efeito refaz a prévia (a data está na chave
 * de query do hook).
 *
 * Segue o padrão de `ExpenseCancelDialog`: `Dialog` puro, `variant="destructive"`
 * no botão de confirmação — que nomeia a quantidade — e a dispensa chamada
 * "Voltar", para não competir com a ação destrutiva.
 */
export function TerminateRecurringExpenseDialog({
  isOpen,
  onClose,
  recurringExpense,
}: TerminateRecurringExpenseDialogProps) {
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [wasOpen, setWasOpen] = useState(false);

  // Reset ao abrir, ajustando o estado durante a renderização (padrão recomendado
  // pelo React em vez de um efeito com setState síncrono): a data de efeito parte
  // de hoje e o motivo, vazio.
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setEffectiveDate(new Date());
    setReason('');
  } else if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  const { preview, isLoading } = useTerminationPreview({
    recurringExpenseId: recurringExpense.id,
    effectiveDate,
    enabled: isOpen,
  });

  const { mutateAsync, isPending } = useTerminateRecurringExpense();

  const cancellableExpenses = preview?.cancellableExpenses ?? [];
  const cancellableCount = cancellableExpenses.length;

  const confirmLabel =
    cancellableCount > 0
      ? `Encerrar e cancelar ${cancellableCount} ${cancellableCount === 1 ? 'despesa' : 'despesas'}`
      : 'Encerrar recorrência';

  const handleConfirm = useCallback(async () => {
    if (!effectiveDate) return;
    try {
      await mutateAsync({
        id: recurringExpense.id,
        input: { effectiveDate, reason: reason.trim() || null },
      });
      onClose();
    } catch {
      // A mensagem em pt-BR já é exibida por useTerminateRecurringExpense.onError;
      // o diálogo permanece aberto para o usuário decidir se tenta de novo ou volta.
    }
  }, [effectiveDate, mutateAsync, recurringExpense.id, reason, onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isPending) onClose();
    },
    [onClose, isPending],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[480px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Encerrar recorrência</DialogTitle>
          <DialogDescription>
            Encerrar &quot;{recurringExpense.description}&quot; cancela as despesas em
            aberto a partir da data de efeito. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="termination-effective-date">Data de efeito</Label>
            <ReactDatePicker
              id="termination-effective-date"
              selected={effectiveDate}
              onChange={(date: Date | null) => setEffectiveDate(date)}
              disabled={isPending}
              locale="pt-BR"
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecione a data"
              wrapperClassName="w-full"
              customInput={
                <Button
                  variant="outline"
                  type="button"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !effectiveDate && 'text-muted-foreground',
                  )}
                  disabled={isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveDate
                    ? format(effectiveDate, 'dd/MM/yyyy', { locale: ptBR })
                    : 'Selecione a data'}
                </Button>
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="termination-reason">Motivo (opcional)</Label>
            <Input
              id="termination-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: contrato encerrado"
              disabled={isPending}
              maxLength={255}
            />
          </div>

          <TerminationPreviewList
            isLoading={isLoading}
            cancellableExpenses={cancellableExpenses}
          />
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
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
            disabled={isPending || !effectiveDate}
            className="w-full sm:w-auto"
          >
            {isPending ? 'Encerrando...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TerminationPreviewListProps {
  isLoading: boolean;
  cancellableExpenses: TerminationExpenseDTO[];
}

function TerminationPreviewList({ isLoading, cancellableExpenses }: TerminationPreviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="termination-preview-skeleton">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (cancellableExpenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="termination-preview-empty">
        Nenhuma despesa em aberto será cancelada.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Despesas que serão canceladas</p>
      <ul className="space-y-2" data-testid="termination-preview-list">
        {cancellableExpenses.map((expense) => (
          <li
            key={expense.id}
            className="rounded-md border border-border p-3 text-sm"
            data-testid="termination-preview-item"
          >
            <p className="font-medium">{expense.description}</p>
            <p className="text-muted-foreground">
              Vence em {format(expense.dueDate, 'dd/MM/yyyy', { locale: ptBR })} ·{' '}
              {formatCurrency(expense.amount)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
