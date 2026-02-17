import { describe, it, expect } from 'vitest';
import {
  expenseFormSchema,
  createExpenseSchema,
  updateExpenseSchema,
  defaultExpenseFormValues,
  transformExpenseFormData,
  type ExpenseFormData,
} from '../expense-form-schema';
import { ExpenseStatus } from '../../constants/expenses';

describe('expenseFormSchema', () => {
  const validExpenseData: ExpenseFormData = {
    description: 'Test expense',
    amount: 100.5,
    currency: 'BRL',
    dueDate: new Date('2024-12-31'),
    status: ExpenseStatus.OPEN,
    categoryId: 'category-123',
    paymentMethod: 'PIX',
    receiver: 'John Doe',
    municipality: 'São Paulo',
    serviceInvoice: 'NF-12345',
  };

  describe('valid data', () => {
    it('should validate a complete valid expense', () => {
      const result = expenseFormSchema.safeParse(validExpenseData);
      expect(result.success).toBe(true);
    });

    it('should validate with minimal required fields', () => {
      const minimalData: ExpenseFormData = {
        description: 'Test',
        amount: 1,
        currency: 'BRL',
        dueDate: new Date(),
        status: ExpenseStatus.OPEN,
        receiver: 'John',
        municipality: 'City',
      };
      const result = expenseFormSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should accept null for optional fields', () => {
      const dataWithNulls: ExpenseFormData = {
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date(),
        status: ExpenseStatus.OPEN,
        categoryId: null,
        paymentMethod: null,
        receiver: 'John',
        municipality: 'City',
        serviceInvoice: null,
      };
      const result = expenseFormSchema.safeParse(dataWithNulls);
      expect(result.success).toBe(true);
    });
  });

  describe('description validation', () => {
    it('should fail when description is empty', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        description: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('A descrição é obrigatória');
      }
    });

    it('should fail when description exceeds 255 characters', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        description: 'a'.repeat(256),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('A descrição deve ter no máximo 255 caracteres');
      }
    });
  });

  describe('amount validation', () => {
    it('should fail when amount is zero', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        amount: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor deve ser maior que zero');
      }
    });

    it('should fail when amount is negative', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        amount: -10,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor deve ser maior que zero');
      }
    });

    it('should fail when amount exceeds maximum', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        amount: 100000000,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor excede o limite máximo');
      }
    });

    it('should accept valid decimal amounts', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        amount: 99.99,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('receiver validation', () => {
    it('should fail when receiver is empty', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        receiver: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O favorecido é obrigatório');
      }
    });

    it('should fail when receiver exceeds 100 characters', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        receiver: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O favorecido deve ter no máximo 100 caracteres');
      }
    });
  });

  describe('municipality validation', () => {
    it('should fail when municipality is empty', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        municipality: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O município é obrigatório');
      }
    });

    it('should fail when municipality contains invalid characters', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        municipality: 'City123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O município deve conter apenas letras e espaços');
      }
    });

    it('should accept municipalities with accents', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        municipality: 'São João del-Rei',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('dueDate validation', () => {
    it('should fail when dueDate is missing', () => {
      const { dueDate: _removedDueDate, ...dataWithoutDate } = validExpenseData;
      const result = expenseFormSchema.safeParse(dataWithoutDate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.message === 'A data de vencimento é obrigatória')).toBe(true);
      }
    });

    it('should accept valid Date objects', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        dueDate: new Date('2024-06-15'),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('status validation', () => {
    it('should accept all valid status values', () => {
      const statuses = [ExpenseStatus.OPEN, ExpenseStatus.OVERDUE, ExpenseStatus.PAID, ExpenseStatus.CANCELLED];
      statuses.forEach(status => {
        const result = expenseFormSchema.safeParse({
          ...validExpenseData,
          status,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should fail for invalid status', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        status: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('serviceInvoice validation', () => {
    it('should accept null serviceInvoice', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        serviceInvoice: null,
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty string serviceInvoice', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        serviceInvoice: '',
      });
      expect(result.success).toBe(true);
    });

    it('should accept alphanumeric serviceInvoice', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        serviceInvoice: 'NF-123/456',
      });
      expect(result.success).toBe(true);
    });

    it('should fail when serviceInvoice exceeds 50 characters', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        serviceInvoice: 'a'.repeat(51),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('A nota de serviço deve ter no máximo 50 caracteres');
      }
    });
  });

  describe('paymentMethod validation', () => {
    it('should accept null paymentMethod', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        paymentMethod: null,
      });
      expect(result.success).toBe(true);
    });

    it('should fail when paymentMethod exceeds 100 characters', () => {
      const result = expenseFormSchema.safeParse({
        ...validExpenseData,
        paymentMethod: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('A forma de pagamento deve ter no máximo 100 caracteres');
      }
    });
  });
});

