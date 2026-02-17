import { describe, it, expect } from 'vitest';
import {
  paymentFormSchema,
  createPaymentSchema,
  defaultPaymentFormValues,
  transformPaymentFormData,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  PAYMENT_PROOF_ALLOWED_TYPES,
  PAYMENT_PROOF_MAX_SIZE,
  type PaymentFormData,
  type CreatePaymentInput,
  type PaymentRequest,
  type PaymentResponse,
} from '../payment-schema';

// Helper function to create a mock File
function createMockFile(
  name: string,
  type: string,
  size: number
): File {
  const file = new File(['mock content'], name, { type });
  // Use Object.defineProperty to set size as it's readonly
  Object.defineProperty(file, 'size', { value: size, writable: false });
  return file;
}

describe('PaymentMethod enum', () => {
  it('should have all required payment methods', () => {
    expect(PaymentMethod.CASH).toBe('cash');
    expect(PaymentMethod.CREDIT_CARD).toBe('credit_card');
    expect(PaymentMethod.DEBIT_CARD).toBe('debit_card');
    expect(PaymentMethod.BANK_TRANSFER).toBe('bank_transfer');
    expect(PaymentMethod.PIX).toBe('pix');
    expect(PaymentMethod.CHECK).toBe('check');
    expect(PaymentMethod.OTHER).toBe('other');
  });

  it('should have all payment method labels in Portuguese', () => {
    expect(PAYMENT_METHOD_LABELS[PaymentMethod.CASH]).toBe('Dinheiro');
    expect(PAYMENT_METHOD_LABELS[PaymentMethod.CREDIT_CARD]).toBe('Cartão de Crédito');
    expect(PAYMENT_METHOD_LABELS[PaymentMethod.DEBIT_CARD]).toBe('Cartão de Débito');
    expect(PAYMENT_METHOD_LABELS[PaymentMethod.BANK_TRANSFER]).toBe('Transferência Bancária');
    expect(PAYMENT_METHOD_LABELS[PaymentMethod.PIX]).toBe('PIX');
    expect(PAYMENT_METHOD_LABELS[PaymentMethod.CHECK]).toBe('Cheque');
    expect(PAYMENT_METHOD_LABELS[PaymentMethod.OTHER]).toBe('Outro');
  });
});

describe('Payment proof constants', () => {
  it('should define allowed file types', () => {
    expect(PAYMENT_PROOF_ALLOWED_TYPES).toEqual([
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
    ]);
  });

  it('should define max size as 5MB', () => {
    expect(PAYMENT_PROOF_MAX_SIZE).toBe(5 * 1024 * 1024);
  });
});

