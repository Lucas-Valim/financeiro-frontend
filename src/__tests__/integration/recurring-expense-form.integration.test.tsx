import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecurringExpenseFormModal } from '@/components/recurring-expenses/RecurringExpenseFormModal';
import { ExpenseStatus } from '@/constants/expenses';
import type {
  CreateRecurringExpenseOutput,
  DuplicateCheckOutput,
  RecurringExpenseDTO,
} from '@/types/recurring-expenses';

const FAVORECIDO_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const apiMock = vi.hoisted(() => ({
  checkDuplicates: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/api/recurring-expenses-api', () => ({
  recurringExpensesApiService: {
    checkDuplicates: apiMock.checkDuplicates,
    create: apiMock.create,
    update: apiMock.update,
  },
}));

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastMock.success, error: toastMock.error } }));

vi.mock('@/hooks/use-categories', () => ({
  useCategories: vi.fn(() => ({ categories: [], isLoading: false, error: null })),
}));

vi.mock('@/hooks/use-favorecidos', () => ({
  useFavorecidos: vi.fn(() => ({
    favorecidos: [{ id: FAVORECIDO_ID, name: 'Favorecido Um', document: null }],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/components/favorecidos/FavorecidoFormModal', () => ({
  FavorecidoFormModal: () => null,
}));

vi.mock('react-datepicker', () => ({
  default: vi.fn(({ selected, onChange, placeholderText, disabled }: any) => (
    <input
      type="date"
      value={selected ? new Date(selected).toISOString().split('T')[0] : ''}
      onChange={(e) =>
        onChange(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)
      }
      placeholder={placeholderText}
      disabled={disabled}
      data-testid="date-picker"
    />
  )),
  registerLocale: vi.fn(),
}));

function renderModal() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RecurringExpenseFormModal isOpen onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

async function fillValidCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/descrição/i), 'Aluguel do escritório');
  await user.type(screen.getByLabelText(/valor da despesa/i), '150000'); // R$ 1.500,00
  await user.type(screen.getByLabelText(/dia do vencimento/i), '5');

  // Favorecido (Combobox)
  await user.click(screen.getByRole('combobox', { name: /favorecido/i }));
  await user.click(await screen.findByText('Favorecido Um'));

  // Município (Radix Select)
  await user.click(screen.getByRole('combobox', { name: /município/i }));
  await user.click(await screen.findByRole('option', { name: 'Porto Alegre' }));

  // Data de início (startDate é o primeiro datepicker)
  const startDate = screen.getAllByTestId('date-picker')[0];
  fireEvent.change(startDate, { target: { value: '2026-06-15' } });
}

