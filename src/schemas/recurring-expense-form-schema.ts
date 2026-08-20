import { z } from 'zod';
import type {
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from '../types/recurring-expenses';
import {
  descriptionSchema,
  amountSchema,
  categoryIdSchema,
  favorecidoIdSchema,
  paymentMethodSchema,
  municipalitySchema,
} from './shared-expense-fields';

/**
 * Schema do formulário de recorrência, espelhando a estrutura de
 * `expense-form-schema.ts` (Zod, mensagens em português, valores padrão).
 *
 * Os campos que a recorrência captura com a mesma semântica da despesa vêm de
 * `shared-expense-fields.ts` — inclusive as duas divergências deliberadas em
 * relação ao backend (`amount` positivo contra `nonnegative()`, e `municipality`
 * com 100 caracteres e regex de letras contra 255 livres), documentadas lá para
 * que ninguém as "corrija" achando que o schema está fora do contrato.
 */
export const recurringExpenseFormSchema = z
  .object({
    description: descriptionSchema,

    favorecidoId: favorecidoIdSchema,

    categoryId: categoryIdSchema,

    amountType: z
      .enum(['FIXED', 'VARIABLE'], { error: 'O tipo de valor é obrigatório' })
      .default('FIXED'),

    amount: amountSchema,

    paymentMethod: paymentMethodSchema,

    municipality: municipalitySchema,

    dueDay: z
      .number({ error: 'O dia de vencimento é obrigatório' })
      .int({ error: 'O dia de vencimento deve ser um número inteiro' })
      .min(1, { error: 'O dia de vencimento deve estar entre 1 e 31' })
      .max(31, { error: 'O dia de vencimento deve estar entre 1 e 31' }),

    startDate: z.date({ error: 'A data de início é obrigatória' }),

    endDate: z.date().nullable().optional(),
  })
  .refine((data) => !data.endDate || data.endDate > data.startDate, {
    error: 'A data-fim deve ser posterior à data de início',
    path: ['endDate'],
  });

export type RecurringExpenseFormData = z.infer<typeof recurringExpenseFormSchema>;

export const defaultRecurringExpenseFormValues: Partial<RecurringExpenseFormData> = {
  description: '',
  favorecidoId: '',
  categoryId: null,
  amountType: 'FIXED',
  amount: undefined,
  paymentMethod: null,
  municipality: '',
  dueDay: undefined,
  startDate: undefined,
  endDate: null,
};

/**
 * Projeta os dados do formulário no corpo de criação. Diferente de
 * `toUpdateInput`, inclui `amountType` e `startDate`: o `POST` os aceita, e a
 * partir daí eles são imutáveis.
 */
export function toCreateInput(
  data: RecurringExpenseFormData
): CreateRecurringExpenseInput {
  return {
    favorecidoId: data.favorecidoId,
    categoryId: data.categoryId ?? null,
    description: data.description,
    amountType: data.amountType,
    amount: data.amount,
    paymentMethod: data.paymentMethod ?? null,
    municipality: data.municipality,
    dueDay: data.dueDay,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
  };
}

/**
 * Projeta os dados do formulário no corpo de edição. `amountType` e `startDate`
 * são DELIBERADAMENTE omitidos: `PUT /recurring-expenses/:id` não os aceita e o
 * Zod do backend os descarta em silêncio — enviá-los daria um toast de sucesso
 * sem que nada mudasse (o usuário trocaria "variável" por "fixo" e nada mudaria).
 * NÃO adicioná-los aqui.
 */
export function toUpdateInput(
  data: RecurringExpenseFormData
): UpdateRecurringExpenseInput {
  return {
    favorecidoId: data.favorecidoId,
    categoryId: data.categoryId ?? null,
    description: data.description,
    amount: data.amount,
    paymentMethod: data.paymentMethod ?? null,
    municipality: data.municipality,
    dueDay: data.dueDay,
    endDate: data.endDate ?? null,
  };
}
