'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ExpenseDTO } from '@/types/expenses';
import { formatCurrency } from '@/lib/formatCurrency';

export interface PaymentAmountConfirmationProps {
  /** The expense whose inherited amount must be confirmed before payment. */
  expense: ExpenseDTO;
  /** Fired when the user confirms the suggested amount. */
  onConfirm: () => void;
  /** Fired when the user dismisses the blocked state. */
  onCancel: () => void;
  /** Whether the confirmation request is in flight. */
  isConfirming: boolean;
}

const BLOCKED_REASON =
  'Esta despesa veio de uma recorrência de valor variável. O valor exibido é o da ocorrência anterior e precisa ser confirmado antes do pagamento.';

/**
 * Terceiro estado do `PaymentModal`: a despesa de recorrência variável carrega
 * um valor estimado da ocorrência anterior e o backend recusa pagá-la com `409`
 * enquanto ele não for confirmado.
 *
 * O valor sugerido é sempre exibido com a origem explícita ("valor da ocorrência
 * anterior"), nunca como número neutro, para não ancorar o usuário a confirmar
 * no automático sem conferir o boleto (ADR-003).
 */
export function PaymentAmountConfirmation({
  expense,
  onConfirm,
  onCancel,
  isConfirming,
}: PaymentAmountConfirmationProps) {
  return (
    <div className="space-y-4" data-testid="amount-confirmation-state">
      <div className="flex items-start gap-3 rounded-md bg-amber-50 p-4 text-amber-900">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" data-testid="amount-confirmation-icon" />
        <p className="text-sm" data-testid="amount-confirmation-reason">
          {BLOCKED_REASON}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Valor da ocorrência anterior</p>
        <p className="text-2xl font-semibold" data-testid="amount-confirmation-suggested">
          {formatCurrency(expense.amount)}
        </p>
        <p className="text-xs text-muted-foreground" data-testid="amount-confirmation-origin">
          Para pagar um valor diferente, edite a despesa.
        </p>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isConfirming}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className="w-full sm:w-auto"
          data-testid="confirm-amount-button"
        >
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            'Confirmar valor'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