describe('RecurringExpenseFormModal — integration (create cycle)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs submit → duplicate warning → confirm → shows the generated occurrences', async () => {
    const user = userEvent.setup();

    apiMock.checkDuplicates.mockResolvedValue({
      duplicates: [
        {
          id: 'rec-existing',
          organizationId: 'org-1',
          description: 'Aluguel antigo',
          favorecidoId: FAVORECIDO_ID,
          categoryId: null,
          amountType: 'FIXED',
          amount: 1500,
          paymentMethod: null,
          municipality: 'Porto Alegre',
          dueDay: 5,
          startDate: new Date(2025, 0, 1),
          endDate: null,
          status: 'ACTIVE',
          terminationReason: null,
          terminatedAt: null,
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
        },
      ],
    } satisfies DuplicateCheckOutput);

    apiMock.create.mockResolvedValue({
      recurrence: {
        id: 'rec-new',
        organizationId: 'org-1',
        description: 'Aluguel do escritório',
        favorecidoId: FAVORECIDO_ID,
        categoryId: null,
        amountType: 'FIXED',
        amount: 1500,
        paymentMethod: null,
        municipality: 'Porto Alegre',
        dueDay: 5,
        startDate: new Date(2026, 5, 15),
        endDate: null,
        status: 'ACTIVE',
        terminationReason: null,
        terminatedAt: null,
        createdAt: new Date(2026, 5, 15),
        updatedAt: new Date(2026, 5, 15),
      },
      generatedOccurrences: [
        {
          id: 'occ-1',
          recurringExpenseId: 'rec-new',
          description: 'Aluguel do escritório',
          amount: 1500,
          dueDate: new Date(2026, 6, 5),
          occurrenceMonth: new Date(2026, 6, 1),
          status: ExpenseStatus.OPEN,
          amountPendingConfirmation: false,
        },
      ],
    } satisfies CreateRecurringExpenseOutput);

    renderModal();
    await fillValidCreateForm(user);

    await user.click(screen.getByRole('button', { name: 'Criar Recorrência' }));

    // Duplicate warning appears (non-blocking) — POST not fired yet.
    await waitFor(() => {
      expect(screen.getByText('Recorrências parecidas encontradas')).toBeInTheDocument();
    });
    expect(apiMock.create).not.toHaveBeenCalled();

    // Confirm proceeds with the original submit.
    await user.click(screen.getByRole('button', { name: 'Criar mesmo assim' }));

    await waitFor(() => {
      expect(apiMock.create).toHaveBeenCalledTimes(1);
    });
    const createInput = apiMock.create.mock.calls[0][0];
    expect(createInput.favorecidoId).toBe(FAVORECIDO_ID);
    expect(createInput.amount).toBe(1500);
    expect(createInput.dueDay).toBe(5);
    expect(createInput.amountType).toBe('FIXED');
    expect(createInput.startDate).toBeInstanceOf(Date);

    // Generated occurrences are shown before closing.
    await waitFor(() => {
      expect(screen.getByText('Recorrência criada')).toBeInTheDocument();
    });
    const item = screen.getByTestId('generated-occurrence-item');
    expect(item).toHaveTextContent('Aluguel do escritório');
    expect(item).toHaveTextContent('05/07/2026');
    expect(item).toHaveTextContent('R$');
  });

  it('blocks submit and skips the API for an invalid due day (32)', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/descrição/i), 'Aluguel');
    await user.type(screen.getByLabelText(/valor da despesa/i), '150000');
    await user.type(screen.getByLabelText(/dia do vencimento/i), '32');
    await user.click(screen.getByRole('combobox', { name: /favorecido/i }));
    await user.click(await screen.findByText('Favorecido Um'));
    await user.click(screen.getByRole('combobox', { name: /município/i }));
    await user.click(await screen.findByRole('option', { name: 'Porto Alegre' }));
    fireEvent.change(screen.getAllByTestId('date-picker')[0], {
      target: { value: '2026-06-15' },
    });

    await user.click(screen.getByRole('button', { name: 'Criar Recorrência' }));

    await waitFor(() => {
      expect(
        screen.getByText('O dia de vencimento deve estar entre 1 e 31'),
      ).toBeInTheDocument();
    });
    expect(apiMock.checkDuplicates).not.toHaveBeenCalled();
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('surfaces a backend 400 due-day error with the Portuguese message from the backend', async () => {
    const user = userEvent.setup();
    apiMock.checkDuplicates.mockResolvedValue({ duplicates: [] });
    apiMock.create.mockRejectedValue(
      new Error('Dia de vencimento deve estar entre 1 e 31'),
    );

    renderModal();
    await fillValidCreateForm(user);

    await user.click(screen.getByRole('button', { name: 'Criar Recorrência' }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        'Dia de vencimento deve estar entre 1 e 31',
      );
    });
    expect(screen.queryByText('Recorrência criada')).not.toBeInTheDocument();
  });

  it('edits without a duplicate-check and omits amountType/startDate from the payload', async () => {
    const user = userEvent.setup();
    const existing: RecurringExpenseDTO = {
      id: 'rec-1',
      organizationId: 'org-1',
      description: 'Aluguel',
      favorecidoId: FAVORECIDO_ID,
      categoryId: null,
      amountType: 'VARIABLE',
      amount: 1500,
      paymentMethod: null,
      municipality: 'Porto Alegre',
      dueDay: 5,
      startDate: new Date(2026, 5, 15),
      endDate: null,
      status: 'ACTIVE',
      terminationReason: null,
      terminatedAt: null,
      createdAt: new Date(2026, 5, 15),
      updatedAt: new Date(2026, 5, 15),
    };
    apiMock.update.mockResolvedValue({ ...existing, description: 'Aluguel novo' });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <RecurringExpenseFormModal isOpen onClose={vi.fn()} recurringExpense={existing} />
      </QueryClientProvider>,
    );

    // amountType and startDate are read-only in edit mode.
    expect(screen.getByTestId('amount-type-readonly')).toHaveTextContent('Variável');
    expect(screen.getByTestId('start-date-readonly')).toHaveTextContent('15/06/2026');

    const description = screen.getByLabelText(/descrição/i);
    await user.clear(description);
    await user.type(description, 'Aluguel novo');
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(apiMock.update).toHaveBeenCalledTimes(1);
    });
    // Edit never runs the duplicate check.
    expect(apiMock.checkDuplicates).not.toHaveBeenCalled();

    const [, updateInput] = apiMock.update.mock.calls[0];
    expect(updateInput).not.toHaveProperty('amountType');
    expect(updateInput).not.toHaveProperty('startDate');
    expect(updateInput.description).toBe('Aluguel novo');
    expect(updateInput.dueDay).toBe(5);
  });
});
