import { describe, it, expect } from 'vitest';
import {
  recurringExpenseFormSchema,
  defaultRecurringExpenseFormValues,
  toCreateInput,
  toUpdateInput,
  type RecurringExpenseFormData,
} from '../recurring-expense-form-schema';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function buildValidFormData(
  overrides: Partial<RecurringExpenseFormData> = {}
): RecurringExpenseFormData {
  return {
    description: 'Aluguel do escritório',
    favorecidoId: VALID_UUID,
    categoryId: null,
    amountType: 'FIXED',
    amount: 1500,
    paymentMethod: null,
    municipality: 'São Paulo',
    dueDay: 10,
    startDate: new Date('2026-01-01'),
    endDate: null,
    ...overrides,
  };
}

describe('recurringExpenseFormSchema', () => {
  describe('dueDay', () => {
    it('rejects dueDay of 0', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ dueDay: 0 })
      );

      expect(result.success).toBe(false);
    });

    it('rejects dueDay of 32', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ dueDay: 32 })
      );

      expect(result.success).toBe(false);
    });

    it('accepts dueDay of 31', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ dueDay: 31 })
      );

      expect(result.success).toBe(true);
    });

    it('rejects a non-integer dueDay such as 15.5', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ dueDay: 15.5 })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'O dia de vencimento deve ser um número inteiro'
        );
      }
    });
  });

  describe('endDate', () => {
    it('rejects an endDate earlier than startDate with a Portuguese message', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-01-01'),
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        const endDateIssue = result.error.issues.find((issue) =>
          issue.path.includes('endDate')
        );
        expect(endDateIssue?.message).toBe(
          'A data-fim deve ser posterior à data de início'
        );
      }
    });

    it('accepts a null endDate', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ endDate: null })
      );

      expect(result.success).toBe(true);
    });

    it('accepts an endDate later than startDate', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('amount (deliberate divergence from backend)', () => {
    it('rejects an amount of 0 — the backend accepts nonnegative, the form does not', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ amount: 0 })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O valor deve ser maior que zero');
      }
    });

    it('accepts a positive amount', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ amount: 0.01 })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('municipality (deliberate divergence from backend)', () => {
    it('rejects a municipality with 101 characters', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ municipality: 'a'.repeat(101) })
      );

      expect(result.success).toBe(false);
    });

    it('rejects a municipality containing digits, via the letters regex', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ municipality: 'São Paulo 123' })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'O município deve conter apenas letras e espaços'
        );
      }
    });

    it('accepts a municipality with exactly 100 letters', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ municipality: 'a'.repeat(100) })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('required fields', () => {
    it('rejects a non-uuid favorecidoId', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ favorecidoId: 'not-a-uuid' })
      );

      expect(result.success).toBe(false);
    });

    it('rejects an empty description', () => {
      const result = recurringExpenseFormSchema.safeParse(
        buildValidFormData({ description: '' })
      );

      expect(result.success).toBe(false);
    });
  });
});

describe('defaultRecurringExpenseFormValues', () => {
  it('defaults amountType to FIXED', () => {
    expect(defaultRecurringExpenseFormValues.amountType).toBe('FIXED');
  });

  it('leaves amount, dueDay and startDate unset', () => {
    expect(defaultRecurringExpenseFormValues.amount).toBeUndefined();
    expect(defaultRecurringExpenseFormValues.dueDay).toBeUndefined();
    expect(defaultRecurringExpenseFormValues.startDate).toBeUndefined();
  });
});

describe('toCreateInput', () => {
  it('projects amountType and startDate', () => {
    const startDate = new Date('2026-01-01');
    const input = toCreateInput(buildValidFormData({ amountType: 'VARIABLE', startDate }));

    expect(input.amountType).toBe('VARIABLE');
    expect(input.startDate).toBe(startDate);
  });

  it('normalizes optional fields to null', () => {
    const input = toCreateInput(
      buildValidFormData({ categoryId: undefined, paymentMethod: undefined, endDate: undefined })
    );

    expect(input.categoryId).toBeNull();
    expect(input.paymentMethod).toBeNull();
    expect(input.endDate).toBeNull();
  });
});

describe('toUpdateInput', () => {
  it('does NOT project amountType nor startDate, even when present in the form data', () => {
    const input = toUpdateInput(
      buildValidFormData({ amountType: 'VARIABLE', startDate: new Date('2026-01-01') })
    );

    expect(input).not.toHaveProperty('amountType');
    expect(input).not.toHaveProperty('startDate');
  });

  it('projects the editable fields', () => {
    const input = toUpdateInput(
      buildValidFormData({ description: 'Novo nome', amount: 999, dueDay: 5 })
    );

    expect(input.description).toBe('Novo nome');
    expect(input.amount).toBe(999);
    expect(input.dueDay).toBe(5);
    expect(input.endDate).toBeNull();
  });
});
