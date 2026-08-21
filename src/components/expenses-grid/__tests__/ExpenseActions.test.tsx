import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseActions } from '../ExpenseActions';
import type { ExpenseDTO } from '@/types/expenses';
import { ExpenseStatus } from '@/constants/expenses';

vi.mock('@/components/payment/PaymentModal', () => ({
  PaymentModal: vi.fn(({ isOpen, onClose, expense }) => {
    if (!isOpen || !expense) return null;
    return (
      <div data-testid="payment-modal" data-expense-id={expense.id}>
        <button onClick={onClose} data-testid="close-modal-button">
          Close
        </button>
      </div>
    );
  }),
}));

vi.mock('@/components/expenses/ExpenseCancelDialog', () => ({
  ExpenseCancelDialog: vi.fn(({ isOpen, onClose, expense }) => {
    if (!isOpen || !expense) return null;
    return (
      <div data-testid="cancel-dialog" data-expense-id={expense.id}>
        <button onClick={onClose} data-testid="close-cancel-dialog-button">
          Fechar
        </button>
      </div>
    );
  }),
}));

const mockConfirmAmountMutate = vi.fn();

vi.mock('@/hooks/useConfirmExpenseAmount', () => ({
  useConfirmExpenseAmount: () => ({
    mutate: mockConfirmAmountMutate,
    isPending: false,
  }),
}));

const mockResyncCalendarMutate = vi.fn();

vi.mock('@/hooks/useResyncExpenseCalendar', () => ({
  useResyncExpenseCalendar: () => ({
    mutate: mockResyncCalendarMutate,
    isPending: false,
  }),
}));

