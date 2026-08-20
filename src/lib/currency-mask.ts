import { formatCurrency } from './formatCurrency';

/**
 * Formata um valor numérico para exibição dentro de um campo de formulário.
 *
 * Diferente de `formatCurrency`, um valor ausente vira **string vazia** em vez
 * de `R$ 0,00`: num input controlado o campo vazio precisa aparecer vazio, ou o
 * usuário encontra um zero que não digitou e não sabe se é valor ou placeholder.
 */
export function formatCurrencyInput(value: number | null | undefined): string {
  return formatCurrency(value, '');
}

/**
 * Converte o texto mascarado de volta para número: `R$ 1.234,56` → `1234.56`.
 *
 * Devolve `undefined` para entrada vazia ou impossível de interpretar, que é o
 * que o campo de valor guarda quando o usuário apaga tudo.
 */
export function parseCurrencyToNumber(value: string): number | undefined {
  if (!value) return undefined;
  const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Aplica a máscara de moeda enquanto o usuário digita: só dígitos entram, e os
 * dois últimos passam a ser os centavos. Digitar `123` produz `R$ 1,23`.
 */
export function applyCurrencyMask(value: string): string {
  const numbers = value.replace(/[^\d]/g, '');
  if (!numbers) return '';
  const intValue = parseInt(numbers, 10);
  const floatValue = intValue / 100;
  return formatCurrencyInput(floatValue);
}
