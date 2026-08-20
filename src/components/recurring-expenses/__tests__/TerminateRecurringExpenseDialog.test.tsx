import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TerminateRecurringExpenseDialog } from '../TerminateRecurringExpenseDialog';
import type {
  RecurringExpenseDTO,
  TerminationPreview,
} from '@/types/recurring-expenses';

const previewState = vi.hoisted(() => ({
  preview: null as TerminationPreview | null,
  isLoading: false,
  calls: [] as (Date | null)[],
}));

const terminateState = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

vi.mock('@/hooks/useTerminationPreview', () => ({
  useTerminationPreview: vi.fn((params: { effectiveDate: Date | null }) => {
    previewState.calls.push(params.effectiveDate);
    return { preview: previewState.preview, isLoading: previewState.isLoading, error: null };
  }),
}));

vi.mock('@/hooks/useTerminateRecurringExpense', () => ({
  useTerminateRecurringExpense: () => ({
    mutateAsync: terminateState.mutateAsync,
    isPending: terminateState.isPending,
  }),
}));

vi.mock('react-datepicker', () => ({
  default: vi.fn(({ selected, onChange, disabled, id }: any) => (
    <input
      type="date"
      id={id}
      data-testid="effective-date"
      value={selected ? new Date(selected).toISOString().split('T')[0] : ''}
      onChange={(e) =>
        onChange(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)
      }
      disabled={disabled}
    />
  )),
  registerLocale: vi.fn(),
}));

const recurrence: RecurringExpenseDTO = {
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

const previewWith = (count: number): TerminationPreview => ({
  effectiveDate: new Date(2026, 1, 1),
  cancellableExpenses: Array.from({ length: count }, (_, i) => ({
    id: `exp-${i}`,
    description: `Ocorrência ${i + 1}`,
    amount: 1500 + i,
    dueDate: new Date(2026, 1 + i, 5),
    occurrenceMonth: new Date(2026, 1 + i, 1),
    status: 'OPEN' as TerminationPreview['cancellableExpenses'][number]['status'],
  })),
});

describe('TerminateRecurringExpenseDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewState.preview = null;
    previewState.isLoading = false;
    previewState.calls = [];
    terminateState.mutateAsync = vi.fn().mockResolvedValue({ recurrence, cancelledExpenseIds: [] });
    terminateState.isPending = false;
  });

  it('lists the cancellableExpenses with description, due date and amount (non-empty preview)', () => {
    previewState.preview = previewWith(2);
    render(<TerminateRecurringExpenseDialog isOpen onClose={vi.fn()} recurringExpense={recurrence} />);

    const items = screen.getAllByTestId('termination-preview-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Ocorrência 1');
    expect(items[0]).toHaveTextContent('05/02/2026');
    expect(items[0]).toHaveTextContent('R$');
    expect(items[1]).toHaveTextContent('Ocorrência 2');
  });

  it('states explicitly that nothing will be cancelled for an empty preview', () => {
    previewState.preview = previewWith(0);
    render(<TerminateRecurringExpenseDialog isOpen onClose={vi.fn()} recurringExpense={recurrence} />);

    expect(screen.getByTestId('termination-preview-empty')).toHaveTextContent(
      'Nenhuma despesa em aberto será cancelada.',
    );
    expect(screen.queryByTestId('termination-preview-item')).not.toBeInTheDocument();
  });

  it('shows a skeleton while the preview is loading', () => {
    previewState.isLoading = true;
    render(<TerminateRecurringExpenseDialog isOpen onClose={vi.fn()} recurringExpense={recurrence} />);

    expect(screen.getByTestId('termination-preview-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('termination-preview-item')).not.toBeInTheDocument();
  });

  it('refetches the preview when the effective date changes', async () => {
    const user = userEvent.setup();
    previewState.preview = previewWith(1);
    render(<TerminateRecurringExpenseDialog isOpen onClose={vi.fn()} recurringExpense={recurrence} />);

    const dateInput = screen.getByTestId('effective-date');
    await user.clear(dateInput);
    await user.type(dateInput, '2026-03-20');

    await waitFor(() => {
      const lastDate = previewState.calls[previewState.calls.length - 1];
      expect(lastDate).toBeInstanceOf(Date);
      expect(lastDate?.getFullYear()).toBe(2026);
      expect(lastDate?.getMonth()).toBe(2); // March
      expect(lastDate?.getDate()).toBe(20);
    });
  });

  it('names the number of expenses on the destructive confirm button, with "Voltar" as dismiss', () => {
    previewState.preview = previewWith(2);
    render(<TerminateRecurringExpenseDialog isOpen onClose={vi.fn()} recurringExpense={recurrence} />);

    const confirm = screen.getByRole('button', { name: 'Encerrar e cancelar 2 despesas' });
    expect(confirm).toBeInTheDocument();
    expect(confirm.className).toContain('bg-destructive');
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('uses the singular noun for a single cancellable expense', () => {
    previewState.preview = previewWith(1);
    render(<TerminateRecurringExpenseDialog isOpen onClose={vi.fn()} recurringExpense={recurrence} />);

    expect(
      screen.getByRole('button', { name: 'Encerrar e cancelar 1 despesa' }),
    ).toBeInTheDocument();
  });

  it('terminates with the effective date and reason, then closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    previewState.preview = previewWith(1);
    render(<TerminateRecurringExpenseDialog isOpen onClose={onClose} recurringExpense={recurrence} />);

    await user.type(screen.getByLabelText('Motivo (opcional)'), 'Contrato encerrado');
    await user.click(screen.getByRole('button', { name: 'Encerrar e cancelar 1 despesa' }));

    await waitFor(() => {
      expect(terminateState.mutateAsync).toHaveBeenCalledTimes(1);
    });
    const call = terminateState.mutateAsync.mock.calls[0][0];
    expect(call.id).toBe('rec-1');
    expect(call.input.effectiveDate).toBeInstanceOf(Date);
    expect(call.input.reason).toBe('Contrato encerrado');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
