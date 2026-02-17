import { z } from 'zod';

/**
 * Validation schema for payment form data
 * Used with React Hook Form via zodResolver
 * Provides real-time validation with Portuguese error messages
 */

/**
 * Payment method enum values
 * Brazilian payment methods for expense payments
 */
export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PIX = 'pix',
  CHECK = 'check',
  OTHER = 'other',
}

/**
 * Payment method labels in Portuguese
 */
export const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência Bancária',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.CHECK]: 'Cheque',
  [PaymentMethod.OTHER]: 'Outro',
} as const;

/**
 * Supported file types for payment proof
 */
export const PAYMENT_PROOF_ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
] as const;

/**
 * Maximum file size for payment proof (5MB in bytes)
 */
export const PAYMENT_PROOF_MAX_SIZE = 5 * 1024 * 1024;

/**
 * Custom File validation with type checking
 */
const fileSchema = z.custom<File>(
  (value) => value instanceof File,
  { message: 'O arquivo é obrigatório' }
);

/**
 * Payment proof file validation with type and size constraints
 */
const paymentProofFileSchema = fileSchema
  .refine(
    (file) => file.size <= PAYMENT_PROOF_MAX_SIZE,
    { message: 'O arquivo deve ter no máximo 5MB' }
  )
  .refine(
    (file) => PAYMENT_PROOF_ALLOWED_TYPES.includes(file.type as typeof PAYMENT_PROOF_ALLOWED_TYPES[number]),
    { message: 'Apenas arquivos PDF, PNG, JPG, JPEG, GIF e WebP são permitidos' }
  );

/**
 * Reference number validation (alphanumeric with common characters)
 */
const referenceNumberRegex = /^[a-zA-Z0-9\-/\s]+$/;

/**
 * Base payment form schema with validation rules
 */
export const paymentFormSchema = z.object({
  expenseId: z
    .string({ error: 'O ID da despesa é obrigatório' })
    .min(1, { error: 'O ID da despesa é obrigatório' }),

  paymentDate: z
    .date({ error: 'A data do pagamento é obrigatória' }),

  amount: z
    .number({ error: 'O valor deve ser um número válido' })
    .positive({ error: 'O valor deve ser maior que zero' })
    .max(99999999.99, { error: 'O valor excede o limite máximo' }),

  paymentMethod: z
    .nativeEnum(PaymentMethod, {
      error: 'A forma de pagamento é obrigatória',
    }),

  referenceNumber: z
    .string()
    .max(100, { error: 'O número de referência deve ter no máximo 100 caracteres' })
    .refine(
      (value) => !value || referenceNumberRegex.test(value),
      { error: 'O número de referência deve conter apenas letras, números e hífens' }
    )
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(500, { error: 'As observações devem ter no máximo 500 caracteres' })
    .optional()
    .nullable(),

  paymentProof: paymentProofFileSchema.optional().nullable(),
});

/**
 * Schema for recording a payment (all fields required except optional ones)
 */
export const createPaymentSchema = paymentFormSchema;

/**
 * Inferred TypeScript types from the schemas
 */
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

/**
 * Default values for the payment form
 */
export const defaultPaymentFormValues: Partial<PaymentFormData> = {
  paymentDate: new Date(),
  amount: undefined,
  referenceNumber: null,
  notes: null,
  paymentProof: null,
};

/**
 * Transform form data for API submission
 * Converts null values to undefined and formats dates
 */
export function transformPaymentFormData(data: PaymentFormData): CreatePaymentInput {
  return {
    expenseId: data.expenseId,
    paymentDate: data.paymentDate,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    referenceNumber: data.referenceNumber || undefined,
    notes: data.notes || undefined,
    paymentProof: data.paymentProof || undefined,
  };
}

/**
 * Payment request payload for API
 * Matches the backend API contract
 */
export interface PaymentRequest {
  id: string;
  paymentDate: string; // ISO date string
  paymentProof?: File;
  amount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

/**
 * API response matches ExpenseDTO with updated payment fields
 */
export interface PaymentResponse {
  id: string;
  status: 'PAID';
  paymentDate: string;
  paymentProofUrl?: string;
  // ... other ExpenseDTO fields
}
