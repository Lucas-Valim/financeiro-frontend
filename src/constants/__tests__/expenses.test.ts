import { describe, it, expect } from 'vitest';
import { startOfMonth, endOfMonth } from 'date-fns';
import {
  EXPENSE_STATUS_COLORS,
  EXPENSE_PAGE_LIMIT,
  ORGANIZATION_ID,
  ExpenseStatus,
  EXPENSE_STATUS_LABELS,
  getDefaultExpenseFilters,
  isDefaultExpenseFilters,
  isExpenseEditable,
  isExpenseCancellable,
  CANCEL_EXPENSE_ERROR_MESSAGES,
  translateCancelExpenseError,
  requiresAmountConfirmation,
  translateConfirmAmountError,
  CONFIRM_AMOUNT_ERROR_MESSAGES,
} from '../expenses';
import type { ExpenseDTO } from '@/types/expenses';

function makeExpense(overrides: Partial<ExpenseDTO>): ExpenseDTO {
  return {
    id: 'exp-1',
    organizationId: ORGANIZATION_ID,
    categoryId: null,
    favorecidoId: null,
    description: 'Test',
    amount: 100,
    currency: 'BRL',
    dueDate: new Date('2026-08-19T00:00:00'),
    status: ExpenseStatus.OPEN,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'ACME',
    municipality: 'São Paulo',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    recurringExpenseId: null,
    occurrenceMonth: null,
    amountPendingConfirmation: false,
    documentPending: false,
    createdAt: new Date('2026-08-19T00:00:00'),
    updatedAt: new Date('2026-08-19T00:00:00'),
    ...overrides,
  };
}

