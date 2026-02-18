import { describe, it, expect } from 'vitest';
import {
  expenseFormSchema,
  createExpenseSchema,
  updateExpenseSchema,
  defaultExpenseFormValues,
  transformExpenseFormData,
  EXPENSE_FILE_ALLOWED_TYPES,
  EXPENSE_FILE_MAX_SIZE,
  type ExpenseFormData,
} from '../expense-form-schema';
import { ExpenseStatus } from '../../constants/expenses';

const createValidFile = (name = 'test.pdf', type = 'application/pdf', size = 1024): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size, writable: false });
  return file;
};

const createValidExpenseData = (overrides?: Partial<ExpenseFormData>): ExpenseFormData => ({
  description: 'Test expense',
  amount: 100.5,
  currency: 'BRL',
  dueDate: new Date('2024-12-31'),
  status: ExpenseStatus.OPEN,
  categoryId: 'category-123',
  paymentMethod: 'PIX',
  receiver: 'John Doe',
  municipality: 'São Paulo',
  serviceInvoice: null,
  bankBill: null,
  ...overrides,
});

describe('expenseFormSchema', () => {
  describe('valid data', () => {
    it('should validate a complete valid expense', () => {
      const data = createValidExpenseData();
      const result = expenseFormSchema.safeParse(data);
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
        bankBill: null,
      };
      const result = expenseFormSchema.safeParse(dataWithNulls);
      expect(result.success).toBe(true);
    });
  });

  describe('description validation', () => {
    it('should fail when description is empty', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        description: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('A descrição é obrigatória');
      }
    });

    it('should fail when description exceeds 255 characters', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
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
        ...createValidExpenseData(),
        amount: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor deve ser maior que zero');
      }
    });

    it('should fail when amount is negative', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        amount: -10,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor deve ser maior que zero');
      }
    });

    it('should fail when amount exceeds maximum', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        amount: 100000000,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor excede o limite máximo');
      }
    });

    it('should accept valid decimal amounts', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        amount: 99.99,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('receiver validation', () => {
    it('should fail when receiver is empty', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        receiver: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O favorecido é obrigatório');
      }
    });

    it('should fail when receiver exceeds 100 characters', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
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
        ...createValidExpenseData(),
        municipality: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O município é obrigatório');
      }
    });

    it('should fail when municipality contains invalid characters', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        municipality: 'City123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O município deve conter apenas letras e espaços');
      }
    });

    it('should accept municipalities with accents', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        municipality: 'São João del-Rei',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('dueDate validation', () => {
    it('should fail when dueDate is missing', () => {
      const { dueDate: _removedDueDate, ...dataWithoutDate } = createValidExpenseData();
      const result = expenseFormSchema.safeParse(dataWithoutDate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.message === 'A data de vencimento é obrigatória')).toBe(true);
      }
    });

    it('should accept valid Date objects', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
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
          ...createValidExpenseData(),
          status,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should fail for invalid status', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        status: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('paymentMethod validation', () => {
    it('should accept null paymentMethod', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        paymentMethod: null,
      });
      expect(result.success).toBe(true);
    });

    it('should fail when paymentMethod exceeds 100 characters', () => {
      const result = expenseFormSchema.safeParse({
        ...createValidExpenseData(),
        paymentMethod: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('A forma de pagamento deve ter no máximo 100 caracteres');
      }
    });
  });
});

