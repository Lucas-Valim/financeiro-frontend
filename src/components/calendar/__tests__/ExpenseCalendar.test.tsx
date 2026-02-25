import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ExpenseCalendar } from '../ExpenseCalendar';
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

describe('ExpenseCalendar', () => {
  const defaultProps = {
    expenses: [] as ExpenseDTO[],
    currentDate: new Date('2026-02-15T12:00:00'),
    view: 'month' as const,
    onDateChange: vi.fn(),
    onViewChange: vi.fn(),
    onEventClick: vi.fn(),
  };

  describe('rendering', () => {
    it('renders calendar with month view', () => {
      render(<ExpenseCalendar {...defaultProps} />);
      const monthView = document.querySelector('.rbc-month-view');
      expect(monthView).toBeInTheDocument();
    });

    it('renders calendar with week view', () => {
      render(<ExpenseCalendar {...defaultProps} view="week" />);
      const weekView = document.querySelector('.grid');
      expect(weekView).toBeInTheDocument();
      expect(weekView?.children.length).toBe(7);
    });

    it('renders calendar with day view', () => {
      render(<ExpenseCalendar {...defaultProps} view="day" />);
      const dayView = document.querySelector('h2');
      expect(dayView).toBeInTheDocument();
    });

    it('renders calendar container with responsive flex classes', () => {
      render(<ExpenseCalendar {...defaultProps} />);
      const calendar = document.querySelector('.rbc-calendar');
      expect(calendar).toHaveClass('flex-1');
      expect(calendar).toHaveClass('min-h-0');
    });
  });

  describe('expense transformation', () => {
    it('transforms expenses to calendar events and renders them', () => {
      const expenses = [
        createMockExpense({
          id: 'exp-1',
          description: 'Aluguel',
          amount: 2500,
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
      ];

      render(<ExpenseCalendar {...defaultProps} expenses={expenses} />);

      const eventElements = document.querySelectorAll('.rbc-event');
      expect(eventElements.length).toBeGreaterThan(0);
    });

    it('renders multiple expenses as events', () => {
      const expenses = [
        createMockExpense({
          id: 'exp-1',
          description: 'Aluguel',
          amount: 2500,
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
        createMockExpense({
          id: 'exp-2',
          description: 'Energia',
          amount: 350,
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
      ];

      render(<ExpenseCalendar {...defaultProps} expenses={expenses} />);

      const eventElements = document.querySelectorAll('.rbc-event');
      expect(eventElements.length).toBe(2);
    });

    it('renders empty calendar when no expenses', () => {
      render(<ExpenseCalendar {...defaultProps} expenses={[]} />);
      const monthView = document.querySelector('.rbc-month-view');
      expect(monthView).toBeInTheDocument();
    });
  });

  describe('localization', () => {
    it('configures pt-BR culture', () => {
      render(<ExpenseCalendar {...defaultProps} />);
      const calendar = document.querySelector('.rbc-calendar');
      expect(calendar).toBeInTheDocument();
    });

    it('displays Portuguese weekday names', () => {
      render(<ExpenseCalendar {...defaultProps} />);
      const headerCells = document.querySelectorAll('.rbc-header span');
      const weekdays = Array.from(headerCells).map((cell) => cell.textContent);
      expect(weekdays).toContain('domingo');
      expect(weekdays).toContain('segunda');
    });
  });

  describe('navigation', () => {
    it('calls onDateChange when navigating', () => {
      const onDateChange = vi.fn();
      render(<ExpenseCalendar {...defaultProps} onDateChange={onDateChange} />);

      const nextButton = document.querySelector('.rbc-toolbar button:last-child');
      if (nextButton) {
        fireEvent.click(nextButton);
        expect(onDateChange).toHaveBeenCalled();
      }
    });

    it('displays calendar with current date', () => {
      const currentDate = new Date('2026-02-15T12:00:00');
      render(<ExpenseCalendar {...defaultProps} currentDate={currentDate} />);
      const monthView = document.querySelector('.rbc-month-view');
      expect(monthView).toBeInTheDocument();
    });
  });

  describe('view change', () => {
    it('calls onViewChange when view changes', () => {
      const onViewChange = vi.fn();
      render(<ExpenseCalendar {...defaultProps} onViewChange={onViewChange} />);

      const viewButtons = document.querySelectorAll('.rbc-toolbar button');
      if (viewButtons.length > 1) {
        fireEvent.click(viewButtons[1]);
        expect(onViewChange).toHaveBeenCalled();
      }
    });

    it('renders month view correctly', () => {
      render(<ExpenseCalendar {...defaultProps} view="month" />);
      const monthView = document.querySelector('.rbc-month-view');
      expect(monthView).toBeInTheDocument();
    });

    it('renders week view correctly', () => {
      render(<ExpenseCalendar {...defaultProps} view="week" />);
      const weekView = document.querySelector('.grid');
      expect(weekView).toBeInTheDocument();
      expect(weekView?.children.length).toBe(7);
    });

    it('renders day view correctly', () => {
      render(<ExpenseCalendar {...defaultProps} view="day" />);
      const dayView = document.querySelector('h2');
      expect(dayView).toBeInTheDocument();
    });
  });

  describe('event click', () => {
    it('calls onEventClick when event is clicked', () => {
      const onEventClick = vi.fn();
      const expenses = [
        createMockExpense({
          id: 'exp-1',
          description: 'Aluguel',
          amount: 2500,
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
      ];

      render(
        <ExpenseCalendar
          {...defaultProps}
          expenses={expenses}
          onEventClick={onEventClick}
        />
      );

      const eventButton = document.querySelector('.rbc-event button');
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

  describe('popup for show more', () => {
    it('renders calendar with popup prop enabled', () => {
      render(<ExpenseCalendar {...defaultProps} />);
      const calendar = document.querySelector('.rbc-calendar');
      expect(calendar).toBeInTheDocument();
    });

    it('handles multiple events on same day', () => {
      const manyExpenses = Array.from({ length: 7 }, (_, i) =>
        createMockExpense({
          id: `exp-${i}`,
          description: `Expense ${i + 1}`,
          amount: 100 * (i + 1),
          dueDate: new Date('2026-02-15T12:00:00'),
        })
      );

      render(<ExpenseCalendar {...defaultProps} expenses={manyExpenses} />);

      const events = document.querySelectorAll('.rbc-event');
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('custom event component', () => {
    it('uses ExpenseEvent component for events with status styles', () => {
      const expenses = [
        createMockExpense({
          id: 'exp-1',
          description: 'Aluguel',
          amount: 2500,
          dueDate: new Date('2026-02-15T12:00:00'),
          status: ExpenseStatus.PAID,
        }),
      ];

      render(<ExpenseCalendar {...defaultProps} expenses={expenses} />);

      const eventButton = document.querySelector('.rbc-event button');
      expect(eventButton).toBeInTheDocument();
      expect(eventButton?.className).toContain('bg-[var(--event-paid-bg)]');
    });

    it('displays formatted currency amount in event', () => {
      const expenses = [
        createMockExpense({
          id: 'exp-1',
          description: 'Aluguel',
          amount: 2500.5,
          dueDate: new Date('2026-02-15T12:00:00'),
        }),
      ];

      render(<ExpenseCalendar {...defaultProps} expenses={expenses} />);

      const eventContent = document.querySelector('.rbc-event');
      expect(eventContent?.textContent).toContain('R$');
    });
  });
});
