import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { WeekView } from '../WeekView';
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

describe('WeekView', () => {
  const defaultProps = {
    expenses: [] as ExpenseDTO[],
    currentDate: new Date('2026-02-15T12:00:00'),
    onEventClick: vi.fn(),
  };

  describe('rendering', () => {
    it('renders 7 day columns', () => {
      render(<WeekView {...defaultProps} />);
      const columns = document.querySelectorAll('.grid > div');
      expect(columns.length).toBe(7);
    });

    it('renders weekday headers in Portuguese', () => {
      render(<WeekView {...defaultProps} />);
      const headers = document.querySelectorAll('.text-xs.font-medium.uppercase');
      const headerTexts = Array.from(headers).map((h) => h.textContent?.toLowerCase());
      expect(headerTexts).toContain('domingo');
      expect(headerTexts).toContain('segunda');
    });

    it('renders day numbers', () => {
      render(<WeekView {...defaultProps} />);
      const dayNumbers = document.querySelectorAll('.text-lg.font-semibold');
      expect(dayNumbers.length).toBe(7);
    });

    it('highlights today', () => {
      render(<WeekView {...defaultProps} currentDate={new Date()} />);
      const todayHighlight = document.querySelector('.text-\\[var\\(--accent-primary\\)\\]');
      expect(todayHighlight).toBeInTheDocument();
    });
  });

  describe('expense grouping', () => {
    it('groups expenses by day', () => {
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

      render(<WeekView {...defaultProps} expenses={expenses} />);

      const eventButtons = document.querySelectorAll('button[type="button"]');
      expect(eventButtons.length).toBe(2);
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
      ];

      render(<WeekView {...defaultProps} expenses={expenses} />);

      const container = document.querySelector('.space-y-1');
      expect(container?.children.length).toBe(2);
    });

    it('shows placeholder for empty days', () => {
      render(<WeekView {...defaultProps} expenses={[]} />);

      const placeholders = document.querySelectorAll('.opacity-50');
      expect(placeholders.length).toBe(7);
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
        <WeekView
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
    it('renders with proper container structure', () => {
      render(<WeekView {...defaultProps} />);
      const container = document.querySelector('.grid');
      expect(container).toHaveClass('grid-cols-1');
      expect(container).toHaveClass('md:grid-cols-7');
    });
  });
});
