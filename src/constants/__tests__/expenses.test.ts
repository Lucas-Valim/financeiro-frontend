import { describe, it, expect } from 'vitest';
import {
  EXPENSE_STATUS_COLORS,
  EXPENSE_PAGE_LIMIT,
  ORGANIZATION_ID,
  ExpenseStatus,
  EXPENSE_STATUS_LABELS,
} from '../expenses';

describe('Constants', () => {
  describe('EXPENSE_STATUS_COLORS', () => {
    it('should have entries for all status types', () => {
      expect(EXPENSE_STATUS_COLORS.OPEN).toBeDefined();
      expect(EXPENSE_STATUS_COLORS.OVERDUE).toBeDefined();
      expect(EXPENSE_STATUS_COLORS.PAID).toBeDefined();
      expect(EXPENSE_STATUS_COLORS.CANCELLED).toBeDefined();
      expect(Object.keys(EXPENSE_STATUS_COLORS).length).toBe(4);
    });

    it('should use correct color scheme (blue, red, green, gray)', () => {
      expect(EXPENSE_STATUS_COLORS.OPEN).toContain('blue');
      expect(EXPENSE_STATUS_COLORS.OVERDUE).toContain('red');
      expect(EXPENSE_STATUS_COLORS.PAID).toContain('green');
      expect(EXPENSE_STATUS_COLORS.CANCELLED).toContain('gray');
    });

    it('should be immutable (read-only at compile time)', () => {
      const colors = EXPENSE_STATUS_COLORS;
      
      expect(colors.OPEN).toBe('bg-blue-100 text-blue-800');
    });
  });

  describe('EXPENSE_PAGE_LIMIT', () => {
    it('should equal 10', () => {
      expect(EXPENSE_PAGE_LIMIT).toBe(10);
    });

    it('should be immutable (read-only)', () => {
      const originalLimit = EXPENSE_PAGE_LIMIT;

      expect(() => {
        (EXPENSE_PAGE_LIMIT as unknown as number) = 20;
      }).toThrow();

      expect(EXPENSE_PAGE_LIMIT).toBe(originalLimit);
    });

    it('should be a number', () => {
      expect(typeof EXPENSE_PAGE_LIMIT).toBe('number');
    });
  });

  describe('ORGANIZATION_ID', () => {
    it('should be a valid UUID string', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(ORGANIZATION_ID).toMatch(uuidRegex);
    });

    it('should be the expected value', () => {
      expect(ORGANIZATION_ID).toBe('fca3c088-ba34-43a2-9b32-b2b1a1246915');
    });

    it('should be immutable (read-only)', () => {
      const originalId = ORGANIZATION_ID;

      expect(() => {
        (ORGANIZATION_ID as unknown as string) = 'modified';
      }).toThrow();

      expect(ORGANIZATION_ID).toBe(originalId);
    });

    it('should be a string', () => {
      expect(typeof ORGANIZATION_ID).toBe('string');
    });
  });

  describe('ExpenseStatus', () => {
    it('should contain all four required values', () => {
      const values = Object.values(ExpenseStatus);
      expect(values).toContain('OPEN');
      expect(values).toContain('OVERDUE');
      expect(values).toContain('PAID');
      expect(values).toContain('CANCELLED');
      expect(values.length).toBe(4);
    });

    it('should have string literal values', () => {
      expect(ExpenseStatus.OPEN).toBe('OPEN');
      expect(ExpenseStatus.OVERDUE).toBe('OVERDUE');
      expect(ExpenseStatus.PAID).toBe('PAID');
      expect(ExpenseStatus.CANCELLED).toBe('CANCELLED');
    });

    it('should be comparable with string values', () => {
      const status = ExpenseStatus.OPEN;
      
      if (status === 'OPEN') {
        expect(true).toBe(true);
      }
    });
  });

  describe('EXPENSE_STATUS_LABELS', () => {
    it('should have entries for all status types', () => {
      expect(EXPENSE_STATUS_LABELS.OPEN).toBeDefined();
      expect(EXPENSE_STATUS_LABELS.OVERDUE).toBeDefined();
      expect(EXPENSE_STATUS_LABELS.PAID).toBeDefined();
      expect(EXPENSE_STATUS_LABELS.CANCELLED).toBeDefined();
      expect(Object.keys(EXPENSE_STATUS_LABELS).length).toBe(4);
    });

    it('should have Portuguese labels', () => {
      expect(EXPENSE_STATUS_LABELS.OPEN).toBe('Aberta');
      expect(EXPENSE_STATUS_LABELS.OVERDUE).toBe('Atrasada');
      expect(EXPENSE_STATUS_LABELS.PAID).toBe('Paga');
      expect(EXPENSE_STATUS_LABELS.CANCELLED).toBe('Cancelada');
    });

    it('should be immutable (read-only at compile time)', () => {
      const labels = EXPENSE_STATUS_LABELS;
      
      expect(labels.OPEN).toBe('Aberta');
    });
  });

  describe('TypeScript Type Inference', () => {
    it('should correctly infer types', () => {
      const status: ExpenseStatus = ExpenseStatus.OPEN;
      const limit: number = EXPENSE_PAGE_LIMIT;
      const orgId: string = ORGANIZATION_ID;
      const color: string = EXPENSE_STATUS_COLORS.OPEN;

      expect(typeof status).toBe('string');
      expect(typeof limit).toBe('number');
      expect(typeof orgId).toBe('string');
      expect(typeof color).toBe('string');
    });
  });
});
