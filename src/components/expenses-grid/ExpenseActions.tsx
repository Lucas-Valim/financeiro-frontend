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
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

interface ExpenseActionsProps {
  expense: ExpenseDTO;
  /** Callback fired when the user selects "Editar". */
  onEdit?: (expense: ExpenseDTO) => void;
}

export function ExpenseActions({ expense, onEdit }: ExpenseActionsProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const isPayable = expense.status !== ExpenseStatus.CANCELLED;
  const payMenuLabel =
    expense.status === ExpenseStatus.PAID ? 'Ver Comprovante' : 'Pagar';

  const handleEdit = () => {
    onEdit?.(expense);
  };

  const handlePay = () => {
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
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
            Editar
          </DropdownMenuItem>
          {isPayable && (
            <DropdownMenuItem className="cursor-pointer" onSelect={handlePay}>
              {payMenuLabel}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="cursor-pointer">Cancelar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        expense={expense}
      />
    </>
  );
}
