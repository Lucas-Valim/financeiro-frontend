import { describe, it, expect } from 'vitest';
import {
  paymentFormSchema,
  createPaymentSchema,
  defaultPaymentFormValues,
  transformPaymentFormData,
  PAYMENT_PROOF_ALLOWED_TYPES,
  PAYMENT_PROOF_MAX_SIZE,
  type PaymentFormData,
  type CreatePaymentInput,
  type PaymentRequest,
  type PaymentResponse,
} from '../payment-schema';

function createMockFile(
  name: string,
  type: string,
  size: number
): File {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size, writable: false });
  return file;
}

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
      };
      const result = paymentFormSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should accept null for optional fields', () => {
      const dataWithNulls: PaymentFormData = {
        expenseId: 'expense-123',
        paymentDate: new Date(),
        paymentProof: null,
      };
      const result = paymentFormSchema.safeParse(dataWithNulls);
      expect(result.success).toBe(true);
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
      };
      const result = paymentFormSchema.safeParse(dataWithoutDate);
      expect(result.success).toBe(false);
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
        paymentProof: null,
      };
      const result = paymentFormSchema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
    });

    it('should fail when expenseId is only whitespace', () => {
      const result = paymentFormSchema.safeParse({
        ...validPaymentData,
        expenseId: '   ',
      });
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
    expect(defaultPaymentFormValues.paymentProof).toBeNull();
  });
});

describe('transformPaymentFormData', () => {
  it('should transform form data correctly', () => {
    const formData: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date('2024-12-31'),
      paymentProof: createMockFile('proof.pdf', 'application/pdf', 1024),
    };

    const result = transformPaymentFormData(formData);

    expect(result.expenseId).toBe(formData.expenseId);
    expect(result.paymentDate).toBe(formData.paymentDate);
    expect(result.paymentProof).toBe(formData.paymentProof);
  });

  it('should handle null optional fields', () => {
    const formData: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
      paymentProof: null,
    };

    const result = transformPaymentFormData(formData);

    expect(result.paymentProof).toBeUndefined();
  });

  it('should handle undefined optional fields', () => {
    const formData: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
    };

    const result = transformPaymentFormData(formData);

    expect(result.paymentProof).toBeUndefined();
  });

  it('should preserve optional fields when provided', () => {
    const formData: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
      paymentProof: createMockFile('proof.pdf', 'application/pdf', 1024),
    };

    const result = transformPaymentFormData(formData);

    expect(result.paymentProof).toBeInstanceOf(File);
  });
});

describe('type exports', () => {
  it('should export PaymentFormData type', () => {
    const data: PaymentFormData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
    };
    expect(data).toBeDefined();
  });

  it('should export CreatePaymentInput type', () => {
    const input: CreatePaymentInput = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
    };
    expect(input).toBeDefined();
  });

  it('should export PaymentRequest type', () => {
    const request: PaymentRequest = {
      id: 'expense-123',
      paymentDate: '2024-12-31',
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
    const testData = {
      expenseId: 'expense-123',
      paymentDate: new Date(),
    };

    const result = paymentFormSchema.safeParse(testData);

    if (result.success) {
      expect(typeof result.data.expenseId).toBe('string');
      expect(result.data.paymentDate).toBeInstanceOf(Date);
    }
  });
});
