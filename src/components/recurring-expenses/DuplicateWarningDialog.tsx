import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  RECURRENCE_AMOUNT_TYPE_LABELS,
  formatDueDay,
} from '@/constants/recurring-expenses';
import { formatCurrency } from './recurring-expense-columns';
import type { RecurringExpenseDTO } from '@/types/recurring-expenses';

export interface DuplicateWarningDialogProps {
  isOpen: boolean;
  /** Recorrências parecidas devolvidas pelo `duplicate-check`. */
  duplicates: RecurringExpenseDTO[];
  /** Prossegue com o submit original — o aviso NUNCA bloqueia. */
  onConfirm: () => void;
  /** "Voltar": mantém o formulário aberto e preenchido, sem disparar o `POST`. */
  onCancel: () => void;
}

/**
 * Aviso NÃO bloqueante de duplicidade. Renderizado como IRMÃO do
 * `RecurringExpenseFormModal` (nunca dentro do seu `DialogContent`), controlado
 * pelo estado do modal — `Dialog` Radix aninhado em `Dialog` empilha dois focus
 * traps e dois portais.
 *
 * Segue o padrão de `ExpenseCancelDialog`: `Dialog` puro com `DialogFooter` de
 * dois botões, sem `alert-dialog`. Aqui, porém, o botão de confirmação NÃO é
 * destrutivo — confirmar apenas prossegue com a criação já pretendida.
 */
export function DuplicateWarningDialog({
  isOpen,
  duplicates,
  onConfirm,
  onCancel,
}: DuplicateWarningDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Recorrências parecidas encontradas</DialogTitle>
          <DialogDescription>
            Já existem recorrências com favorecido, valor e dia de vencimento
            semelhantes. Confira se não é uma duplicidade antes de continuar.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-[40vh] space-y-2 overflow-y-auto" data-testid="duplicate-list">
          {duplicates.map((duplicate) => (
            <li
              key={duplicate.id}
              className="rounded-md border border-border p-3 text-sm"
              data-testid="duplicate-item"
            >
              <p className="font-medium">{duplicate.description}</p>
              <p className="text-muted-foreground">
                {RECURRENCE_AMOUNT_TYPE_LABELS[duplicate.amountType]} ·{' '}
                {formatCurrency(duplicate.amount)} · {formatDueDay(duplicate.dueDay)}
              </p>
            </li>
          ))}
        </ul>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            Criar mesmo assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
