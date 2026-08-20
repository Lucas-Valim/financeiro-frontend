import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringExpenseActions } from '../RecurringExpenseActions';
import type { RecurringExpenseDTO } from '@/types/recurring-expenses';

vi.mock('../RecurringExpenseFormModal', () => ({
  RecurringExpenseFormModal: vi.fn(({ isOpen, onClose, recurringExpense, readOnly }) => {
    if (!isOpen) return null;
    return (
      <div
        data-testid="form-modal"
        data-id={recurringExpense?.id}
        data-readonly={String(readOnly)}
      >
        <button onClick={onClose} data-testid="close-form-modal">
          Fechar
        </button>
      </div>
    );
  }),
}));

vi.mock('../TerminateRecurringExpenseDialog', () => ({
  TerminateRecurringExpenseDialog: vi.fn(({ isOpen, onClose, recurringExpense }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="terminate-dialog" data-id={recurringExpense?.id}>
        <button onClick={onClose} data-testid="close-terminate-dialog">
          Fechar
        </button>
      </div>
    );
  }),
}));

const baseRecurrence: RecurringExpenseDTO = {
  id: 'rec-1',
  organizationId: 'org-1',
  description: 'Aluguel do escritório',
  favorecidoId: 'fav-1',
  categoryId: null,
  amountType: 'FIXED',
  amount: 1500,
  paymentMethod: null,
  municipality: 'São Paulo',
  dueDay: 5,
  startDate: new Date(2026, 0, 1),
  endDate: null,
  status: 'ACTIVE',
  terminationReason: null,
  terminatedAt: null,
  createdAt: new Date(2026, 0, 1),
  updatedAt: new Date(2026, 0, 1),
};

const activeRecurrence = baseRecurrence;
const endedRecurrence: RecurringExpenseDTO = { ...baseRecurrence, status: 'ENDED' };

describe('RecurringExpenseActions', () => {
  describe('Trigger', () => {
    it('renders a dropdown trigger button with the MoreVertical icon', () => {
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
      expect(screen.getByTestId('morevertical-icon')).toBeInTheDocument();
    });
  });

  describe('Menu items by status', () => {
    it('shows "Editar" and "Encerrar" for an ACTIVE recurrence', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Editar')).toBeInTheDocument();
      expect(screen.getByText('Encerrar')).toBeInTheDocument();
      expect(screen.queryByText('Ver detalhes')).not.toBeInTheDocument();
    });

    it('shows "Ver detalhes" and NOT "Encerrar" for an ENDED recurrence', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={endedRecurrence} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
      expect(screen.queryByText('Editar')).not.toBeInTheDocument();
      expect(screen.queryByText('Encerrar')).not.toBeInTheDocument();
    });

    it('renders the "Encerrar" item with destructive styling', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Encerrar').className).toContain('text-destructive');
    });
  });

  describe('Form modal (sibling of the menu)', () => {
    it('does not render the form modal initially', () => {
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('opens the editable form modal when "Editar" is selected on an ACTIVE recurrence', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Editar'));

      const modal = screen.getByTestId('form-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('data-id', activeRecurrence.id);
      expect(modal).toHaveAttribute('data-readonly', 'false');
    });

    it('opens the read-only form modal when "Ver detalhes" is selected on an ENDED recurrence', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={endedRecurrence} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Ver detalhes'));

      const modal = screen.getByTestId('form-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('data-readonly', 'true');
    });

    it('renders the form modal as a sibling, not inside the DropdownMenuContent', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Editar'));

      const modal = screen.getByTestId('form-modal');
      expect(modal.closest('[role="menu"]')).toBeNull();
    });

    it('closes the form modal when onClose is invoked', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Editar'));
      await user.click(screen.getByTestId('close-form-modal'));

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });
  });

  describe('Terminate dialog (sibling of the menu)', () => {
    it('does not render the terminate dialog initially', () => {
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      expect(screen.queryByTestId('terminate-dialog')).not.toBeInTheDocument();
    });

    it('opens the terminate dialog when "Encerrar" is selected', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Encerrar'));

      const dialog = screen.getByTestId('terminate-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('data-id', activeRecurrence.id);
      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('renders the terminate dialog as a sibling, not inside the DropdownMenuContent', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Encerrar'));

      const dialog = screen.getByTestId('terminate-dialog');
      expect(dialog.closest('[role="menu"]')).toBeNull();
    });

    it('closes the terminate dialog when onClose is invoked', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseActions recurringExpense={activeRecurrence} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Encerrar'));
      await user.click(screen.getByTestId('close-terminate-dialog'));

      expect(screen.queryByTestId('terminate-dialog')).not.toBeInTheDocument();
    });
  });
});