describe('expenseFormSchema - File Fields', () => {
  describe('serviceInvoice file validation', () => {
    it('should accept null for serviceInvoice', () => {
      const data = createValidExpenseData({ serviceInvoice: null });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept undefined for serviceInvoice', () => {
      const data = createValidExpenseData({ serviceInvoice: undefined });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept valid PDF file', () => {
      const file = createValidFile('invoice.pdf', 'application/pdf');
      const data = createValidExpenseData({ serviceInvoice: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept valid PNG file', () => {
      const file = createValidFile('invoice.png', 'image/png');
      const data = createValidExpenseData({ serviceInvoice: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept valid JPEG file', () => {
      const file = createValidFile('invoice.jpg', 'image/jpeg');
      const data = createValidExpenseData({ serviceInvoice: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept valid JPG file', () => {
      const file = createValidFile('invoice.jpeg', 'image/jpg');
      const data = createValidExpenseData({ serviceInvoice: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject file larger than 5MB', () => {
      const largeFile = createValidFile('large.pdf', 'application/pdf', EXPENSE_FILE_MAX_SIZE + 1);
      const data = createValidExpenseData({ serviceInvoice: largeFile });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5MB');
      }
    });

    it('should accept file exactly at 5MB limit', () => {
      const exactSizeFile = createValidFile('exact.pdf', 'application/pdf', EXPENSE_FILE_MAX_SIZE);
      const data = createValidExpenseData({ serviceInvoice: exactSizeFile });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid file type (txt)', () => {
      const file = createValidFile('invoice.txt', 'text/plain');
      const data = createValidExpenseData({ serviceInvoice: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('PDF');
      }
    });

    it('should reject invalid file type (exe)', () => {
      const file = createValidFile('malware.exe', 'application/octet-stream');
      const data = createValidExpenseData({ serviceInvoice: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid file type (gif)', () => {
      const file = createValidFile('image.gif', 'image/gif');
      const data = createValidExpenseData({ serviceInvoice: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('bankBill file validation', () => {
    it('should accept null for bankBill', () => {
      const data = createValidExpenseData({ bankBill: null });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept undefined for bankBill', () => {
      const data = createValidExpenseData({ bankBill: undefined });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept valid PDF file', () => {
      const file = createValidFile('boleto.pdf', 'application/pdf');
      const data = createValidExpenseData({ bankBill: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept valid PNG file', () => {
      const file = createValidFile('boleto.png', 'image/png');
      const data = createValidExpenseData({ bankBill: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject file larger than 5MB', () => {
      const largeFile = createValidFile('large.pdf', 'application/pdf', EXPENSE_FILE_MAX_SIZE + 1);
      const data = createValidExpenseData({ bankBill: largeFile });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid file type', () => {
      const file = createValidFile('boleto.txt', 'text/plain');
      const data = createValidExpenseData({ bankBill: file });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('both file fields together', () => {
    it('should accept both files when valid', () => {
      const invoiceFile = createValidFile('invoice.pdf', 'application/pdf');
      const boletoFile = createValidFile('boleto.png', 'image/png');
      const data = createValidExpenseData({ 
        serviceInvoice: invoiceFile, 
        bankBill: boletoFile 
      });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept one file and null for the other', () => {
      const invoiceFile = createValidFile('invoice.pdf', 'application/pdf');
      const data = createValidExpenseData({ 
        serviceInvoice: invoiceFile, 
        bankBill: null 
      });
      const result = expenseFormSchema.safeParse(data);
      expect(result.success).toBe(true);
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

  it('should include bankBill as null', () => {
    expect(defaultExpenseFormValues.bankBill).toBeNull();
  });

  it('should have serviceInvoice as null', () => {
    expect(defaultExpenseFormValues.serviceInvoice).toBeNull();
  });
});

describe('transformExpenseFormData', () => {
  it('should transform form data correctly', () => {
    const formData = createValidExpenseData();

    const result = transformExpenseFormData(formData);

    expect(result).toEqual(formData);
  });

  it('should handle null optional fields', () => {
    const formData = createValidExpenseData({
      categoryId: null,
      paymentMethod: null,
      serviceInvoice: null,
      bankBill: null,
    });

    const result = transformExpenseFormData(formData);

    expect(result.categoryId).toBeNull();
    expect(result.paymentMethod).toBeNull();
    expect(result.serviceInvoice).toBeNull();
    expect(result.bankBill).toBeNull();
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
      serviceInvoice: null,
      bankBill: null,
    } as unknown as ExpenseFormData;

    const result = transformExpenseFormData(formData);

    expect(result.categoryId).toBeNull();
    expect(result.paymentMethod).toBeNull();
  });

  it('should include bankBill in transformed output', () => {
    const file = createValidFile('test.pdf', 'application/pdf');
    const data = createValidExpenseData({ bankBill: file });
    const result = transformExpenseFormData(data);
    expect(result.bankBill).toBe(file);
  });

  it('should handle null file values correctly', () => {
    const data = createValidExpenseData({ 
      serviceInvoice: null, 
      bankBill: null 
    });
    const result = transformExpenseFormData(data);
    expect(result.serviceInvoice).toBeNull();
    expect(result.bankBill).toBeNull();
  });

  it('should preserve file values in transformation', () => {
    const invoiceFile = createValidFile('invoice.pdf', 'application/pdf');
    const boletoFile = createValidFile('boleto.png', 'image/png');
    const data = createValidExpenseData({ 
      serviceInvoice: invoiceFile, 
      bankBill: boletoFile 
    });
    const result = transformExpenseFormData(data);
    expect(result.serviceInvoice).toBe(invoiceFile);
    expect(result.bankBill).toBe(boletoFile);
  });
});

describe('EXPENSE_FILE constants', () => {
  it('should export correct allowed types', () => {
    expect(EXPENSE_FILE_ALLOWED_TYPES).toContain('application/pdf');
    expect(EXPENSE_FILE_ALLOWED_TYPES).toContain('image/png');
    expect(EXPENSE_FILE_ALLOWED_TYPES).toContain('image/jpeg');
    expect(EXPENSE_FILE_ALLOWED_TYPES).toContain('image/jpg');
    expect(EXPENSE_FILE_ALLOWED_TYPES).toHaveLength(4);
  });

  it('should have correct max size (5MB)', () => {
    expect(EXPENSE_FILE_MAX_SIZE).toBe(5 * 1024 * 1024);
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
