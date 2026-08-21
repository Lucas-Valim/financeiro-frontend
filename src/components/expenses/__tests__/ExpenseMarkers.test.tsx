import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseMarkers, getExpenseMarkersLabel } from '../ExpenseMarkers';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

function createMockExpense(overrides?: Partial<ExpenseDTO>): ExpenseDTO {
  return {
    id: 'expense-1',
    organizationId: 'org-1',
    categoryId: null,
    favorecidoId: null,
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
    recurringExpenseId: null,
    occurrenceMonth: null,
    amountPendingConfirmation: false,
    documentPending: false,
    calendarSyncStatus: null,
    calendarEventUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const RECURRING_LABEL = 'Gerada por recorrência';
const DOCUMENT_LABEL =
  'Documento pendente: boleto ou nota fiscal ainda não anexados';
const AMOUNT_LABEL = 'Valor estimado do mês anterior — confirme antes de pagar';
const CALENDAR_FAILED_LABEL =
  'Não foi possível enviar para o Google Agenda — a rotina diária tentará de novo';
const CALENDAR_UNAUTHORIZED_LABEL =
  'Autorização do Google Agenda perdida — acione o suporte técnico';

describe('ExpenseMarkers', () => {
  describe('recurring origin marker', () => {
    it('renders the recurring marker when recurringExpenseId is set', () => {
      const expense = createMockExpense({ recurringExpenseId: 'rec-1' });
      render(<ExpenseMarkers expense={expense} density="list" />);

      expect(screen.getByTestId('expense-marker-recurring')).toBeInTheDocument();
    });

    it('does not render any marker for a manual expense (recurringExpenseId null)', () => {
      const expense = createMockExpense({ recurringExpenseId: null });
      const { container } = render(
        <ExpenseMarkers expense={expense} density="list" />
      );

      expect(screen.queryByTestId('expense-marker-recurring')).toBeNull();
      expect(screen.queryByTestId('expense-marker-document')).toBeNull();
      expect(screen.queryByTestId('expense-marker-amount')).toBeNull();
      expect(container.firstChild).toBeNull();
    });
  });

  describe('document pending marker', () => {
    it('renders when documentPending is true', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        documentPending: true,
      });
      render(<ExpenseMarkers expense={expense} density="list" />);

      expect(screen.getByTestId('expense-marker-document')).toBeInTheDocument();
    });

    it('does not render when documentPending is false', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        documentPending: false,
      });
      render(<ExpenseMarkers expense={expense} density="list" />);

      expect(screen.queryByTestId('expense-marker-document')).toBeNull();
    });
  });

  describe('amount pending confirmation marker', () => {
    it('renders when amountPendingConfirmation is true', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        amountPendingConfirmation: true,
      });
      render(<ExpenseMarkers expense={expense} density="list" />);

      expect(screen.getByTestId('expense-marker-amount')).toBeInTheDocument();
    });

    it('does not render when amountPendingConfirmation is false', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        amountPendingConfirmation: false,
      });
      render(<ExpenseMarkers expense={expense} density="list" />);

      expect(screen.queryByTestId('expense-marker-amount')).toBeNull();
    });

    it('uses its own amber family, never the calendar --event-pending tokens', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        amountPendingConfirmation: true,
      });
      render(<ExpenseMarkers expense={expense} density="list" />);

      const marker = screen.getByTestId('expense-marker-amount');
      expect(marker.className).not.toContain('--event-pending');
      expect(marker.className).toContain('amber');
    });
  });

  describe('combined markers', () => {
    it('renders all three markers when the three conditions hold', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        documentPending: true,
        amountPendingConfirmation: true,
      });
      render(<ExpenseMarkers expense={expense} density="list" />);

      expect(screen.getByTestId('expense-marker-recurring')).toBeInTheDocument();
      expect(screen.getByTestId('expense-marker-document')).toBeInTheDocument();
      expect(screen.getByTestId('expense-marker-amount')).toBeInTheDocument();
    });
  });

  describe('accessible labels (list density)', () => {
    it('exposes a readable accessible label on each marker', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        documentPending: true,
        amountPendingConfirmation: true,
      });
      render(<ExpenseMarkers expense={expense} density="list" />);

      expect(
        screen.getByRole('img', { name: RECURRING_LABEL })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: DOCUMENT_LABEL })
      ).toBeInTheDocument();
      expect(screen.getByRole('img', { name: AMOUNT_LABEL })).toBeInTheDocument();
    });
  });

  describe('calendar sync failure marker', () => {
    it('renders with the FAILED label in list density', () => {
      const expense = createMockExpense({ calendarSyncStatus: 'FAILED' });
      render(<ExpenseMarkers expense={expense} density="list" />);

      const marker = screen.getByTestId('expense-marker-calendar');
      expect(marker).toBeInTheDocument();
      expect(marker).toHaveAttribute('aria-label', CALENDAR_FAILED_LABEL);
    });

    it('renders with the UNAUTHORIZED label in list density, distinct from FAILED', () => {
      const expense = createMockExpense({ calendarSyncStatus: 'UNAUTHORIZED' });
      render(<ExpenseMarkers expense={expense} density="list" />);

      const marker = screen.getByTestId('expense-marker-calendar');
      expect(marker).toHaveAttribute('aria-label', CALENDAR_UNAUTHORIZED_LABEL);
      expect(marker.getAttribute('aria-label')).not.toBe(CALENDAR_FAILED_LABEL);
    });

    it('does not render when calendarSyncStatus is SYNCED', () => {
      const expense = createMockExpense({ calendarSyncStatus: 'SYNCED' });
      render(<ExpenseMarkers expense={expense} density="list" />);

      expect(screen.queryByTestId('expense-marker-calendar')).toBeNull();
    });

    it('does not render when calendarSyncStatus is null', () => {
      const expense = createMockExpense({ calendarSyncStatus: null });
      render(<ExpenseMarkers expense={expense} density="list" />);

      expect(screen.queryByTestId('expense-marker-calendar')).toBeNull();
    });

    it('uses the red family shared by both failure statuses', () => {
      const expense = createMockExpense({ calendarSyncStatus: 'FAILED' });
      render(<ExpenseMarkers expense={expense} density="list" />);

      const marker = screen.getByTestId('expense-marker-calendar');
      expect(marker.className).toContain('red');
    });

    it('is hidden from assistive tech and exposes no own label in compact density', () => {
      const expense = createMockExpense({ calendarSyncStatus: 'FAILED' });
      render(<ExpenseMarkers expense={expense} density="compact" />);

      const marker = screen.getByTestId('expense-marker-calendar');
      expect(marker).toHaveAttribute('aria-hidden', 'true');
      expect(marker).not.toHaveAttribute('aria-label');
      expect(marker).not.toHaveAttribute('role');
    });
  });

  describe('four markers together', () => {
    it('renders all four in order with the calendar marker last', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        documentPending: true,
        amountPendingConfirmation: true,
        calendarSyncStatus: 'FAILED',
      });
      render(<ExpenseMarkers expense={expense} density="list" />);

      const markers = screen.getByTestId('expense-markers');
      const testIds = Array.from(
        markers.querySelectorAll('[data-testid^="expense-marker-"]')
      ).map((node) => node.getAttribute('data-testid'));

      expect(testIds).toEqual([
        'expense-marker-recurring',
        'expense-marker-document',
        'expense-marker-amount',
        'expense-marker-calendar',
      ]);
    });
  });

  describe('getExpenseMarkersLabel', () => {
    it('returns the text of all three labels when the three conditions hold', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        documentPending: true,
        amountPendingConfirmation: true,
      });

      const label = getExpenseMarkersLabel(expense);

      expect(label).toContain(RECURRING_LABEL);
      expect(label).toContain(DOCUMENT_LABEL);
      expect(label).toContain(AMOUNT_LABEL);
    });

    it('returns only the document pending label when only it holds', () => {
      const expense = createMockExpense({
        recurringExpenseId: null,
        documentPending: true,
        amountPendingConfirmation: false,
      });

      const label = getExpenseMarkersLabel(expense);

      expect(label).toBe(DOCUMENT_LABEL);
    });

    it('returns an empty string for a manual expense with no markers', () => {
      const expense = createMockExpense({
        recurringExpenseId: null,
        documentPending: false,
        amountPendingConfirmation: false,
      });

      expect(getExpenseMarkersLabel(expense)).toBe('');
    });

    it('returns exactly the FAILED label for an expense with only a sync failure', () => {
      const expense = createMockExpense({ calendarSyncStatus: 'FAILED' });

      expect(getExpenseMarkersLabel(expense)).toBe(CALENDAR_FAILED_LABEL);
    });

    it('concatenates the four labels with the calendar label last', () => {
      const expense = createMockExpense({
        recurringExpenseId: 'rec-1',
        documentPending: true,
        amountPendingConfirmation: true,
        calendarSyncStatus: 'UNAUTHORIZED',
      });

      const label = getExpenseMarkersLabel(expense);

      expect(label).toBe(
        [
          RECURRING_LABEL,
          DOCUMENT_LABEL,
          AMOUNT_LABEL,
          CALENDAR_UNAUTHORIZED_LABEL,
        ].join(', ')
      );
    });

    it('returns an empty string when calendarSyncStatus is SYNCED and nothing else holds', () => {
      const expense = createMockExpense({ calendarSyncStatus: 'SYNCED' });

      expect(getExpenseMarkersLabel(expense)).toBe('');
    });
  });
});
