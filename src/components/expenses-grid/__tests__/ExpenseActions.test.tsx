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