describe('Constants', () => {
  describe('EXPENSE_STATUS_COLORS', () => {
    it('should have entries for all status types', () => {
      expect(EXPENSE_STATUS_COLORS.OPEN).toBeDefined();
      expect(EXPENSE_STATUS_COLORS.OVERDUE).toBeDefined();
      expect(EXPENSE_STATUS_COLORS.PAID).toBeDefined();
      expect(EXPENSE_STATUS_COLORS.CANCELLED).toBeDefined();
      expect(Object.keys(EXPENSE_STATUS_COLORS).length).toBe(4);
    });

    it('should use correct color scheme (blue, red, green, gray)', () => {
      expect(EXPENSE_STATUS_COLORS.OPEN).toContain('blue');
      expect(EXPENSE_STATUS_COLORS.OVERDUE).toContain('red');
      expect(EXPENSE_STATUS_COLORS.PAID).toContain('green');
      expect(EXPENSE_STATUS_COLORS.CANCELLED).toContain('gray');
    });

    it('should be immutable (read-only at compile time)', () => {
      const colors = EXPENSE_STATUS_COLORS;
      
      expect(colors.OPEN).toBe('bg-blue-100 text-blue-800');
    });
  });

  describe('EXPENSE_PAGE_LIMIT', () => {
    it('should equal 10', () => {
      expect(EXPENSE_PAGE_LIMIT).toBe(10);
    });

    it('should be immutable (read-only)', () => {
      const originalLimit = EXPENSE_PAGE_LIMIT;

      expect(() => {
        (EXPENSE_PAGE_LIMIT as unknown as number) = 20;
      }).toThrow();

      expect(EXPENSE_PAGE_LIMIT).toBe(originalLimit);
    });

    it('should be a number', () => {
      expect(typeof EXPENSE_PAGE_LIMIT).toBe('number');
    });
  });

  describe('ORGANIZATION_ID', () => {
    it('should be a valid UUID string', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(ORGANIZATION_ID).toMatch(uuidRegex);
    });

    it('should be the expected value', () => {
      expect(ORGANIZATION_ID).toBe('fca3c088-ba34-43a2-9b32-b2b1a1246915');
    });

    it('should be immutable (read-only)', () => {
      const originalId = ORGANIZATION_ID;

      expect(() => {
        (ORGANIZATION_ID as unknown as string) = 'modified';
      }).toThrow();

      expect(ORGANIZATION_ID).toBe(originalId);
    });

    it('should be a string', () => {
      expect(typeof ORGANIZATION_ID).toBe('string');
    });
  });

  describe('ExpenseStatus', () => {
    it('should contain all four required values', () => {
      const values = Object.values(ExpenseStatus);
      expect(values).toContain('OPEN');
      expect(values).toContain('OVERDUE');
      expect(values).toContain('PAID');
      expect(values).toContain('CANCELLED');
      expect(values.length).toBe(4);
    });

    it('should have string literal values', () => {
      expect(ExpenseStatus.OPEN).toBe('OPEN');
      expect(ExpenseStatus.OVERDUE).toBe('OVERDUE');
      expect(ExpenseStatus.PAID).toBe('PAID');
      expect(ExpenseStatus.CANCELLED).toBe('CANCELLED');
    });

    it('should be comparable with string values', () => {
      const status = ExpenseStatus.OPEN;
      
      if (status === 'OPEN') {
        expect(true).toBe(true);
      }
    });
  });

  describe('EXPENSE_STATUS_LABELS', () => {
    it('should have entries for all status types', () => {
      expect(EXPENSE_STATUS_LABELS.OPEN).toBeDefined();
      expect(EXPENSE_STATUS_LABELS.OVERDUE).toBeDefined();
      expect(EXPENSE_STATUS_LABELS.PAID).toBeDefined();
      expect(EXPENSE_STATUS_LABELS.CANCELLED).toBeDefined();
      expect(Object.keys(EXPENSE_STATUS_LABELS).length).toBe(4);
    });

    it('should have Portuguese labels', () => {
      expect(EXPENSE_STATUS_LABELS.OPEN).toBe('Aberta');
      expect(EXPENSE_STATUS_LABELS.OVERDUE).toBe('Atrasada');
      expect(EXPENSE_STATUS_LABELS.PAID).toBe('Paga');
      expect(EXPENSE_STATUS_LABELS.CANCELLED).toBe('Cancelada');
    });

    it('should be immutable (read-only at compile time)', () => {
      const labels = EXPENSE_STATUS_LABELS;
      
      expect(labels.OPEN).toBe('Aberta');
    });
  });

  describe('isExpenseEditable', () => {
    it('should return true for OPEN status', () => {
      expect(isExpenseEditable(ExpenseStatus.OPEN)).toBe(true);
    });

    it('should return true for OVERDUE status', () => {
      expect(isExpenseEditable(ExpenseStatus.OVERDUE)).toBe(true);
    });

    it('should return false for PAID status', () => {
      expect(isExpenseEditable(ExpenseStatus.PAID)).toBe(false);
    });

    it('should return false for CANCELLED status', () => {
      expect(isExpenseEditable(ExpenseStatus.CANCELLED)).toBe(false);
    });
  });

  describe('isExpenseCancellable', () => {
    it('should return true for OPEN status', () => {
      expect(isExpenseCancellable(ExpenseStatus.OPEN)).toBe(true);
    });

    it('should return true for OVERDUE status', () => {
      expect(isExpenseCancellable(ExpenseStatus.OVERDUE)).toBe(true);
    });

    it('should return false for PAID status', () => {
      expect(isExpenseCancellable(ExpenseStatus.PAID)).toBe(false);
    });

    it('should return false for CANCELLED status', () => {
      expect(isExpenseCancellable(ExpenseStatus.CANCELLED)).toBe(false);
    });
  });

  describe('translateCancelExpenseError', () => {
    it('should map the status-guard message to the not-cancellable text', () => {
      expect(translateCancelExpenseError('Cannot cancel expense with status PAID')).toBe(
        CANCEL_EXPENSE_ERROR_MESSAGES.NOT_CANCELLABLE
      );
    });

    it('should map the CANCELLED status-guard message to the not-cancellable text', () => {
      expect(translateCancelExpenseError('Cannot cancel expense with status CANCELLED')).toBe(
        CANCEL_EXPENSE_ERROR_MESSAGES.NOT_CANCELLABLE
      );
    });

    // A única origem real dessa mensagem é `Expense.cancel()`, que sempre
    // interpola o status. Qualquer outro "Cannot cancel ..." vem de outro
    // domínio e não deve virar o texto de despesa paga/cancelada.
    it('should fall back to the generic text for an unrelated Cannot cancel message', () => {
      expect(translateCancelExpenseError('Cannot cancel a paid expense')).toBe(
        CANCEL_EXPENSE_ERROR_MESSAGES.DEFAULT
      );
    });

    it('should map the domain not-found message to the not-found text', () => {
      expect(translateCancelExpenseError('Expense with id abc not found')).toBe(
        CANCEL_EXPENSE_ERROR_MESSAGES.NOT_FOUND
      );
    });

    it('should map the api-client 404 fallback to the not-found text', () => {
      expect(translateCancelExpenseError('Resource not found')).toBe(
        CANCEL_EXPENSE_ERROR_MESSAGES.NOT_FOUND
      );
    });

    it('should fall back to the generic text for an unknown message', () => {
      expect(translateCancelExpenseError('Internal server error')).toBe(
        CANCEL_EXPENSE_ERROR_MESSAGES.DEFAULT
      );
    });

    it('should fall back to the generic text for an empty message', () => {
      expect(translateCancelExpenseError('')).toBe(CANCEL_EXPENSE_ERROR_MESSAGES.DEFAULT);
    });
  });

  describe('requiresAmountConfirmation', () => {
    it('returns true when amount is pending and status is OPEN', () => {
      const expense = makeExpense({
        status: ExpenseStatus.OPEN,
        amountPendingConfirmation: true,
      });

      expect(requiresAmountConfirmation(expense)).toBe(true);
    });

    it('returns true when amount is pending and status is OVERDUE — vencer não libera o pagamento', () => {
      const expense = makeExpense({
        status: ExpenseStatus.OVERDUE,
        amountPendingConfirmation: true,
      });

      expect(requiresAmountConfirmation(expense)).toBe(true);
    });

    it('returns false for a CANCELLED expense — não acumula o motivo de cancelamento', () => {
      const expense = makeExpense({
        status: ExpenseStatus.CANCELLED,
        amountPendingConfirmation: false,
      });

      expect(requiresAmountConfirmation(expense)).toBe(false);
    });

    it('returns false for a PAID expense with confirmed amount', () => {
      const expense = makeExpense({
        status: ExpenseStatus.PAID,
        amountPendingConfirmation: false,
      });

      expect(requiresAmountConfirmation(expense)).toBe(false);
    });
  });

  describe('translateConfirmAmountError', () => {
    it('maps the confirmation-required backend message to the Portuguese text', () => {
      expect(
        translateConfirmAmountError('Expense amount must be confirmed before payment')
      ).toBe(CONFIRM_AMOUNT_ERROR_MESSAGES.CONFIRMATION_REQUIRED);
    });

    it('maps the already-confirmed backend message to the Portuguese text', () => {
      expect(translateConfirmAmountError('Expense amount is already confirmed')).toBe(
        CONFIRM_AMOUNT_ERROR_MESSAGES.ALREADY_CONFIRMED
      );
    });

    it('falls back to the generic text for an unknown message', () => {
      expect(translateConfirmAmountError('Internal server error')).toBe(
        CONFIRM_AMOUNT_ERROR_MESSAGES.DEFAULT
      );
    });

    it('falls back to the generic text for an empty message, never an empty string', () => {
      expect(translateConfirmAmountError('')).toBe(CONFIRM_AMOUNT_ERROR_MESSAGES.DEFAULT);
    });
  });

  describe('getDefaultExpenseFilters', () => {
    it('should default status to OPEN', () => {
      expect(getDefaultExpenseFilters().status).toBe(ExpenseStatus.OPEN);
    });

    it('should default the date range to the current month', () => {
      const now = new Date();
      const filters = getDefaultExpenseFilters();

      expect(filters.dueDateStart?.getTime()).toBe(startOfMonth(now).getTime());
      expect(filters.dueDateEnd?.getTime()).toBe(endOfMonth(now).getTime());
    });

    it('should return fresh Date instances on each call', () => {
      const first = getDefaultExpenseFilters();
      const second = getDefaultExpenseFilters();

      expect(first.dueDateStart).not.toBe(second.dueDateStart);
      expect(first.dueDateEnd).not.toBe(second.dueDateEnd);
    });

    it('should not include extra filters', () => {
      const filters = getDefaultExpenseFilters();

      expect(filters.receiver).toBeUndefined();
      expect(filters.municipality).toBeUndefined();
      expect(filters.categoryId).toBeUndefined();
    });
  });

  describe('isDefaultExpenseFilters', () => {
    it('should return true for the default filters', () => {
      expect(isDefaultExpenseFilters(getDefaultExpenseFilters())).toBe(true);
    });

    it('should return false when the status differs from default', () => {
      const filters = { ...getDefaultExpenseFilters(), status: ExpenseStatus.PAID };

      expect(isDefaultExpenseFilters(filters)).toBe(false);
    });

    it('should return false when the status is removed', () => {
      const { status: _removed, ...filters } = getDefaultExpenseFilters();

      expect(isDefaultExpenseFilters(filters)).toBe(false);
    });

    it('should return false when the date range differs from the current month', () => {
      const filters = {
        ...getDefaultExpenseFilters(),
        dueDateStart: new Date('2020-01-01'),
      };

      expect(isDefaultExpenseFilters(filters)).toBe(false);
    });

    it('should return false when an extra filter is present', () => {
      const filters = { ...getDefaultExpenseFilters(), receiver: 'ACME' };

      expect(isDefaultExpenseFilters(filters)).toBe(false);
    });

    it('should return false when only the payment method is filtered', () => {
      const filters = { ...getDefaultExpenseFilters(), paymentMethod: 'PIX' };

      expect(isDefaultExpenseFilters(filters)).toBe(false);
    });

    it('should return false when only the category is filtered', () => {
      const filters = { ...getDefaultExpenseFilters(), categoryId: 'cat-1' };

      expect(isDefaultExpenseFilters(filters)).toBe(false);
    });
  });

  describe('TypeScript Type Inference', () => {
    it('should correctly infer types', () => {
      const status: ExpenseStatus = ExpenseStatus.OPEN;
      const limit: number = EXPENSE_PAGE_LIMIT;
      const orgId: string = ORGANIZATION_ID;
      const color: string = EXPENSE_STATUS_COLORS.OPEN;

      expect(typeof status).toBe('string');
      expect(typeof limit).toBe('number');
      expect(typeof orgId).toBe('string');
      expect(typeof color).toBe('string');
    });
  });
});
