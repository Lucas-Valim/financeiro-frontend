import { z } from 'zod';

export const favorecidoFormSchema = z.object({
  name: z
    .string({ error: 'O nome é obrigatório' })
    .trim()
    .min(1, { error: 'O nome é obrigatório' })
    .max(100, { error: 'O nome deve ter no máximo 100 caracteres' }),

  document: z
    .string({ error: 'O documento é obrigatório' })
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(
      z.string()
        .min(1, { error: 'O documento é obrigatório' })
        .refine((val) => val.length === 11 || val.length === 14, {
          error: 'Documento deve conter 11 (CPF) ou 14 (CNPJ) dígitos',
        })
    ),

  zipCode: z
    .string()
    .default(''),

  street: z
    .string()
    .default(''),

  number: z
    .string()
    .default(''),

  city: z
    .string()
    .default(''),

  state: z
    .string()
    .max(2, { error: 'O estado deve ter 2 caracteres' })
    .default(''),

  phone: z
    .string()
    .default(''),

  email: z
    .string()
    .default(''),
});

export type FavorecidoFormData = z.infer<typeof favorecidoFormSchema>;

export const defaultFavorecidoFormValues: FavorecidoFormData = {
  name: '',
  document: '',
  zipCode: '',
  street: '',
  number: '',
  city: '',
  state: '',
  phone: '',
  email: '',
};
