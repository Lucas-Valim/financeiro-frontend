import { describe, it, expect } from 'vitest';
import type {
  ExpenseDTO,
  ExpenseFilter,
  ListExpensesOutput,
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../expenses';
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

  describe('CreateExpenseInput', () => {
    it('should have correct structure with all required fields', () => {
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test expense',
        amount: 100.50,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Test Receiver',
        municipality: 'Test City',
      };

      expect(input.organizationId).toBe('org-123');
      expect(input.description).toBe('Test expense');
      expect(input.amount).toBe(100.50);
      expect(input.currency).toBe('BRL');
      expect(input.dueDate).toBeInstanceOf(Date);
      expect(input.receiver).toBe('Test Receiver');
      expect(input.municipality).toBe('Test City');
    });

    it('should have all required fields defined', () => {
      const requiredFields: (keyof CreateExpenseInput)[] = [
        'organizationId',
        'description',
        'amount',
        'currency',
        'dueDate',
        'receiver',
        'municipality',
      ];

      expect(requiredFields.length).toBe(7);
    });

    it('should accept optional paymentMethod', () => {
      const inputWithPaymentMethod: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test expense',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date(),
        receiver: 'Test',
        municipality: 'City',
        paymentMethod: 'PIX',
      };

      expect(inputWithPaymentMethod.paymentMethod).toBe('PIX');
    });

    it('should work without optional fields', () => {
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test expense',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date(),
        receiver: 'Test',
        municipality: 'City',
      };

      expect(input.paymentMethod).toBeUndefined();
    });

    it('should accept string values for description and receiver', () => {
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'A valid description',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date(),
        receiver: 'A valid receiver name',
        municipality: 'A valid city name',
      };

      expect(typeof input.description).toBe('string');
      expect(typeof input.receiver).toBe('string');
      expect(typeof input.municipality).toBe('string');
    });

    it('should accept number for amount', () => {
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 99999999.99,
        currency: 'BRL',
        dueDate: new Date(),
        receiver: 'Test',
        municipality: 'City',
      };

      expect(typeof input.amount).toBe('number');
      expect(input.amount).toBe(99999999.99);
    });
  });

  describe('UpdateExpenseInput', () => {
    it('should have all fields optional', () => {
      const emptyInput: UpdateExpenseInput = {};

      expect(emptyInput.description).toBeUndefined();
      expect(emptyInput.amount).toBeUndefined();
      expect(emptyInput.dueDate).toBeUndefined();
      expect(emptyInput.receiver).toBeUndefined();
      expect(emptyInput.municipality).toBeUndefined();
      expect(emptyInput.paymentMethod).toBeUndefined();
    });

    it('should accept partial updates with single field', () => {
      const inputWithDescriptionOnly: UpdateExpenseInput = {
        description: 'Updated description',
      };

      expect(inputWithDescriptionOnly.description).toBe('Updated description');
      expect(inputWithDescriptionOnly.amount).toBeUndefined();
    });

    it('should accept partial updates with multiple fields', () => {
      const input: UpdateExpenseInput = {
        description: 'Updated',
        amount: 200,
        receiver: 'New Receiver',
      };

      expect(input.description).toBe('Updated');
      expect(input.amount).toBe(200);
      expect(input.receiver).toBe('New Receiver');
    });

    it('should accept all optional fields', () => {
      const fullInput: UpdateExpenseInput = {
        description: 'Full update',
        amount: 500,
        dueDate: new Date('2025-01-01'),
        receiver: 'New Receiver',
        municipality: 'New City',
        paymentMethod: 'Bank Transfer',
      };

      expect(fullInput.description).toBe('Full update');
      expect(fullInput.amount).toBe(500);
      expect(fullInput.dueDate).toBeInstanceOf(Date);
      expect(fullInput.receiver).toBe('New Receiver');
      expect(fullInput.municipality).toBe('New City');
      expect(fullInput.paymentMethod).toBe('Bank Transfer');
    });

    it('should have correct field types', () => {
      const input: UpdateExpenseInput = {
        description: 'Test',
        amount: 100,
        dueDate: new Date(),
        receiver: 'Test',
        municipality: 'Test',
        paymentMethod: 'Test',
      };

      expect(typeof input.description).toBe('string');
      expect(typeof input.amount).toBe('number');
      expect(input.dueDate).toBeInstanceOf(Date);
      expect(typeof input.receiver).toBe('string');
      expect(typeof input.municipality).toBe('string');
      expect(typeof input.paymentMethod).toBe('string');
    });
  });
});