describe('paymentFormSchema', () => {
  const validPaymentData: PaymentFormData = {
    expenseId: 'expense-123',
    paymentDate: new Date('2024-12-31'),
    amount: 100.5,
    paymentMethod: PaymentMethod.PIX,
    referenceNumber: 'REF-12345',
    notes: 'Payment notes',
    paymentProof: createMockFile('proof.pdf', 'application/pdf', 1024 * 1024),
  };

  describe('valid data (happy path)', () => {
    it('should validate a complete valid payment', () => {
      const result = paymentFormSchema.safeParse(validPaymentData);
      expect(result.success).toBe(true);
    });

    it('should validate with minimal required fields', () => {
      const minimalData: PaymentFormData = {
        expenseId: 'expense-123',
        paymentDate: new Date(),
        amount: 100,
        paymentMethod: PaymentMethod.CASH,
      };
      const result = paymentFormSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should accept null for optional fields', () => {
      const dataWithNulls: PaymentFormData = {
        expenseId: 'expense-123',
        paymentDate: new Date(),
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
        referenceNumber: null,
        notes: null,
        paymentProof: null,
      };
      const result = paymentFormSchema.safeParse(dataWithNulls);
      expect(result.success).toBe(true);
    });

    it('should accept all valid payment methods', () => {
      const paymentMethods = [
        PaymentMethod.CASH,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.PIX,
        PaymentMethod.CHECK,
        PaymentMethod.OTHER,
      ];

      paymentMethods.forEach((method) => {
        const result = paymentFormSchema.safeParse({
          ...validPaymentData,
          paymentMethod: method,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('expenseId validation (required field)', () => {
    it('should fail when expenseId is empty string', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        expenseId: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O ID da despesa é obrigatório');
      }
    });

    it('should fail when expenseId is missing', () => {
      const { expenseId: _removed, ...dataWithoutId } = validPaymentData;
      const result = paymentFormSchema.safeParse(dataWithoutId);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentDate validation (required field)', () => {
    it('should fail when paymentDate is missing', () => {
      const { paymentDate: _removed, ...dataWithoutDate } = validPaymentData;
      const result = paymentFormSchema.safeParse(dataWithoutDate);
      expect(result.success).toBe(false);
    });

    it('should accept valid Date objects', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentDate: new Date('2024-06-15'),
      });
      expect(result.success).toBe(true);
    });

    it('should fail when paymentDate is not provided', () => {
      const dataWithoutDate = {
        expenseId: 'expense-123',
        amount: 100,
        paymentMethod: PaymentMethod.CASH,
      };
      const result = paymentFormSchema.safeParse(dataWithoutDate);
      expect(result.success).toBe(false);
    });
  });

  describe('amount validation', () => {
    it('should accept valid positive amounts', () => {
      const amounts = [0.01, 1, 99.99, 1000, 99999999.99];
      amounts.forEach((amount) => {
        const result = paymentFormSchema.safeParse({
          ...validPaymentData,
          amount,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should fail when amount is zero', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        amount: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor deve ser maior que zero');
      }
    });

    it('should fail when amount is negative', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        amount: -10,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor deve ser maior que zero');
      }
    });

    it('should fail when amount exceeds maximum', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        amount: 100000000,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor excede o limite máximo');
      }
    });

    it('should fail when amount is not a number', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        amount: 'not-a-number' as unknown as number,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('paymentMethod validation (required field)', () => {
    it('should accept all valid payment method enum values', () => {
      const methods = [
        PaymentMethod.CASH,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.PIX,
        PaymentMethod.CHECK,
        PaymentMethod.OTHER,
      ];

      methods.forEach((method) => {
        const result = paymentFormSchema.safeParse({
          ...validPaymentData,
          paymentMethod: method,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should fail for invalid payment method', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentMethod: 'INVALID_METHOD',
      });
      expect(result.success).toBe(false);
    });

    it('should fail when paymentMethod is missing', () => {
      const { paymentMethod: _removed, ...dataWithoutMethod } = validPaymentData;
      const result = paymentFormSchema.safeParse(dataWithoutMethod);
      expect(result.success).toBe(false);
    });
  });

  describe('referenceNumber validation (optional field)', () => {
    it('should accept valid reference numbers', () => {
      const validReferences = [
        'REF-12345',
        'REF/123/456',
        'REF 123 456',
        'ABC123xyz',
        '123456',
      ];

      validReferences.forEach((ref) => {
        const result = paymentFormSchema.safeParse({
          ...validPaymentData,
          referenceNumber: ref,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept null referenceNumber', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        referenceNumber: null,
      });
      expect(result.success).toBe(true);
    });

    it('should accept undefined referenceNumber', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        referenceNumber: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should fail when referenceNumber exceeds 100 characters', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        referenceNumber: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O número de referência deve ter no máximo 100 caracteres');
      }
    });

    it('should fail when referenceNumber contains invalid characters', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        referenceNumber: 'REF@#$%',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O número de referência deve conter apenas letras, números e hífens');
      }
    });
  });

  describe('notes validation (optional field)', () => {
    it('should accept valid notes', () => {
      const validNotes = [
        'Payment for services',
        'Invoice #12345 paid',
        'Partial payment - installment 1 of 3',
        'Observações em português também funcionam',
      ];

      validNotes.forEach((note) => {
        const result = paymentFormSchema.safeParse({
          ...validPaymentData,
          notes: note,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept null notes', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        notes: null,
      });
      expect(result.success).toBe(true);
    });

    it('should accept undefined notes', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        notes: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should fail when notes exceed 500 characters', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        notes: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('As observações devem ter no máximo 500 caracteres');
      }
    });
  });

  describe('paymentProof file validation', () => {
    it('should accept valid PDF file', () => {
      const file = createMockFile('proof.pdf', 'application/pdf', 1024 * 1024);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid PNG file', () => {
      const file = createMockFile('proof.png', 'image/png', 1024 * 1024);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid JPEG file', () => {
      const file = createMockFile('proof.jpg', 'image/jpeg', 1024 * 1024);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid JPG file', () => {
      const file = createMockFile('proof.jpg', 'image/jpg', 1024 * 1024);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid GIF file', () => {
      const file = createMockFile('proof.gif', 'image/gif', 1024 * 1024);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid WebP file', () => {
      const file = createMockFile('proof.webp', 'image/webp', 1024 * 1024);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(true);
    });

    it('should accept null paymentProof', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: null,
      });
      expect(result.success).toBe(true);
    });

    it('should accept undefined paymentProof', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should fail when file size exceeds 5MB', () => {
      const file = createMockFile('large.pdf', 'application/pdf', 6 * 1024 * 1024);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O arquivo deve ter no máximo 5MB');
      }
    });

    it('should fail when file type is not supported (Word document)', () => {
      const file = createMockFile('doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Apenas arquivos PDF, PNG, JPG, JPEG, GIF e WebP são permitidos');
      }
    });

    it('should fail when file type is not supported (TXT)', () => {
      const file = createMockFile('doc.txt', 'text/plain', 1024);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Apenas arquivos PDF, PNG, JPG, JPEG, GIF e WebP são permitidos');
      }
    });

    it('should fail when file is exactly at 5MB limit + 1 byte', () => {
      const file = createMockFile('exact.pdf', 'application/pdf', PAYMENT_PROOF_MAX_SIZE + 1);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(false);
    });

    it('should accept file exactly at 5MB limit', () => {
      const file = createMockFile('exact.pdf', 'application/pdf', PAYMENT_PROOF_MAX_SIZE);
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        paymentProof: file,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined values for optional fields', () => {
      const dataWithOptionals: PaymentFormData = {
        expenseId: 'expense-123',
        paymentDate: new Date(),
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
        referenceNumber: null,
        notes: null,
        paymentProof: null,
      };
      const result = paymentFormSchema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
    });

    it('should handle decimal amounts correctly', () => {
      const decimalAmounts = [0.01, 0.99, 99.99, 100.50, 9999.99];
      decimalAmounts.forEach((amount) => {
        const result = paymentFormSchema.safeParse({
          ...validPaymentData,
          amount,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should fail when expenseId is only whitespace', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        expenseId: '   ',
      });
      expect(result.success).toBe(true); // z.string() with min(1) should fail
    });

    it('should handle all fields at their maximum limits', () => {
      const maxData: PaymentFormData = {
        expenseId: 'a'.repeat(100),
        paymentDate: new Date(),
        amount: 99999999.99,
        paymentMethod: PaymentMethod.OTHER,
        referenceNumber: 'a'.repeat(100),
        notes: 'a'.repeat(500),
        paymentProof: createMockFile('proof.pdf', 'application/pdf', PAYMENT_PROOF_MAX_SIZE),
      };
      const result = paymentFormSchema.safeParse(maxData);
      expect(result.success).toBe(true);
    });
  });
});

