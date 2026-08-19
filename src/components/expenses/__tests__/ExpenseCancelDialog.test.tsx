import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseCancelDialog } from '../ExpenseCancelDialog';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockIsPending = vi.hoisted(() => ({ value: false }));

vi.mock('@/hooks/useCancelExpense', () => ({
  useCancelExpense: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending.value,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: vi.fn(),
  },
}));

const mockExpense = {
  id: 'expense-1',
  description: 'Aluguel do escritório',
  status: ExpenseStatus.OPEN,
} as ExpenseDTO;

describe('ExpenseCancelDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending.value = false;
    mockMutateAsync.mockResolvedValue(mockExpense);
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      render(<ExpenseCancelDialog isOpen={false} onClose={vi.fn()} expense={mockExpense} />);

      expect(screen.queryByText('Cancelar Despesa')).not.toBeInTheDocument();
    });

    it('renders the title and the expense description in the confirmation copy', () => {
      render(<ExpenseCancelDialog isOpen onClose={vi.fn()} expense={mockExpense} />);

      expect(screen.getByText('Cancelar Despesa')).toBeInTheDocument();
      expect(screen.getByText(/Aluguel do escritório/)).toBeInTheDocument();
    });

    it('labels the dismiss button "Voltar" so it never collides with the destructive action', () => {
      render(<ExpenseCancelDialog isOpen onClose={vi.fn()} expense={mockExpense} />);

      expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Confirmar Cancelamento' })
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    });
  });

  describe('Confirming the cancellation', () => {
    it('cancels the expense, toasts success and closes', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ExpenseCancelDialog isOpen onClose={onClose} expense={mockExpense} />);

      await user.click(screen.getByRole('button', { name: 'Confirmar Cancelamento' }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
      expect(mockMutateAsync).toHaveBeenCalledWith('expense-1');
      expect(mockToastSuccess).toHaveBeenCalledWith('Despesa cancelada com sucesso');
    });

    it('keeps the dialog open and does not toast success when the request fails', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockMutateAsync.mockRejectedValue(new Error('Cannot cancel expense with status PAID'));
      render(<ExpenseCancelDialog isOpen onClose={onClose} expense={mockExpense} />);

      await user.click(screen.getByRole('button', { name: 'Confirmar Cancelamento' }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
      expect(onClose).not.toHaveBeenCalled();
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Dismissing the dialog', () => {
    it('closes without cancelling the expense when "Voltar" is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ExpenseCancelDialog isOpen onClose={onClose} expense={mockExpense} />);

      await user.click(screen.getByRole('button', { name: 'Voltar' }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Pending state', () => {
    it('disables both buttons and shows progress copy while the request is in flight', () => {
      mockIsPending.value = true;
      render(<ExpenseCancelDialog isOpen onClose={vi.fn()} expense={mockExpense} />);

      expect(screen.getByRole('button', { name: 'Cancelando...' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled();
      expect(
        screen.queryByRole('button', { name: 'Confirmar Cancelamento' })
      ).not.toBeInTheDocument();
    });
  });
});
