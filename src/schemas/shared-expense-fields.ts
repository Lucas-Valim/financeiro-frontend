import { z } from 'zod';

/**
 * Campos de Zod compartilhados pelos formulários de despesa e de recorrência.
 *
 * São os campos que os dois capturam com exatamente a mesma semântica, a mesma
 * validação e as mesmas mensagens. O que NÃO entra aqui é o que diverge —
 * `dueDate` (data completa) contra `dueDay` (1–31), os anexos, que só a despesa
 * tem, e `amountType`/`startDate`/`endDate`, que só a recorrência tem.
 *
 * Schemas do Zod são imutáveis, então reusar a mesma instância nos dois objetos é
 * seguro, inclusive sob `.partial()`.
 */

/**
 * Só letras, espaços, hífen e apóstrofo. Vale para os dois formulários.
 *
 * Divergência deliberada em relação ao backend, que aceita 255 caracteres sem
 * restrição de conteúdo: o cliente é mais estrito de propósito, para que os dois
 * formulários se comportem igual. NÃO relaxar para aceitar dígitos.
 */
export const municipalityRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;

export const descriptionSchema = z
  .string({ error: 'A descrição é obrigatória' })
  .min(1, { error: 'A descrição é obrigatória' })
  .max(255, { error: 'A descrição deve ter no máximo 255 caracteres' });

/**
 * Positivo, não apenas não-negativo.
 *
 * Divergência deliberada em relação ao backend de recorrências, que aceita
 * `nonnegative()`: uma recorrência de referência valendo zero nasceria com a
 * primeira ocorrência valendo nada, o que não é um cadastro que faça sentido pedir.
 */
export const amountSchema = z
  .number({ error: 'O valor deve ser um número válido' })
  .positive({ error: 'O valor deve ser maior que zero' })
  .max(99999999.99, { error: 'O valor excede o limite máximo' });

export const categoryIdSchema = z.string().nullable().optional();

export const favorecidoIdSchema = z
  .string({ error: 'O favorecido é obrigatório' })
  .min(1, { error: 'O favorecido é obrigatório' })
  .uuid({ error: 'O favorecido deve ser um identificador válido' });

export const paymentMethodSchema = z
  .string()
  .max(100, { error: 'A forma de pagamento deve ter no máximo 100 caracteres' })
  .nullable()
  .optional();

export const municipalitySchema = z
  .string({ error: 'O município é obrigatório' })
  .min(1, { error: 'O município é obrigatório' })
  .max(100, { error: 'O município deve ter no máximo 100 caracteres' })
  .refine((value) => municipalityRegex.test(value), {
    error: 'O município deve conter apenas letras e espaços',
  });