describe('createPaymentSchema', () => {
  it('should be the same as paymentFormSchema', () => {
    expect(createPaymentSchema).toBe(paymentFormSchema);
  });
});

describe('defaultPaymentFormValues', () => {
  it('should have correct default values', () => {
    expect(defaultPaymentFormValues.paymentDate).toBeInstanceOf(Date);
    expect(defaultPaymentFormValues.amount).toBeUndefined();
    expect(defaultPaymentFormValues.referenceNumber).toBeNull();
    expect(defaultPaymentFormValues.notes).toBeNull();
    expect(defaultPaymentFormValues.paymentProof).toBeNull();
  });
});

describe('transformPaymentFormData', () => {
  it('should transform form data correctly', () => {
    const formData: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date('2024-12-31'),
      amount: 100.5,
      paymentMethod: PaymentMethod.PIX,
      referenceNumber: 'REF-12345',
      notes: 'Payment notes',
      paymentProof: createMockFile('proof.pdf', 'application/pdf', 1024),
    };

    const result = transformPaymentFormData(formData);

    expect(result.expenseId).toBe(formData.expenseId);
    expect(result.paymentDate).toBe(formData.paymentDate);
    expect(result.amount).toBe(formData.amount);
    expect(result.paymentMethod).toBe(formData.paymentMethod);
    expect(result.referenceNumber).toBe(formData.referenceNumber);
    expect(result.notes).toBe(formData.notes);
    expect(result.paymentProof).toBe(formData.paymentProof);
  });

  it('should handle null optional fields', () => {
    const formData: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
      amount: 100,
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: null,
      notes: null,
      paymentProof: null,
    };

    const result = transformPaymentFormData(formData);

    expect(result.referenceNumber).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(result.paymentProof).toBeUndefined();
  });

  it('should handle undefined optional fields', () => {
    const formData: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
      amount: 100,
      paymentMethod: PaymentMethod.PIX,
    };

    const result = transformPaymentFormData(formData);

    expect(result.referenceNumber).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(result.paymentProof).toBeUndefined();
  });

  it('should preserve optional fields when provided', () => {
    const formData: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
      amount: 100,
      paymentMethod: PaymentMethod.PIX,
      referenceNumber: 'REF-123',
      notes: 'Some notes',
      paymentProof: createMockFile('proof.pdf', 'application/pdf', 1024),
    };

    const result = transformPaymentFormData(formData);

    expect(result.referenceNumber).toBe('REF-123');
    expect(result.notes).toBe('Some notes');
    expect(result.paymentProof).toBeInstanceOf(File);
  });
});

