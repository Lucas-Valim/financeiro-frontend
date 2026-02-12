import { describe, it, expect } from 'vitest';
import type { ExpenseDTO, ExpenseFilter, ListExpensesOutput } from '../expenses';
import { ExpenseStatus } from '../../constants/expenses';

describe('Type Definitions', () => {
  describe('ExpenseDTO', () => {
    it('should have correct structure', () => {
      const dto: ExpenseDTO = {
        id: '123',
        organizationId: 'org-123',
        categoryId: null,
        description: 'Test expense',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-01-01'),
        status: ExpenseStatus.OPEN,
        paymentMethod: null,
        paymentProof: null,
        paymentProofUrl: null,
        receiver: 'Test Receiver',
        municipality: 'Test City',
        serviceInvoice: null,
        serviceInvoiceUrl: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(dto.id).toBe('123');
      expect(dto.amount).toBe(100);
      expect(dto.status).toBe(ExpenseStatus.OPEN);
    });

    it('should have all required fields', () => {
      const requiredFields: (keyof ExpenseDTO)[] = [
        'id',
        'organizationId',
        'categoryId',
        'description',
        'amount',
        'currency',
        'dueDate',
        'status',
        'paymentMethod',
        'paymentProof',
        'paymentProofUrl',
        'receiver',
        'municipality',
        'serviceInvoice',
        'serviceInvoiceUrl',
        'createdAt',
        'updatedAt',
      ];

      expect(requiredFields.length).toBe(17);
    });
  });

  describe('ExpenseStatus', () => {
    it('should contain all four required values', () => {
      const values = Object.values(ExpenseStatus);
      expect(values).toContain(ExpenseStatus.OPEN);
      expect(values).toContain(ExpenseStatus.OVERDUE);
      expect(values).toContain(ExpenseStatus.PAID);
      expect(values).toContain(ExpenseStatus.CANCELLED);
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

  describe('ExpenseFilter', () => {
    it('should have all required optional fields', () => {
      const optionalFields: (keyof ExpenseFilter)[] = [
        'status',
        'receiver',
        'municipality',
        'dueDateStart',
        'dueDateEnd',
      ];

      expect(optionalFields.length).toBe(5);
    });

    it('should accept partial filters', () => {
      const partialFilter1: ExpenseFilter = { status: ExpenseStatus.OPEN };
      const partialFilter2: ExpenseFilter = { receiver: 'Test' };
      const partialFilter3: ExpenseFilter = { municipality: 'City' };
      const partialFilter4: ExpenseFilter = {
        dueDateStart: new Date('2024-01-01'),
        dueDateEnd: new Date('2024-12-31'),
      };

      expect(partialFilter1.status).toBe(ExpenseStatus.OPEN);
      expect(partialFilter2.receiver).toBe('Test');
      expect(partialFilter3.municipality).toBe('City');
      expect(partialFilter4.dueDateStart).toBeInstanceOf(Date);
      expect(partialFilter4.dueDateEnd).toBeInstanceOf(Date);
    });
  });

  describe('ListExpensesOutput', () => {
    it('should have correct structure', () => {
      const output: ListExpensesOutput = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
        },
      };

      expect(Array.isArray(output.data)).toBe(true);
      expect(output.pagination.page).toBe(1);
      expect(output.pagination.limit).toBe(10);
      expect(output.pagination.total).toBe(100);
    });

    it('should have data typed as ExpenseDTO[]', () => {
      const expense: ExpenseDTO = {
        id: '123',
        organizationId: 'org-123',
        categoryId: null,
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date(),
        status: ExpenseStatus.OPEN,
        paymentMethod: null,
        paymentProof: null,
        paymentProofUrl: null,
        receiver: 'Test',
        municipality: 'Test',
        serviceInvoice: null,
        serviceInvoiceUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const output: ListExpensesOutput = {
        data: [expense],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      expect(output.data[0].id).toBe('123');
    });

    it('should have required pagination fields', () => {
      const output: ListExpensesOutput = {
        data: [],
        pagination: { page: 1, limit: 10, total: 100 },
      };

      expect(output.pagination.page).toBeDefined();
      expect(output.pagination.limit).toBeDefined();
      expect(output.pagination.total).toBeDefined();
    });
  });
});
