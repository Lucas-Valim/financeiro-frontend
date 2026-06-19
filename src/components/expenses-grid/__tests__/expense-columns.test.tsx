import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  EXPENSE_COLUMNS,
  ExpenseStatusBadge,
  formatAmount,
  formatDate,
} from '../expense-columns';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

const baseExpense: ExpenseDTO = {
  id: 'expense-1',
  organizationId: 'org-1',
  categoryId: null,
  favorecidoId: null,
  description: 'Test Expense',
  amount: 1234.56,
  currency: 'BRL',
  dueDate: new Date('2024-01-15'),
  status: ExpenseStatus.OPEN,
  paymentMethod: null,
  paymentProof: null,
  paymentProofUrl: null,
  paymentDate: null,
  receiver: 'Test Receiver',
  municipality: 'Test City',
  serviceInvoice: null,
  serviceInvoiceUrl: null,
  bankBillUrl: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

function column(id: string) {
  const found = EXPENSE_COLUMNS.find((col) => col.id === id);
  if (!found) throw new Error(`column ${id} not found`);
  return found;
}

describe('formatAmount', () => {
  it('formats values as BRL currency', () => {
    expect(formatAmount(1234.56)).toMatch(/R\$\s*1\.234,56/);
  });

  it('formats zero', () => {
    expect(formatAmount(0)).toMatch(/R\$\s*0,00/);
  });

  it('formats large values', () => {
    expect(formatAmount(9999999.99)).toMatch(/R\$\s*9\.999\.999,99/);
  });

  it('falls back to zero for null/undefined', () => {
    expect(formatAmount(null as unknown as number)).toMatch(/R\$\s*0,00/);
    expect(formatAmount(undefined as unknown as number)).toMatch(/R\$\s*0,00/);
  });
});

describe('formatDate', () => {
  it('formats dates as dd/MM/yyyy', () => {
    expect(formatDate(new Date('2024-01-15'))).toMatch(/14\/01\/2024|15\/01\/2024/);
  });

  it('returns N/A for missing dates', () => {
    expect(formatDate(null as unknown as Date)).toBe('N/A');
  });

  it('returns N/A for invalid dates', () => {
    expect(formatDate(new Date('invalid'))).toBe('N/A');
  });
});

describe('EXPENSE_COLUMNS cells', () => {
  it('renders N/A when description is missing', () => {
    expect(column('description').cell({ ...baseExpense, description: null as unknown as string })).toBe('N/A');
  });

  it('renders N/A when receiver is missing', () => {
    expect(column('receiver').cell({ ...baseExpense, receiver: null as unknown as string })).toBe('N/A');
  });

  it('renders the formatted amount', () => {
    expect(column('amount').cell(baseExpense)).toMatch(/R\$\s*1\.234,56/);
  });
});

describe('ExpenseStatusBadge', () => {
  it.each([
    [ExpenseStatus.OPEN, 'bg-blue-100', 'text-blue-800'],
    [ExpenseStatus.OVERDUE, 'bg-red-100', 'text-red-800'],
    [ExpenseStatus.PAID, 'bg-green-100', 'text-green-800'],
    [ExpenseStatus.CANCELLED, 'bg-gray-100', 'text-gray-800'],
  ])('renders %s with the correct colors', (status, bgClass, textClass) => {
    render(<ExpenseStatusBadge status={status} />);
    const badge = screen.getByText(status);
    expect(badge.className).toContain(bgClass);
    expect(badge.className).toContain(textClass);
  });
});