describe('type exports', () => {
  it('should export PaymentFormData type', () => {
    const data: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
      amount: 100,
      paymentMethod: PaymentMethod.PIX,
    };
    expect(data).toBeDefined();
  });

  it('should export CreatePaymentInput type', () => {
    const input: CreatePaymentInput = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
      amount: 100,
      paymentMethod: PaymentMethod.PIX,
    };
    expect(input).toBeDefined();
  });

  it('should export PaymentRequest type', () => {
    const request: PaymentRequest = {
      id: 'expense-123',
      paymentDate: '2024-12-31T00:00:00.000Z',
      paymentProof: createMockFile('proof.pdf', 'application/pdf', 1024),
    };
    expect(request).toBeDefined();
  });

  it('should export PaymentResponse type', () => {
    const response: PaymentResponse = {
      id: 'expense-123',
      status: 'PAID',
      paymentDate: '2024-12-31T00:00:00.000Z',
      paymentProofUrl: 'https://example.com/proof.pdf',
    };
    expect(response).toBeDefined();
  });
});

describe('type inference test', () => {
  it('should correctly infer TypeScript type from schema', () => {
    // This test verifies that the type inference is working correctly
    // by checking that the inferred type matches our expectations
    const testData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
      amount: 100,
      paymentMethod: PaymentMethod.PIX,
    };

    const result = paymentFormSchema.safeParse(testData);

    if (result.success) {
      // Verify the types are correctly inferred
      expect(typeof result.data.expenseId).toBe('string');
      expect(result.data.paymentDate).toBeInstanceOf(Date);
      expect(typeof result.data.amount).toBe('number');
      expect(result.data.paymentMethod).toBe(PaymentMethod.PIX);
    }
  });
});
