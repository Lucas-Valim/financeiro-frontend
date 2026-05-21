import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z
    .string({ error: 'O nome é obrigatório' })
    .trim()
    .min(1, { error: 'O nome é obrigatório' })
    .max(100, { error: 'O nome deve ter no máximo 100 caracteres' }),

  description: z
    .string()
    .max(1000, { error: 'A descrição deve ter no máximo 1000 caracteres' })
    .default(''),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export const defaultCategoryFormValues: CategoryFormData = {
  name: '',
  description: '',
};