describe('createExpenseSchema', () => {
  it('should be the same as expenseFormSchema', () => {
    expect(createExpenseSchema).toBe(expenseFormSchema);
  });
});

describe('updateExpenseSchema', () => {
  it('should allow partial updates with all fields optional', () => {
    const result = updateExpenseSchema.safeParse({
      description: 'Updated description',
    });
    expect(result.success).toBe(true);
  });

  it('should allow empty object', () => {
    const result = updateExpenseSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should still validate field values when provided', () => {
    const result = updateExpenseSchema.safeParse({
      amount: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe('defaultExpenseFormValues', () => {
  it('should have correct default values', () => {
    expect(defaultExpenseFormValues.description).toBe('');
    expect(defaultExpenseFormValues.amount).toBeUndefined();
    expect(defaultExpenseFormValues.currency).toBe('BRL');
    expect(defaultExpenseFormValues.status).toBe(ExpenseStatus.OPEN);
    expect(defaultExpenseFormValues.categoryId).toBeNull();
    expect(defaultExpenseFormValues.paymentMethod).toBeNull();
    expect(defaultExpenseFormValues.receiver).toBe('');
    expect(defaultExpenseFormValues.municipality).toBe('');
    expect(defaultExpenseFormValues.serviceInvoice).toBeNull();
  });
});

describe('transformExpenseFormData', () => {
  it('should transform form data correctly', () => {
    const formData: ExpenseFormData = {
      description: 'Test expense',
      amount: 100.5,
      currency: 'BRL',
      dueDate: new Date('2024-12-31'),
      status: ExpenseStatus.OPEN,
      categoryId: 'category-123',
      paymentMethod: 'PIX',
      receiver: 'John Doe',
      municipality: 'São Paulo',
      serviceInvoice: 'NF-12345',
    };

    const result = transformExpenseFormData(formData);

    expect(result).toEqual(formData);
  });

  it('should handle null optional fields', () => {
    const formData: ExpenseFormData = {
      description: 'Test expense',
      amount: 100,
      currency: 'BRL',
      dueDate: new Date(),
      status: ExpenseStatus.OPEN,
      categoryId: null,
      paymentMethod: null,
      receiver: 'John Doe',
      municipality: 'City',
      serviceInvoice: null,
    };

    const result = transformExpenseFormData(formData);

    expect(result.categoryId).toBeNull();
    expect(result.paymentMethod).toBeNull();
    expect(result.serviceInvoice).toBeNull();
  });

  it('should convert empty strings to null for optional fields', () => {
    const formData = {
      description: 'Test expense',
      amount: 100,
      currency: 'BRL',
      dueDate: new Date(),
      status: ExpenseStatus.OPEN,
      categoryId: '',
      paymentMethod: '',
      receiver: 'John Doe',
      municipality: 'City',
      serviceInvoice: '',
    } as unknown as ExpenseFormData;

    const result = transformExpenseFormData(formData);

    expect(result.categoryId).toBeNull();
    expect(result.paymentMethod).toBeNull();
    expect(result.serviceInvoice).toBeNull();
  });
});

describe('type exports', () => {
  it('should export ExpenseFormData type', () => {
    const data: ExpenseFormData = {
      description: 'Test',
      amount: 100,
      currency: 'BRL',
      dueDate: new Date(),
      status: ExpenseStatus.OPEN,
      receiver: 'John',
      municipality: 'City',
    };
    expect(data).toBeDefined();
  });
});
