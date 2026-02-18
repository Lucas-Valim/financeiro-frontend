import { z } from 'zod';

/**
 * Validation schema for payment form data
 * Used with React Hook Form via zodResolver
 * Provides real-time validation with Portuguese error messages
 */

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
 * Base payment form schema with validation rules
 */
export const paymentFormSchema = z.object({
  expenseId: z
    .string({ error: 'O ID da despesa é obrigatório' })
    .min(1, { error: 'O ID da despesa é obrigatório' }),

  paymentDate: z
    .date({ error: 'A data do pagamento é obrigatória' }),

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
    paymentProof: data.paymentProof || undefined,
  };
}

/**
 * Payment request payload for API
 * Matches the backend API contract
 */
export interface PaymentRequest {
  id: string;
  paymentDate: Date; // ISO date string
  paymentProof?: File;
}

/**
 * API response matches ExpenseDTO with updated payment fields
 */
export interface PaymentResponse {
  id: string;
  status: 'PAID';
  paymentDate: Date;
  paymentProofUrl?: string;
  // ... other ExpenseDTO fields
}
