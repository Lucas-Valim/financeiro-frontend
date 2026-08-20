import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DuplicateWarningDialog } from '../DuplicateWarningDialog';
import type { RecurringExpenseDTO } from '@/types/recurring-expenses';

const baseRecurrence: RecurringExpenseDTO = {
  id: 'rec-1',
  organizationId: 'org-1',
  description: 'Aluguel do escritório',
  favorecidoId: 'fav-1',
  categoryId: null,
  amountType: 'FIXED',
  amount: 1500,
  paymentMethod: null,
  municipality: 'Porto Alegre',
  dueDay: 5,
  startDate: new Date(2026, 0, 1),
  endDate: null,
  status: 'ACTIVE',
  terminationReason: null,
  terminatedAt: null,
  createdAt: new Date(2026, 0, 1),
  updatedAt: new Date(2026, 0, 1),
};

const duplicates: RecurringExpenseDTO[] = [
  baseRecurrence,
  { ...baseRecurrence, id: 'rec-2', description: 'Internet', amount: 200, dueDay: 10 },
];

describe('DuplicateWarningDialog', () => {
  it('does not render when closed', () => {
    render(
      <DuplicateWarningDialog
        isOpen={false}
        duplicates={duplicates}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText('Recorrências parecidas encontradas')).not.toBeInTheDocument();
  });

  it('lists the similar recurrences with their description and reference data', () => {
    render(
      <DuplicateWarningDialog
        isOpen
        duplicates={duplicates}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const items = screen.getAllByTestId('duplicate-item');
    expect(items).toHaveLength(2);
    expect(screen.getByText('Aluguel do escritório')).toBeInTheDocument();
    expect(screen.getByText('Internet')).toBeInTheDocument();
    expect(screen.getByText(/Todo dia 5/)).toBeInTheDocument();
  });

  it('proceeds with the original submit when confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DuplicateWarningDialog
        isOpen
        duplicates={duplicates}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Criar mesmo assim' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when dismissed via Escape (never blocks)', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <DuplicateWarningDialog
        isOpen
        duplicates={duplicates}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('keeps the form open (calls onCancel) when "Voltar" is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <DuplicateWarningDialog
        isOpen
        duplicates={duplicates}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
