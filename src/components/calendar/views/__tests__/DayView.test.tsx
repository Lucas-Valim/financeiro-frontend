import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DayView } from '../DayView';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

function createMockExpense(overrides?: Partial<ExpenseDTO>): ExpenseDTO {
  return {
    id: 'expense-1',
    organizationId: 'org-1',
    categoryId: null,
    description: 'Test Expense',
    amount: 1500,
    currency: 'BRL',
    dueDate: new Date('2026-02-15T12:00:00'),
    status: ExpenseStatus.OPEN,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Test Receiver',
    municipality: 'São Paulo',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('DayView', () => {
  const defaultProps = {
    expenses: [] as ExpenseDTO[],
    currentDate: new Date('2026-02-15T12:00:00'),
    onEventClick: vi.fn(),
  };

  describe('rendering', () => {
    it('renders day title in Portuguese', () => {
      render(<DayView {...defaultProps} />);
      const title = document.querySelector('h2');
      expect(title).toHaveTextContent('domingo');
      expect(title).toHaveTextContent('15');
      expect(title).toHaveTextContent('fevereiro');
    });

    it('renders formatted date with year', () => {
      render(<DayView {...defaultProps} currentDate={new Date('2026-02-15')} />);
      const title = document.querySelector('h2');
      expect(title).toHaveTextContent('2026');
    });
  });

  describe('expense filtering', () => {
    it('filters expenses for the current date only', () => {
      const expenses = [
        createMockExpense({
          id: 'exp-1',
          description: 'Aluguel',
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
        createMockExpense({
          id: 'exp-2',
          description: 'Energia',
          dueDate: new Date('2026-02-16T12:00:00'),
        }),
      ];

      render(<DayView {...defaultProps} expenses={expenses} />);

      const eventButtons = document.querySelectorAll('button[type="button"]');
      expect(eventButtons.length).toBe(1);
    });

    it('renders multiple expenses on same day', () => {
      const expenses = [
        createMockExpense({
          id: 'exp-1',
          description: 'Aluguel',
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
        createMockExpense({
          id: 'exp-2',
          description: 'Energia',
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
        createMockExpense({
          id: 'exp-3',
          description: 'Internet',
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
      ];

      render(<DayView {...defaultProps} expenses={expenses} />);

      const container = document.querySelector('.space-y-2');
      expect(container?.children.length).toBe(3);
    });
  });

  describe('empty state', () => {
    it('shows empty state message when no expenses', () => {
      render(<DayView {...defaultProps} expenses={[]} />);
      expect(document.body).toHaveTextContent('Nenhuma despesa neste dia');
    });

    it('shows empty state when expenses are on different days', () => {
      const expenses = [
        createMockExpense({
          id: 'exp-1',
          description: 'Aluguel',
          dueDate: new Date('2026-02-20T12:00:00'),
        }),
      ];

      render(
        <DayView
          {...defaultProps}
          expenses={expenses}
          currentDate={new Date('2026-02-15T12:00:00')}
        />
      );

      expect(document.body).toHaveTextContent('Nenhuma despesa neste dia');
    });
  });

  describe('event click', () => {
    it('calls onEventClick when expense is clicked', () => {
      const onEventClick = vi.fn();
      const expenses = [
        createMockExpense({
          id: 'exp-1',
          description: 'Aluguel',
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
      ];

      render(
        <DayView
          {...defaultProps}
          expenses={expenses}
          onEventClick={onEventClick}
        />
      );

      const eventButton = document.querySelector('button[type="button"]');
      if (eventButton) {
        fireEvent.click(eventButton);
        expect(onEventClick).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'exp-1',
            description: 'Aluguel',
          })
        );
      }
    });
  });

  describe('accessibility', () => {
    it('renders with proper heading level', () => {
      render(<DayView {...defaultProps} />);
      const heading = document.querySelector('h2');
      expect(heading).toBeInTheDocument();
    });
  });
});
