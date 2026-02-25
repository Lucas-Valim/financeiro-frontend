import { describe, it, expect } from 'vitest';
import type { CalendarView, CalendarFilters, CalendarEvent, ExpenseEventStatus } from '../calendar';
import type { ExpenseDTO } from '../expenses';
import { ExpenseStatus } from '../../constants/expenses';

describe('Calendar Types', () => {
  describe('CalendarView', () => {
    it('should accept valid view values', () => {
      const monthView: CalendarView = 'month';
      const weekView: CalendarView = 'week';
      const dayView: CalendarView = 'day';

      expect(monthView).toBe('month');
      expect(weekView).toBe('week');
      expect(dayView).toBe('day');
    });
  });

  describe('CalendarFilters', () => {
    it('should accept empty filters', () => {
      const filters: CalendarFilters = {};
      expect(filters).toEqual({});
    });

    it('should accept status filter', () => {
      const filters: CalendarFilters = {
        status: ExpenseStatus.OPEN,
      };
      expect(filters.status).toBe(ExpenseStatus.OPEN);
    });

    it('should accept receiver filter', () => {
      const filters: CalendarFilters = {
        receiver: 'Test Receiver',
      };
      expect(filters.receiver).toBe('Test Receiver');
    });

    it('should accept categoryId filter', () => {
      const filters: CalendarFilters = {
        categoryId: 'cat-123',
      };
      expect(filters.categoryId).toBe('cat-123');
    });

    it('should accept all filters combined', () => {
      const filters: CalendarFilters = {
        status: ExpenseStatus.PAID,
        receiver: 'Test Receiver',
        categoryId: 'cat-456',
      };
      expect(filters.status).toBe(ExpenseStatus.PAID);
      expect(filters.receiver).toBe('Test Receiver');
      expect(filters.categoryId).toBe('cat-456');
    });
  });

  describe('CalendarEvent', () => {
    it('should create a valid calendar event', () => {
      const mockExpense: ExpenseDTO = {
        id: 'exp-1',
        organizationId: 'org-1',
        categoryId: 'cat-1',
        description: 'Test Expense',
        amount: 100.00,
        currency: 'BRL',
        dueDate: new Date('2024-01-15'),
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
      };

      const event: CalendarEvent = {
        id: 'evt-1',
        title: 'Test Expense',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-15'),
        expense: mockExpense,
        status: ExpenseStatus.OPEN,
        amount: 100.00,
      };

      expect(event.id).toBe('evt-1');
      expect(event.title).toBe('Test Expense');
      expect(event.status).toBe(ExpenseStatus.OPEN);
      expect(event.amount).toBe(100.00);
      expect(event.expense).toEqual(mockExpense);
    });
  });

  describe('ExpenseEventStatus', () => {
    it('should accept valid event status values', () => {
      const pending: ExpenseEventStatus = 'pending';
      const paid: ExpenseEventStatus = 'paid';
      const overdue: ExpenseEventStatus = 'overdue';

      expect(pending).toBe('pending');
      expect(paid).toBe('paid');
      expect(overdue).toBe('overdue');
    });
  });
});
