import { z } from 'zod';
import { ExpenseStatus } from '../constants/expenses';

/**
 * Validation schema for expense form
 * Used with React Hook Form via zodResolver
 * Provides real-time validation with Portuguese error messages
 */

// Brazilian municipality name validation (letters, spaces, hyphens, accents)
const municipalityRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;

// Service invoice validation (alphanumeric with hyphens and spaces)
const serviceInvoiceRegex = /^[a-zA-Z0-9\-/\s]+$/;

/**
 * Base expense form schema with validation rules
 */
export const expenseFormSchema = z.object({
  description: z
    .string({ error: 'A descrição é obrigatória' })
    .min(1, { error: 'A descrição é obrigatória' })
    .max(255, { error: 'A descrição deve ter no máximo 255 caracteres' }),

  amount: z
    .number({ error: 'O valor deve ser um número válido' })
    .positive({ error: 'O valor deve ser maior que zero' })
    .max(99999999.99, { error: 'O valor excede o limite máximo' }),

  currency: z
    .string({ error: 'A moeda é obrigatória' })
    .min(1, { error: 'A moeda é obrigatória' })
    .default('BRL'),

  dueDate: z
    .date({ error: 'A data de vencimento é obrigatória' }),

  status: z
    .nativeEnum(ExpenseStatus, {
      error: 'O status é obrigatório',
    })
    .default(ExpenseStatus.OPEN),

  categoryId: z
    .string()
    .nullable()
    .optional(),

  paymentMethod: z
    .string()
    .max(100, { error: 'A forma de pagamento deve ter no máximo 100 caracteres' })
    .nullable()
    .optional(),

  receiver: z
    .string({ error: 'O favorecido é obrigatório' })
    .min(1, { error: 'O favorecido é obrigatório' })
    .max(100, { error: 'O favorecido deve ter no máximo 100 caracteres' }),

  municipality: z
    .string({ error: 'O município é obrigatório' })
    .min(1, { error: 'O município é obrigatório' })
    .max(100, { error: 'O município deve ter no máximo 100 caracteres' })
    .refine(
      (value) => municipalityRegex.test(value),
      { error: 'O município deve conter apenas letras e espaços' }
    ),

  serviceInvoice: z
    .string()
    .max(50, { error: 'A nota de serviço deve ter no máximo 50 caracteres' })
    .refine(
      (value) => value === null || value === '' || serviceInvoiceRegex.test(value),
      { error: 'A nota de serviço deve conter apenas letras, números e hífens' }
    )
    .nullable()
    .optional(),
});

/**
 * Schema for creating a new expense
 * All required fields must be present
 */
export const createExpenseSchema = expenseFormSchema;

/**
 * Schema for updating an existing expense
 * All fields are optional for partial updates
 */
export const updateExpenseSchema = expenseFormSchema.partial();

/**
 * Inferred TypeScript types from the schemas
 */
export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

/**
 * Default values for the expense form
 */
export const defaultExpenseFormValues: Partial<ExpenseFormData> = {
  description: '',
  amount: undefined,
  currency: 'BRL',
  dueDate: undefined,
  status: ExpenseStatus.OPEN,
  categoryId: null,
  paymentMethod: null,
  receiver: '',
  municipality: '',
  serviceInvoice: null,
};

/**
 * Transform form data for API submission
 * Converts null values to undefined and formats dates
 */
export function transformExpenseFormData(data: ExpenseFormData): CreateExpenseInput {
  return {
    description: data.description,
    amount: data.amount,
    currency: data.currency,
    dueDate: data.dueDate,
    status: data.status,
    categoryId: data.categoryId || null,
    paymentMethod: data.paymentMethod || null,
    receiver: data.receiver,
    municipality: data.municipality,
    serviceInvoice: data.serviceInvoice || null,
  };
}
