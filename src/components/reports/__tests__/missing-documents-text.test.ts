import { describe, it, expect } from 'vitest';
import {
  formatMissingDocumentsBreakdown,
  formatMissingDocumentsHeadline,
} from '../missing-documents-text';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseWithMissingDocuments } from '@/types/reports';

function buildItem(
  overrides: Partial<ExpenseWithMissingDocuments> = {}
): ExpenseWithMissingDocuments {
  return {
    id: 'expense-1',
    description: 'Aluguel sala',
    favorecidoName: 'Imobiliária Silva',
    dueDate: '2026-09-21T12:00:00.000Z',
    amount: 1200,
    status: ExpenseStatus.OVERDUE,
    missingDocuments: ['serviceInvoice'],
    hasNoAttachments: false,
    ...overrides,
  };
}

describe('formatMissingDocumentsHeadline', () => {
  it('usa o singular para uma despesa e o plural para várias', () => {
    expect(formatMissingDocumentsHeadline(1)).toBe(
      '1 despesa com documento faltando'
    );
    expect(formatMissingDocumentsHeadline(15)).toBe(
      '15 despesas com documento faltando'
    );
  });
});

describe('formatMissingDocumentsBreakdown', () => {
  it('separa as sem nenhum comprovante das com documentação incompleta', () => {
    const items = [
      buildItem({ id: 'a', hasNoAttachments: true }),
      buildItem({ id: 'b' }),
      buildItem({ id: 'c' }),
    ];

    expect(formatMissingDocumentsBreakdown(items)).toBe(
      '1 sem nenhum comprovante · 2 com documentação incompleta'
    );
  });

  it('omite a parte zerada', () => {
    expect(formatMissingDocumentsBreakdown([buildItem()])).toBe(
      '1 com documentação incompleta'
    );
    expect(
      formatMissingDocumentsBreakdown([buildItem({ hasNoAttachments: true })])
    ).toBe('1 sem nenhum comprovante');
  });

  it('devolve vazio para uma lista vazia', () => {
    expect(formatMissingDocumentsBreakdown([])).toBe('');
  });
});
