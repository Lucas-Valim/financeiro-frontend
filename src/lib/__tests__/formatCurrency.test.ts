import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../formatCurrency';

// Non-breaking space (NBSP) is used by Intl.NumberFormat between currency symbol and value
const NBSP = '\u00A0';

describe('formatCurrency', () => {
  describe('normal values', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe(`R$${NBSP}1.234,56`);
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe(`R$${NBSP}0,00`);
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-100)).toBe(`-R$${NBSP}100,00`);
    });

    it('should format large numbers correctly', () => {
      expect(formatCurrency(1000000)).toBe(`R$${NBSP}1.000.000,00`);
    });

    it('should format small decimal values correctly', () => {
      expect(formatCurrency(0.01)).toBe(`R$${NBSP}0,01`);
    });

    it('should format integer values with decimal places', () => {
      expect(formatCurrency(100)).toBe(`R$${NBSP}100,00`);
    });

    it('should round decimal values to 2 decimal places', () => {
      expect(formatCurrency(123.456)).toBe(`R$${NBSP}123,46`);
    });
  });

  describe('edge cases', () => {
    it('should return fallback for null', () => {
      expect(formatCurrency(null)).toBe('R$ 0,00');
    });

    it('should return fallback for undefined', () => {
      expect(formatCurrency(undefined)).toBe('R$ 0,00');
    });

    it('should return fallback for NaN', () => {
      expect(formatCurrency(NaN)).toBe('R$ 0,00');
    });

    it('should return fallback for Infinity', () => {
      expect(formatCurrency(Infinity)).toBe('R$ 0,00');
    });

    it('should return fallback for negative Infinity', () => {
      expect(formatCurrency(-Infinity)).toBe('R$ 0,00');
    });
  });

  describe('custom fallback', () => {
    it('should use custom fallback for null', () => {
      expect(formatCurrency(null, 'N/A')).toBe('N/A');
    });

    it('should use custom fallback for undefined', () => {
      expect(formatCurrency(undefined, '--')).toBe('--');
    });

    it('should use custom fallback for NaN', () => {
      expect(formatCurrency(NaN, 'Inválido')).toBe('Inválido');
    });

    it('should return formatted value for valid numbers even with custom fallback', () => {
      expect(formatCurrency(100, 'N/A')).toBe(`R$${NBSP}100,00`);
    });
  });

  describe('BRL formatting specifics', () => {
    it('should use Brazilian Real currency symbol (R$)', () => {
      const result = formatCurrency(100);
      expect(result).toContain('R$');
    });

    it('should use comma as decimal separator', () => {
      const result = formatCurrency(1.5);
      expect(result).toContain('1,50');
    });

    it('should use period as thousands separator', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('1.000');
    });

    it('should use non-breaking space between symbol and value', () => {
      const result = formatCurrency(100);
      expect(result).toBe(`R$${NBSP}100,00`);
    });
  });
});
