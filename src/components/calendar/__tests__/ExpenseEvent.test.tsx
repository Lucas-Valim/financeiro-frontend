import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseEvent } from '../ExpenseEvent';
import { ExpenseStatus } from '@/constants/expenses';
import type { CalendarEvent } from '@/types/calendar';
import type { ExpenseDTO } from '@/types/expenses';

function createMockExpense(overrides?: Partial<ExpenseDTO>): ExpenseDTO {
  return {
    id: 'expense-1',
    organizationId: 'org-1',
    categoryId: null,
    description: 'Test Expense',
    amount: 1500,
    currency: 'BRL',
    dueDate: new Date('2026-02-28'),
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

function createMockCalendarEvent(overrides?: Partial<CalendarEvent>): CalendarEvent {
  const expense = createMockExpense();
  return {
    id: 'event-1',
    title: 'Test Expense',
    start: new Date('2026-02-28'),
    end: new Date('2026-02-28'),
    expense,
    status: ExpenseStatus.OPEN,
    amount: 1500,
    ...overrides,
  };
}

describe('ExpenseEvent', () => {
  describe('rendering', () => {
    it('renders event title', () => {
      const event = createMockCalendarEvent({ title: 'Aluguel de escritório' });
      render(<ExpenseEvent event={event} onClick={() => {}} />);

      expect(screen.getByText('Aluguel de escritório')).toBeInTheDocument();
    });

    it('renders formatted amount in BRL', () => {
      const event = createMockCalendarEvent({ amount: 2500.5 });
      render(<ExpenseEvent event={event} onClick={() => {}} />);

      expect(screen.getByText('R$ 2.500,50')).toBeInTheDocument();
    });

    it('truncates long titles', () => {
      const longTitle = 'This is a very long expense title that should be truncated';
      const event = createMockCalendarEvent({ title: longTitle });
      render(<ExpenseEvent event={event} onClick={() => {}} />);

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toHaveClass('truncate');
    });
  });

  describe('status styles', () => {
    it('applies pending styles for OPEN status with future due date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const event = createMockCalendarEvent({
        status: ExpenseStatus.OPEN,
        expense: createMockExpense({
          status: ExpenseStatus.OPEN,
          dueDate: futureDate,
        }),
      });

      render(<ExpenseEvent event={event} onClick={() => {}} />);
      const button = screen.getByRole('button');

      expect(button.className).toContain('bg-[var(--event-pending-bg)]');
      expect(button.className).toContain('text-[var(--event-pending-text)]');
      expect(button.className).toContain('border-l-[var(--event-pending-border)]');
    });

    it('applies paid styles for PAID status', () => {
      const event = createMockCalendarEvent({
        status: ExpenseStatus.PAID,
        expense: createMockExpense({
          status: ExpenseStatus.PAID,
        }),
      });

      render(<ExpenseEvent event={event} onClick={() => {}} />);
      const button = screen.getByRole('button');

      expect(button.className).toContain('bg-[var(--event-paid-bg)]');
      expect(button.className).toContain('text-[var(--event-paid-text)]');
      expect(button.className).toContain('border-l-[var(--event-paid-border)]');
    });

    it('applies overdue styles for OPEN status with past due date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const event = createMockCalendarEvent({
        status: ExpenseStatus.OPEN,
        expense: createMockExpense({
          status: ExpenseStatus.OPEN,
          dueDate: pastDate,
        }),
      });

      render(<ExpenseEvent event={event} onClick={() => {}} />);
      const button = screen.getByRole('button');

      expect(button.className).toContain('bg-[var(--event-overdue-bg)]');
      expect(button.className).toContain('text-[var(--event-overdue-text)]');
      expect(button.className).toContain('border-l-[var(--event-overdue-border)]');
    });
  });

  describe('status icons', () => {
    it('displays Clock icon for pending status', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const event = createMockCalendarEvent({
        expense: createMockExpense({
          status: ExpenseStatus.OPEN,
          dueDate: futureDate,
        }),
      });

      render(<ExpenseEvent event={event} onClick={() => {}} />);
      const clockIcon = screen.getByTestId('clock-icon');

      expect(clockIcon).toBeInTheDocument();
    });

    it('displays CheckCircle icon for paid status', () => {
      const event = createMockCalendarEvent({
        expense: createMockExpense({
          status: ExpenseStatus.PAID,
        }),
      });

      render(<ExpenseEvent event={event} onClick={() => {}} />);
      const checkIcon = screen.getByTestId('checkcircle-icon');

      expect(checkIcon).toBeInTheDocument();
    });

    it('displays AlertCircle icon for overdue status', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const event = createMockCalendarEvent({
        expense: createMockExpense({
          status: ExpenseStatus.OPEN,
          dueDate: pastDate,
        }),
      });

      render(<ExpenseEvent event={event} onClick={() => {}} />);
      const alertIcon = screen.getByTestId('alertcircle-icon');

      expect(alertIcon).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      const event = createMockCalendarEvent();

      render(<ExpenseEvent event={event} onClick={onClick} />);
      fireEvent.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('has hover styles applied', () => {
      const event = createMockCalendarEvent();
      render(<ExpenseEvent event={event} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:scale-[1.02]');
      expect(button.className).toContain('hover:shadow-md');
    });
  });

  describe('accessibility', () => {
    it('has type="button" to prevent form submission', () => {
      const event = createMockCalendarEvent();
      render(<ExpenseEvent event={event} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('has descriptive aria-label for pending status', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const event = createMockCalendarEvent({
        title: 'Aluguel',
        amount: 1500,
        expense: createMockExpense({
          status: ExpenseStatus.OPEN,
          dueDate: futureDate,
        }),
      });

      render(<ExpenseEvent event={event} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Aluguel'));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('1.500,00'));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Pendente'));
    });

    it('has descriptive aria-label for paid status', () => {
      const event = createMockCalendarEvent({
        title: 'Energia',
        amount: 250,
        expense: createMockExpense({
          status: ExpenseStatus.PAID,
        }),
      });

      render(<ExpenseEvent event={event} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Energia'));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('250,00'));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Pago'));
    });

    it('has descriptive aria-label for overdue status', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const event = createMockCalendarEvent({
        title: 'Internet',
        amount: 99.9,
        expense: createMockExpense({
          status: ExpenseStatus.OPEN,
          dueDate: pastDate,
        }),
      });

      render(<ExpenseEvent event={event} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Internet'));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('99,90'));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Vencido'));
    });

    it('has focus styles', () => {
      const event = createMockCalendarEvent();
      render(<ExpenseEvent event={event} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('focus:outline-none');
      expect(button.className).toContain('focus:ring-2');
    });

    it('icons have aria-hidden="true"', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const event = createMockCalendarEvent({
        expense: createMockExpense({
          status: ExpenseStatus.OPEN,
          dueDate: futureDate,
        }),
      });
      render(<ExpenseEvent event={event} onClick={() => {}} />);

      const icon = screen.getByTestId('clock-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
