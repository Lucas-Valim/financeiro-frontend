import { z } from 'zod';
import { ExpenseStatus } from '../constants/expenses';

export const EXPENSE_FILE_ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

export const EXPENSE_FILE_MAX_SIZE = 5 * 1024 * 1024;

export const EXPENSE_FILE_ALLOWED_TYPES_DISPLAY = 'PDF, PNG, JPG, JPEG';
const MAX_SIZE_MB = EXPENSE_FILE_MAX_SIZE / (1024 * 1024);

const municipalityRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;

const expenseFileSchema = z.custom<File | null | undefined>(
  (value) => value == null || value instanceof File
)
  .refine(
    (file) => file == null || file.size <= EXPENSE_FILE_MAX_SIZE,
    { message: `O arquivo deve ter no máximo ${MAX_SIZE_MB}MB` }
  )
  .refine(
    (file) => file == null || EXPENSE_FILE_ALLOWED_TYPES.includes(file.type as typeof EXPENSE_FILE_ALLOWED_TYPES[number]),
    { message: `Apenas arquivos ${EXPENSE_FILE_ALLOWED_TYPES_DISPLAY} são permitidos` }
  )
  .optional()
  .nullable();

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

  serviceInvoice: expenseFileSchema,
  
  bankBill: expenseFileSchema,
});

export const createExpenseSchema = expenseFormSchema;
export const updateExpenseSchema = expenseFormSchema.partial();

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

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
  bankBill: null,
};

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
    bankBill: data.bankBill || null,
  };
}
