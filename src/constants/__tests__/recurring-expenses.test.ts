import { describe, it, expect } from 'vitest';
import {
  RECURRENCE_AMOUNT_TYPE_LABELS,
  RECURRING_EXPENSE_STATUS_LABELS,
  NO_END_DATE_LABEL,
  formatDueDay,
  formatRecurrencePeriod,
} from '../recurring-expenses';

describe('recurring-expenses constants', () => {
  describe('RECURRENCE_AMOUNT_TYPE_LABELS', () => {
    it('labels FIXED and VARIABLE in Portuguese', () => {
      expect(RECURRENCE_AMOUNT_TYPE_LABELS.FIXED).toBe('Fixo');
      expect(RECURRENCE_AMOUNT_TYPE_LABELS.VARIABLE).toBe('Variável');
    });
  });

  describe('RECURRING_EXPENSE_STATUS_LABELS', () => {
    it('labels ACTIVE and ENDED in Portuguese', () => {
      expect(RECURRING_EXPENSE_STATUS_LABELS.ACTIVE).toBe('Ativa');
      expect(RECURRING_EXPENSE_STATUS_LABELS.ENDED).toBe('Encerrada');
    });
  });

  describe('formatDueDay', () => {
    it('renders "Todo dia N"', () => {
      expect(formatDueDay(15)).toBe('Todo dia 15');
      expect(formatDueDay(1)).toBe('Todo dia 1');
    });
  });

  describe('formatRecurrencePeriod', () => {
    it('renders start and end separated by an en dash', () => {
      const start = new Date('2026-01-10T00:00:00');
      const end = new Date('2026-12-20T00:00:00');

      expect(formatRecurrencePeriod(start, end)).toBe('10/01/2026 – 20/12/2026');
    });

    it('uses NO_END_DATE_LABEL when there is no end date', () => {
      const start = new Date('2026-01-10T00:00:00');

      expect(formatRecurrencePeriod(start, null)).toBe(`10/01/2026 – ${NO_END_DATE_LABEL}`);
    });
  });
});
