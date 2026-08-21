import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExpensesApiService } from '@/api/expenses-api';
import { Despesa } from '@/components/pages/Despesa';
import { ExpenseStatus } from '@/constants/expenses';
import type {
  ExpenseDTO,
  ExpenseStatusSummary,
  ListExpensesOutput,
  ResyncCalendarOutput,
} from '@/types/expenses';

/**
 * Costura da Fase 2 da integração com o Google Agenda: a lista mostra a falha, o
 * menu oferece a saída, o reenvio dispara a requisição e o marcador desaparece
 * PELA REVALIDAÇÃO. Nenhuma das tasks 01 a 04 prova isso sozinha — cada uma cobre
 * a sua peça com mocks; o que resta é a costura entre marcador, menu, mutação e
 * invalidação.
 *
 * Diferente de `expenses-page.integration.test.tsx`, que mocka o HOOK
 * `useExpenses` com dado estático, aqui o mock é do SERVIÇO
 * (`ExpensesApiService.prototype`, como em `expense-file-upload.integration...`),
 * e ele GUARDA ESTADO. Só assim os hooks reais rodam e a invalidação de
 * `['expenses']` do `useResyncExpenseCalendar` dispara um refetch de verdade — a
 * ausência do marcador logo após o clique seria um falso positivo do próprio
 * mock; ela precisa vir da segunda listagem.
 */

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const EMPTY_SUMMARY_ITEM = {
  count: 0,
  total: 0,
  estimatedCount: 0,
  estimatedTotal: 0,
} as const;

const EMPTY_SUMMARY: ExpenseStatusSummary = {
  [ExpenseStatus.OPEN]: { ...EMPTY_SUMMARY_ITEM },
  [ExpenseStatus.OVERDUE]: { ...EMPTY_SUMMARY_ITEM },
  [ExpenseStatus.PAID]: { ...EMPTY_SUMMARY_ITEM },
  [ExpenseStatus.CANCELLED]: { ...EMPTY_SUMMARY_ITEM },
};

function createExpense(overrides: Partial<ExpenseDTO> = {}): ExpenseDTO {
  return {
    id: 'expense-failed-1',
    organizationId: 'fca3c088-ba34-43a2-9b32-b2b1a1246915',
    categoryId: null,
    favorecidoId: null,
    description: 'Aluguel do escritório',
    amount: 1500,
    currency: 'BRL',
    dueDate: new Date('2024-01-15'),
    status: ExpenseStatus.OPEN,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Imobiliária Central',
    municipality: 'Porto Alegre',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    recurringExpenseId: null,
    occurrenceMonth: null,
    amountPendingConfirmation: false,
    documentPending: false,
    calendarSyncStatus: null,
    calendarEventUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Estado mutável compartilhado pelos mocks do serviço. A primeira listagem
 * devolve a despesa em `FAILED`; o `resyncCalendar` muda o estado para `SYNCED`;
 * a listagem seguinte — a disparada pela invalidação — devolve a despesa já
 * sincronizada. É esse encadeamento que prova que a invalidação da task 03
 * realmente atualiza a tela.
 */
interface MockState {
  expense: ExpenseDTO;
}

function installServiceMock(state: MockState) {
  vi.spyOn(ExpensesApiService.prototype, 'fetchExpenses').mockImplementation(
    async (): Promise<ListExpensesOutput> => ({
      data: [{ ...state.expense }],
      pagination: { page: 1, limit: 10, total: 1 },
    })
  );

  vi.spyOn(ExpensesApiService.prototype, 'fetchExpensesSummary').mockResolvedValue(
    EMPTY_SUMMARY
  );

  const resyncSpy = vi
    .spyOn(ExpensesApiService.prototype, 'resyncCalendar')
    .mockImplementation(async (id: string): Promise<ResyncCalendarOutput> => {
      // O reenvio "conserta" a despesa: o backend releu o estado e ele passou a
      // SYNCED. A resposta é uma projeção reduzida (ADR-002) e NÃO é escrita no
      // cache — o que atualiza a tela é a próxima listagem.
      if (id === state.expense.id) {
        state.expense = { ...state.expense, calendarSyncStatus: 'SYNCED' };
      }
      return {
        calendarSyncStatus: 'SYNCED',
        calendarEventUrl: 'https://calendar.google.com/event/abc',
        calendarSyncedAt: '2026-08-21T10:00:00.000Z',
      };
    });

  return { resyncSpy };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(<Despesa />, { wrapper });
}

function getFirstRow(): HTMLElement {
  const row = screen.getByTestId('expenses-table').querySelector('tbody tr');
  expect(row).not.toBeNull();
  return row as HTMLElement;
}

describe('Calendar sync failure → resync → revalidation flow (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('shows the failure marker on a FAILED row when the list loads', async () => {
    installServiceMock({ expense: createExpense({ calendarSyncStatus: 'FAILED' }) });

    renderPage();

    await waitFor(() => {
      expect(
        within(getFirstRow()).getByTestId('expense-marker-calendar')
      ).toBeInTheDocument();
    });
  });

  it('offers "Reenviar para a agenda" in the menu of the FAILED row', async () => {
    const user = userEvent.setup();
    installServiceMock({ expense: createExpense({ calendarSyncStatus: 'FAILED' }) });

    renderPage();

    await waitFor(() => {
      expect(within(getFirstRow()).getByTestId('morevertical-icon')).toBeInTheDocument();
    });

    await user.click(within(getFirstRow()).getByTestId('morevertical-icon'));

    expect(await screen.findByText('Reenviar para a agenda')).toBeInTheDocument();
  });

  it('calls POST /expenses/:id/calendar-sync once, with the row expense id', async () => {
    const user = userEvent.setup();
    const state: MockState = {
      expense: createExpense({ calendarSyncStatus: 'FAILED' }),
    };
    const { resyncSpy } = installServiceMock(state);

    renderPage();

    await waitFor(() => {
      expect(within(getFirstRow()).getByTestId('morevertical-icon')).toBeInTheDocument();
    });

    await user.click(within(getFirstRow()).getByTestId('morevertical-icon'));
    await user.click(await screen.findByText('Reenviar para a agenda'));

    await waitFor(() => {
      expect(resyncSpy).toHaveBeenCalledTimes(1);
    });
    expect(resyncSpy).toHaveBeenCalledWith('expense-failed-1');
  });

  it('removes the marker from the row only AFTER the revalidation refetch', async () => {
    const user = userEvent.setup();
    const state: MockState = {
      expense: createExpense({ calendarSyncStatus: 'FAILED' }),
    };
    installServiceMock(state);

    renderPage();

    // Marcador presente ao carregar (despesa FAILED).
    await waitFor(() => {
      expect(
        within(getFirstRow()).getByTestId('expense-marker-calendar')
      ).toBeInTheDocument();
    });

    await user.click(within(getFirstRow()).getByTestId('morevertical-icon'));
    await user.click(await screen.findByText('Reenviar para a agenda'));

    // A ausência é asseverada com `waitFor` — ela só é verdade DEPOIS que a
    // invalidação de ['expenses'] refaz a listagem e devolve a despesa SYNCED.
    // Consultar por `screen` (e não pela referência antiga da linha) porque o
    // refetch pode substituir o nó do DOM.
    await waitFor(() => {
      expect(screen.queryByTestId('expense-marker-calendar')).not.toBeInTheDocument();
    });
  });
});
