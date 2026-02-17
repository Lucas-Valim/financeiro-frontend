/**
 * Currency formatter utility for formatting monetary values
 * Default currency is Brazilian Real (BRL) with pt-BR locale
 */

// Cache the formatter instance for performance
const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Default fallback value for invalid inputs
 */
const DEFAULT_FALLBACK = 'R$ 0,00';

/**
 * Formats a number as Brazilian Real (BRL) currency
 *
 * @param value - The numeric value to format
 * @param fallback - The fallback value to return for invalid inputs (default: 'R$ 0,00')
 * @returns Formatted currency string (e.g., 'R$ 1.234,56')
 *
 * @example
 * formatCurrency(1234.56) // Returns 'R$ 1.234,56'
 * formatCurrency(0) // Returns 'R$ 0,00'
 * formatCurrency(-100) // Returns '-R$ 100,00'
 * formatCurrency(null) // Returns 'R$ 0,00'
 * formatCurrency(undefined) // Returns 'R$ 0,00'
 * formatCurrency(NaN) // Returns 'R$ 0,00'
 */
export function formatCurrency(
  value: number | null | undefined,
  fallback: string = DEFAULT_FALLBACK
): string {
  // Handle null, undefined, and NaN
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  // Handle non-finite numbers (Infinity, -Infinity)
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return BRL_FORMATTER.format(value);
}

export default formatCurrency;