const mockExpense: ExpenseDTO = {
  id: 'expense-1',
  organizationId: 'org-1',
  categoryId: 'cat-1',
  favorecidoId: null,
  description: 'Test Expense',
  amount: 1234.56,
  currency: 'BRL',
  dueDate: new Date('2024-01-15'),
  status: ExpenseStatus.OPEN,
  paymentMethod: null,
  paymentProof: null,
  paymentProofUrl: null,
  paymentDate: null,
  receiver: 'Test Receiver',
  municipality: 'Test City',
  serviceInvoice: null,
  serviceInvoiceUrl: null,
  bankBillUrl: null,
  recurringExpenseId: null,
  occurrenceMonth: null,
  amountPendingConfirmation: false,
  documentPending: false,
  calendarSyncStatus: null,
  calendarEventUrl: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('ExpenseActions', () => {
  describe('Trigger', () => {
    it('renders a dropdown trigger button with the MoreVertical icon', () => {
      render(<ExpenseActions expense={mockExpense} />);

      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
      expect(screen.getByTestId('morevertical-icon')).toBeInTheDocument();
    });
  });

  describe('Dropdown Menu', () => {
    it('renders Editar, Pagar and Cancelar actions for OPEN status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={mockExpense} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Editar')).toBeInTheDocument();
      expect(screen.getByText('Pagar')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('calls onEdit when Editar is selected', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<ExpenseActions expense={mockExpense} onEdit={onEdit} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Editar'));

      expect(onEdit).toHaveBeenCalledWith(mockExpense);
    });

    it('does not throw when onEdit is not provided', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={mockExpense} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Editar'));

      expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    });
  });

  describe('Pay Action Visibility', () => {
    it('shows Pagar for OPEN status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.OPEN }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Pagar')).toBeInTheDocument();
    });

    it('shows Pagar for OVERDUE status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.OVERDUE }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Pagar')).toBeInTheDocument();
    });

    it('shows Ver Comprovante instead of Pagar for PAID status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.PAID }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Ver Comprovante')).toBeInTheDocument();
      expect(screen.queryByText('Pagar')).not.toBeInTheDocument();
    });

    it('does NOT show a pay action for CANCELLED status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.CANCELLED }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('Pagar')).not.toBeInTheDocument();
      expect(screen.queryByText('Ver Comprovante')).not.toBeInTheDocument();
    });
  });

  describe('Edit Action Label', () => {
    it('shows Editar for OPEN status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.OPEN }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Editar')).toBeInTheDocument();
      expect(screen.queryByText('Ver Detalhes')).not.toBeInTheDocument();
    });

    it('shows Editar for OVERDUE status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.OVERDUE }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Editar')).toBeInTheDocument();
      expect(screen.queryByText('Ver Detalhes')).not.toBeInTheDocument();
    });

    it('shows Ver Detalhes instead of Editar for PAID status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.PAID }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Ver Detalhes')).toBeInTheDocument();
      expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    });

    it('shows Ver Detalhes instead of Editar for CANCELLED status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.CANCELLED }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Ver Detalhes')).toBeInTheDocument();
      expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    });

    it('still calls onEdit when Ver Detalhes is selected for a PAID expense', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const paidExpense = { ...mockExpense, status: ExpenseStatus.PAID };
      render(<ExpenseActions expense={paidExpense} onEdit={onEdit} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Ver Detalhes'));

      expect(onEdit).toHaveBeenCalledWith(paidExpense);
    });
  });

  describe('PaymentModal Integration', () => {
    it('does not render PaymentModal initially', () => {
      render(<ExpenseActions expense={mockExpense} />);

      expect(screen.queryByTestId('payment-modal')).not.toBeInTheDocument();
    });

    it('opens PaymentModal with the correct expense when Pagar is selected', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={mockExpense} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Pagar'));

      const modal = screen.getByTestId('payment-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('data-expense-id', mockExpense.id);
    });

    it('closes PaymentModal when onClose is invoked', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={mockExpense} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Pagar'));
      await user.click(screen.getByTestId('close-modal-button'));

      expect(screen.queryByTestId('payment-modal')).not.toBeInTheDocument();
    });
  });

  describe('Cancel Action Visibility', () => {
    it('shows Cancelar for OPEN status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.OPEN }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('shows Cancelar for OVERDUE status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.OVERDUE }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('does NOT show Cancelar for PAID status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.PAID }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
    });

    it('does NOT show Cancelar for CANCELLED status', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={{ ...mockExpense, status: ExpenseStatus.CANCELLED }} />);

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
    });
  });

  describe('ExpenseCancelDialog Integration', () => {
    it('does not render ExpenseCancelDialog initially', () => {
      render(<ExpenseActions expense={mockExpense} />);

      expect(screen.queryByTestId('cancel-dialog')).not.toBeInTheDocument();
    });

    it('opens ExpenseCancelDialog with the correct expense when Cancelar is selected', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={mockExpense} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Cancelar'));

      const dialog = screen.getByTestId('cancel-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('data-expense-id', mockExpense.id);
    });

    it('does not open the PaymentModal when Cancelar is selected', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={mockExpense} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Cancelar'));

      expect(screen.queryByTestId('payment-modal')).not.toBeInTheDocument();
    });

    it('closes ExpenseCancelDialog when onClose is invoked', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={mockExpense} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Cancelar'));
      await user.click(screen.getByTestId('close-cancel-dialog-button'));

      expect(screen.queryByTestId('cancel-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Confirm Amount Action', () => {
    beforeEach(() => {
      mockConfirmAmountMutate.mockClear();
    });

    const pendingExpense: ExpenseDTO = {
      ...mockExpense,
      amountPendingConfirmation: true,
    };

    it('shows "Confirmar valor" when amountPendingConfirmation is true', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={pendingExpense} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Confirmar valor')).toBeInTheDocument();
    });

    it('does NOT show "Confirmar valor" when amountPendingConfirmation is false', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={mockExpense} />);

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('Confirmar valor')).not.toBeInTheDocument();
    });

    it('still shows "Pagar" for an expense pending confirmation (isPayable not swapped)', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={pendingExpense} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Pagar')).toBeInTheDocument();
    });

    it('does NOT show "Pagar" for a CANCELLED expense, as today', async () => {
      const user = userEvent.setup();
      const cancelledPending: ExpenseDTO = {
        ...mockExpense,
        status: ExpenseStatus.CANCELLED,
        amountPendingConfirmation: true,
      };
      render(<ExpenseActions expense={cancelledPending} />);

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('Pagar')).not.toBeInTheDocument();
    });

    it('fires the confirm mutation with the expense id without opening the PaymentModal', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={pendingExpense} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Confirmar valor'));

      expect(mockConfirmAmountMutate).toHaveBeenCalledWith(pendingExpense.id);
      expect(screen.queryByTestId('payment-modal')).not.toBeInTheDocument();
    });
  });

  describe('Calendar Sync Actions', () => {
    beforeEach(() => {
      mockResyncCalendarMutate.mockClear();
    });

    const RESYNC_LABEL = 'Reenviar para a agenda';
    const OPEN_LABEL = 'Abrir no Google Agenda';
    const eventUrl = 'https://calendar.google.com/event?eid=abc123';

    describe('"Reenviar para a agenda" visibility', () => {
      it('shows the resync item when calendarSyncStatus is FAILED', async () => {
        const user = userEvent.setup();
        render(
          <ExpenseActions
            expense={{ ...mockExpense, calendarSyncStatus: 'FAILED' }}
          />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.getByText(RESYNC_LABEL)).toBeInTheDocument();
      });

      it('shows the resync item when calendarSyncStatus is UNAUTHORIZED', async () => {
        const user = userEvent.setup();
        render(
          <ExpenseActions
            expense={{ ...mockExpense, calendarSyncStatus: 'UNAUTHORIZED' }}
          />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.getByText(RESYNC_LABEL)).toBeInTheDocument();
      });

      it('does NOT show the resync item when calendarSyncStatus is SYNCED', async () => {
        const user = userEvent.setup();
        render(
          <ExpenseActions
            expense={{ ...mockExpense, calendarSyncStatus: 'SYNCED' }}
          />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.queryByText(RESYNC_LABEL)).not.toBeInTheDocument();
      });

      it('does NOT show the resync item when calendarSyncStatus is null', async () => {
        const user = userEvent.setup();
        render(
          <ExpenseActions
            expense={{ ...mockExpense, calendarSyncStatus: null }}
          />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.queryByText(RESYNC_LABEL)).not.toBeInTheDocument();
      });
    });

    describe('"Abrir no Google Agenda" visibility', () => {
      it('shows the open item when calendarEventUrl is present', async () => {
        const user = userEvent.setup();
        render(
          <ExpenseActions
            expense={{ ...mockExpense, calendarEventUrl: eventUrl }}
          />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.getByText(OPEN_LABEL)).toBeInTheDocument();
      });

      it('does NOT show the open item when calendarEventUrl is null', async () => {
        const user = userEvent.setup();
        render(
          <ExpenseActions
            expense={{ ...mockExpense, calendarEventUrl: null }}
          />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.queryByText(OPEN_LABEL)).not.toBeInTheDocument();
      });
    });

    // Os dois itens são mutuamente exclusivos: havendo falha, só o reenvio
    // aparece. Enquanto a sincronização está quebrada, reenviar é a única ação
    // que resolve, e mostrar "Abrir" ao lado divide a atenção da cliente.
    it('hides the open item when FAILED and calendarEventUrl are present at once', async () => {
      const user = userEvent.setup();
      render(
        <ExpenseActions
          expense={{
            ...mockExpense,
            calendarSyncStatus: 'FAILED',
            calendarEventUrl: eventUrl,
          }}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(screen.getByText(RESYNC_LABEL)).toBeInTheDocument();
      expect(screen.queryByText(OPEN_LABEL)).not.toBeInTheDocument();
    });

    it('hides the open item when UNAUTHORIZED and calendarEventUrl are present at once', async () => {
      const user = userEvent.setup();
      render(
        <ExpenseActions
          expense={{
            ...mockExpense,
            calendarSyncStatus: 'UNAUTHORIZED',
            calendarEventUrl: eventUrl,
          }}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(screen.getByText(RESYNC_LABEL)).toBeInTheDocument();
      expect(screen.queryByText(OPEN_LABEL)).not.toBeInTheDocument();
    });

    // O gateway inerte do backend grava string vazia ao "sincronizar" sem falar
    // com o Google. Uma checagem `!== null` deixava o item passar e o
    // `window.open('')` abria `about:blank` numa aba nova.
    it('does NOT show the open item when calendarEventUrl is an empty string', async () => {
      const user = userEvent.setup();
      render(
        <ExpenseActions
          expense={{
            ...mockExpense,
            calendarSyncStatus: 'SYNCED',
            calendarEventUrl: '',
          }}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText(OPEN_LABEL)).not.toBeInTheDocument();
    });

    it('does NOT show the open item when calendarEventUrl is only whitespace', async () => {
      const user = userEvent.setup();
      render(
        <ExpenseActions
          expense={{
            ...mockExpense,
            calendarSyncStatus: 'SYNCED',
            calendarEventUrl: '   ',
          }}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText(OPEN_LABEL)).not.toBeInTheDocument();
    });

    it('fires the resync mutation exactly once with the expense id', async () => {
      const user = userEvent.setup();
      const failedExpense = { ...mockExpense, calendarSyncStatus: 'FAILED' as const };
      render(<ExpenseActions expense={failedExpense} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText(RESYNC_LABEL));

      expect(mockResyncCalendarMutate).toHaveBeenCalledTimes(1);
      expect(mockResyncCalendarMutate).toHaveBeenCalledWith(failedExpense.id);
    });

    it('opens the event with window.open using _blank and noopener,noreferrer', async () => {
      const user = userEvent.setup();
      const openSpy = vi
        .spyOn(window, 'open')
        .mockImplementation(() => null);
      render(
        <ExpenseActions
          expense={{ ...mockExpense, calendarEventUrl: eventUrl }}
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText(OPEN_LABEL));

      expect(openSpy).toHaveBeenCalledWith(
        eventUrl,
        '_blank',
        'noopener,noreferrer'
      );

      openSpy.mockRestore();
    });

    it('keeps the four existing items present and in order on a failed expense', async () => {
      const user = userEvent.setup();
      render(
        <ExpenseActions
          expense={{
            ...mockExpense,
            status: ExpenseStatus.OPEN,
            amountPendingConfirmation: true,
            calendarSyncStatus: 'FAILED',
          }}
        />
      );

      await user.click(screen.getByRole('button'));

      const items = screen.getAllByRole('menuitem').map((item) => item.textContent);

      expect(items).toEqual([
        'Editar',
        'Pagar',
        'Confirmar valor',
        RESYNC_LABEL,
        'Cancelar',
      ]);
    });

    it('shows "Abrir no Google Agenda" but not "Pagar" on a CANCELLED expense with an event', async () => {
      const user = userEvent.setup();
      render(
        <ExpenseActions
          expense={{
            ...mockExpense,
            status: ExpenseStatus.CANCELLED,
            calendarEventUrl: eventUrl,
          }}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(screen.getByText(OPEN_LABEL)).toBeInTheDocument();
      expect(screen.queryByText('Pagar')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('opens with keyboard and closes with Escape', async () => {
      const user = userEvent.setup();
      render(<ExpenseActions expense={mockExpense} />);

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button'));

      await user.keyboard('{Enter}');
      expect(screen.getByText('Editar')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    });
  });
});
