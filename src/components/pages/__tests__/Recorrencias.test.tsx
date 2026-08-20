import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Recorrencias } from '../Recorrencias';
import type { RecurringExpenseDTO } from '@/types/recurring-expenses';

const mockUseRecurringExpenses = vi.fn();

vi.mock('@/hooks/use-recurring-expenses', () => ({
  useRecurringExpenses: () => mockUseRecurringExpenses(),
}));

// As colunas resolvem o nome do favorecido via este hook; sem o mock bateriam na API.
vi.mock('@/hooks/use-favorecidos', () => ({
  useFavorecidos: () => ({
    favorecidos: [{ id: 'fav-1', name: 'Favorecido Um' }],
    isLoading: false,
    error: null,
  }),
}));

// O formulário e o diálogo de encerramento usam react-query e as fontes de dados
// do formulário mesmo fechados. Este é o teste da página — que controla o modal de
// criação e delega edição/encerramento a `RecurringExpenseActions`. Substituímos os
// dois por stubs que revelam apenas o modo e a recorrência recebidos.
vi.mock('@/components/recurring-expenses/RecurringExpenseFormModal', () => ({
  RecurringExpenseFormModal: ({
    isOpen,
    onClose,
    recurringExpense,
    readOnly,
  }: {
    isOpen: boolean;
    onClose: () => void;
    recurringExpense?: RecurringExpenseDTO;
    readOnly?: boolean;
  }) => {
    if (!isOpen) return null;
    const mode = readOnly ? 'readonly' : recurringExpense ? 'edit' : 'create';
    return (
      <div data-testid="recurring-form-modal" role="dialog">
        <span data-testid="form-modal-mode">{mode}</span>
        <span data-testid="form-modal-description">
          {recurringExpense?.description ?? ''}
        </span>
        <button onClick={onClose} data-testid="close-form-modal">
          Fechar
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/recurring-expenses/TerminateRecurringExpenseDialog', () => ({
  TerminateRecurringExpenseDialog: ({
    isOpen,
    recurringExpense,
  }: {
    isOpen: boolean;
    recurringExpense: RecurringExpenseDTO;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="terminate-dialog" role="dialog">
        <span data-testid="terminate-dialog-description">
          {recurringExpense?.description ?? ''}
        </span>
      </div>
    );
  },
}));

function makeRecurrence(overrides: Partial<RecurringExpenseDTO>): RecurringExpenseDTO {
  return {
    id: 'rec-1',
    organizationId: 'org-1',
    description: 'Recorrência',
    favorecidoId: 'fav-1',
    categoryId: null,
    amountType: 'FIXED',
    amount: 1500,
    paymentMethod: null,
    municipality: 'São Paulo',
    dueDay: 5,
    startDate: new Date(2026, 0, 1),
    endDate: null,
    status: 'ACTIVE',
    terminationReason: null,
    terminatedAt: null,
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
    ...overrides,
  };
}

const activeRecurrence = makeRecurrence({ id: 'rec-1', description: 'Aluguel', status: 'ACTIVE' });
const endedRecurrence = makeRecurrence({ id: 'rec-2', description: 'Contabilidade', status: 'ENDED' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

function loadedList(recurrences: RecurringExpenseDTO[]) {
  mockUseRecurringExpenses.mockReturnValue({
    data: recurrences,
    total: recurrences.length,
    isTruncated: false,
    isLoading: false,
    error: null,
  });
}

/** Aciona o menu de ações da linha do desktop (jsdom renderiza os três breakpoints). */
async function openRowMenu(user: ReturnType<typeof userEvent.setup>, description: string) {
  const table = screen.getByTestId('recurring-expenses-table');
  const row = within(table).getByText(description).closest('tr') as HTMLElement;
  await user.click(within(row).getByRole('button', { name: /open menu/i }));
}

describe('Recorrencias', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    loadedList([activeRecurrence, endedRecurrence]);
  });

  describe('Casca da página', () => {
    it('renderiza título e descrição da área', () => {
      render(<Recorrencias />, { wrapper });

      expect(screen.getByText('Recorrências')).toBeInTheDocument();
      expect(
        screen.getByText('Cadastre e acompanhe as despesas que se repetem todo mês')
      ).toBeInTheDocument();
    });
  });

  describe('Listagem', () => {
    it('renderiza uma linha por recorrência devolvida pelo hook', () => {
      render(<Recorrencias />, { wrapper });

      const table = screen.getByTestId('recurring-expenses-table');
      expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
      expect(within(table).getByText('Aluguel')).toBeInTheDocument();
      expect(within(table).getByText('Contabilidade')).toBeInTheDocument();
    });

    it('renderiza o estado vazio quando a lista vem vazia', () => {
      loadedList([]);
      render(<Recorrencias />, { wrapper });

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma recorrência encontrada')).toBeInTheDocument();
    });

    it('renderiza o skeleton no estado de carregamento', () => {
      mockUseRecurringExpenses.mockReturnValue({
        data: [],
        total: 0,
        isTruncated: false,
        isLoading: true,
        error: null,
      });

      render(<Recorrencias />, { wrapper });

      const skeletons = screen
        .getAllByRole('generic')
        .filter((el) => el.className?.includes('animate-pulse'));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('revalida a listagem ao acionar "Tente novamente" no estado de erro', async () => {
      const user = userEvent.setup();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      mockUseRecurringExpenses.mockReturnValue({
        data: [],
        total: 0,
        isTruncated: false,
        isLoading: false,
        error: new Error('Falha ao carregar'),
      });

      render(<Recorrencias />, { wrapper });

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      await user.click(screen.getByText('Tente novamente'));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['recurring-expenses'],
      });
    });
  });

  describe('Criação (controlada pela página)', () => {
    it('não renderiza o formulário antes de acionar a criação', () => {
      render(<Recorrencias />, { wrapper });

      expect(screen.queryByTestId('recurring-form-modal')).not.toBeInTheDocument();
    });

    it('"Nova Recorrência" abre o formulário sem dados preenchidos', async () => {
      const user = userEvent.setup();
      render(<Recorrencias />, { wrapper });

      await user.click(screen.getByRole('button', { name: /nova recorrência/i }));

      expect(screen.getByTestId('recurring-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('create');
      expect(screen.getByTestId('form-modal-description')).toHaveTextContent('');
    });

    it('abre o formulário de criação já no primeiro render com initialCreateOpen', () => {
      render(<Recorrencias initialCreateOpen />, { wrapper });

      expect(screen.getByTestId('recurring-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('create');
    });

    it('fecha o formulário de criação ao acionar onClose', async () => {
      const user = userEvent.setup();
      render(<Recorrencias initialCreateOpen />, { wrapper });

      await user.click(screen.getByTestId('close-form-modal'));

      expect(screen.queryByTestId('recurring-form-modal')).not.toBeInTheDocument();
    });
  });

  describe('Ações por linha (delegadas a RecurringExpenseActions)', () => {
    it('"Editar" numa recorrência ativa abre o formulário preenchido com os dados dela', async () => {
      const user = userEvent.setup();
      render(<Recorrencias />, { wrapper });

      await openRowMenu(user, 'Aluguel');
      await user.click(screen.getByText('Editar'));

      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('edit');
      expect(screen.getByTestId('form-modal-description')).toHaveTextContent('Aluguel');
    });

    it('"Ver detalhes" numa recorrência encerrada abre o formulário somente-leitura', async () => {
      const user = userEvent.setup();
      render(<Recorrencias />, { wrapper });

      await openRowMenu(user, 'Contabilidade');
      await user.click(screen.getByText('Ver detalhes'));

      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('readonly');
      expect(screen.getByTestId('form-modal-description')).toHaveTextContent('Contabilidade');
    });

    it('"Encerrar" abre o diálogo de encerramento com a recorrência correspondente', async () => {
      const user = userEvent.setup();
      render(<Recorrencias />, { wrapper });

      await openRowMenu(user, 'Aluguel');
      await user.click(screen.getByText('Encerrar'));

      expect(screen.getByTestId('terminate-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('terminate-dialog-description')).toHaveTextContent('Aluguel');
    });
  });
});
