import { z } from 'zod';
import { ExpenseStatus } from '../constants/expenses';
import {
  descriptionSchema,
  amountSchema,
  categoryIdSchema,
  favorecidoIdSchema,
  paymentMethodSchema,
  municipalitySchema,
} from './shared-expense-fields';

export const EXPENSE_FILE_ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

export const EXPENSE_FILE_MAX_SIZE = 5 * 1024 * 1024;

export const EXPENSE_FILE_ALLOWED_TYPES_DISPLAY = 'PDF, PNG, JPG, JPEG';
const MAX_SIZE_MB = EXPENSE_FILE_MAX_SIZE / (1024 * 1024);

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
  description: descriptionSchema,

  amount: amountSchema,

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

  categoryId: categoryIdSchema,

  favorecidoId: favorecidoIdSchema,

  paymentMethod: paymentMethodSchema,

  municipality: municipalitySchema,

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
  favorecidoId: '',
  paymentMethod: null,
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
    favorecidoId: data.favorecidoId,
    paymentMethod: data.paymentMethod || null,
    municipality: data.municipality,
    serviceInvoice: data.serviceInvoice || null,
    bankBill: data.bankBill || null,
  };
}
