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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const RECURRING_LABEL = 'Gerada por recorrência';
const DOCUMENT_LABEL =
  'Documento pendente: boleto ou nota fiscal ainda não anexados';
const AMOUNT_LABEL = 'Valor estimado do mês anterior — confirme antes de pagar';

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
  });
});
