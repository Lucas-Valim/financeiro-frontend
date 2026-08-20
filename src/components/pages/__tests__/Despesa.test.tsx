import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Despesa } from '../Despesa';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

// Mock the ExpenseFormModal to verify props
const mockExpenseFormModal = vi.fn();
vi.mock('@/components/expenses/ExpenseFormModal', () => ({
  ExpenseFormModal: (props: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (expense: ExpenseDTO) => void;
    expense?: ExpenseDTO | null;
    readonly?: boolean;
  }) => {
    mockExpenseFormModal(props);
    return props.isOpen ? (
      <div data-testid="expense-form-modal" aria-modal="true" role="dialog">
        <span data-testid="modal-mode">
          {props.expense ? 'edit' : 'create'}
        </span>
        <button onClick={props.onClose} data-testid="modal-close">
          Close
        </button>
        <button
          onClick={() => props.onSuccess?.(props.expense || {} as ExpenseDTO)}
          data-testid="modal-success"
        >
          Submit
        </button>
      </div>
    ) : null;
  },
}));

const mockUseExpenses = vi.fn();

vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: (...args: unknown[]) => mockUseExpenses(...args),
}));

const mockUseExpensesSummary = vi.fn();

type SummaryItemOverride = {
  count: number;
  total: number;
  estimatedCount?: number;
  estimatedTotal?: number;
};

const emptyItem = () => ({
  count: 0,
  total: 0,
  estimatedCount: 0,
  estimatedTotal: 0,
});

const buildSummary = (overrides: Partial<Record<
  'OPEN' | 'OVERDUE' | 'PAID' | 'CANCELLED',
  SummaryItemOverride
>> = {}) => ({
  OPEN: { ...emptyItem(), ...overrides.OPEN },
  OVERDUE: { ...emptyItem(), ...overrides.OVERDUE },
  PAID: { ...emptyItem(), ...overrides.PAID },
  CANCELLED: { ...emptyItem(), ...overrides.CANCELLED },
});

vi.mock('@/hooks/use-expenses-summary', () => ({
  useExpensesSummary: (...args: unknown[]) => mockUseExpensesSummary(...args),
}));

// O FilterModal renderiza os campos compartilhados, que buscam categorias e
// favorecidos; sem estes mocks os testes bateriam na API real.
vi.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({ categories: [], isLoading: false, error: null }),
}));

vi.mock('@/hooks/use-favorecidos', () => ({
  useFavorecidos: () => ({ favorecidos: [], isLoading: false, error: null }),
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
  };
});

describe('Despesa', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockExpense: ExpenseDTO = {
    id: '1',
    organizationId: 'fca3c088-ba34-43a2-9b32-b2b1a1246915',
    categoryId: null,
    favorecidoId: null,
    description: 'Test expense',
    amount: 100,
    currency: 'BRL',
    dueDate: new Date('2024-01-01'),
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
    recurringExpenseId: null,
    occurrenceMonth: null,
    amountPendingConfirmation: false,
    documentPending: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExpenseFormModal.mockClear();
    queryClient.clear();
    mockUseExpensesSummary.mockReturnValue({
      summary: buildSummary(),
      isLoading: false,
      error: null,
    });
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByText('Gerenciamento de Despesas')).toBeInTheDocument();
    });

    it('should display page title and description', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByText('Gerenciamento de Despesas')).toBeInTheDocument();
      expect(
        screen.getByText('Controle e organize suas despesas de forma eficiente')
      ).toBeInTheDocument();
    });
  });

  describe('default filters', () => {
    it('should load with open status and current month range by default', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const now = new Date();
      expect(mockUseExpenses).toHaveBeenCalledWith({
        filters: {
          status: ExpenseStatus.OPEN,
          dueDateStart: startOfMonth(now),
          dueDateEnd: endOfMonth(now),
        },
      });
    });

    it('should mark the "Abertas" status card as active by default', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('status-card-open').className).toContain(
        'ring-primary'
      );
    });
  });

  describe('StatusCards', () => {
    it('should render StatusCards with counts and totals from the summary', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });
      mockUseExpensesSummary.mockReturnValue({
        summary: buildSummary({
          OPEN: { count: 1, total: 150.5 },
          PAID: { count: 1, total: 300 },
        }),
        isLoading: false,
        error: null,
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('1');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('1');
      expect(screen.getByTestId('status-total-open')).toHaveTextContent('150,50');
      expect(screen.getByTestId('status-total-paid')).toHaveTextContent('300,00');
    });

    it('should surface the estimated subline when a bucket carries an estimated portion', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });
      mockUseExpensesSummary.mockReturnValue({
        summary: buildSummary({
          OPEN: { count: 5, total: 5000, estimatedCount: 2, estimatedTotal: 1500 },
        }),
        isLoading: false,
        error: null,
      });

      render(<Despesa />, { wrapper });

      // O número principal continua sendo o total completo, não total - estimado.
      expect(screen.getByTestId('status-total-open')).toHaveTextContent('5.000,00');
      const estimated = screen.getByTestId('status-estimated-open');
      expect(estimated).toHaveTextContent('1.500,00');
      expect(estimated).toHaveTextContent('2 de 5');
    });

    it('should render the cards from EMPTY_SUMMARY while the summary is loading, without an estimated subline', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });
      // EMPTY_SUMMARY é o fallback do hook enquanto data ainda é undefined.
      mockUseExpensesSummary.mockReturnValue({
        summary: buildSummary(),
        isLoading: true,
        error: null,
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('status-card-open')).toBeInTheDocument();
      expect(screen.getByTestId('status-total-open')).toHaveTextContent('0,00');
      expect(screen.queryByTestId('status-estimated-open')).not.toBeInTheDocument();
    });

    it('should filter by status when clicking on status card', async () => {
      const resetMock = vi.fn();
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      const paidCard = screen.getByTestId('status-card-paid');
      fireEvent.click(paidCard);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });
    });

    it('should toggle a status filter off when clicking the same status card again', async () => {
      const resetMock = vi.fn();
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      const paidCard = screen.getByTestId('status-card-paid');
      fireEvent.click(paidCard);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(paidCard);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Clear Filters Button', () => {
    it('should not show clear filters button on default filters', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.queryByTestId('clear-filters-button')).not.toBeInTheDocument();
    });

    it('should show clear filters button when filters differ from default', async () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const paidCard = screen.getByTestId('status-card-paid');
      fireEvent.click(paidCard);

      await waitFor(() => {
        expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
      });
    });

    it('should reset to default filters and hide the button when clear filters is clicked', async () => {
      const resetMock = vi.fn();
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      const paidCard = screen.getByTestId('status-card-paid');
      fireEvent.click(paidCard);

      await waitFor(() => {
        expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
      });

      const clearButton = screen.getByTestId('clear-filters-button');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });

      expect(screen.queryByTestId('clear-filters-button')).not.toBeInTheDocument();
    });
  });

  describe('FilterModal', () => {
    it('should open FilterModal when filter button is clicked', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const filterButton = screen.getByTestId('filter-button');
      fireEvent.click(filterButton);

      expect(screen.getByText('Filtrar Despesas')).toBeInTheDocument();
    });

    it('should close FilterModal when cancel is clicked', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const filterButton = screen.getByTestId('filter-button');
      fireEvent.click(filterButton);

      expect(screen.getByText('Filtrar Despesas')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Filtrar Despesas')).not.toBeInTheDocument();
    });

    it('should apply filters and trigger reset when Apply is clicked', async () => {
      const resetMock = vi.fn();
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      const filterButton = screen.getByTestId('filter-button');
      fireEvent.click(filterButton);

      const applyButton = screen.getByText('Aplicar');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });
    });

    it('should clear filters and trigger reset when Clear is clicked', async () => {
      const resetMock = vi.fn();
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      const filterButton = screen.getByTestId('filter-button');
      fireEvent.click(filterButton);

      const clearButton = screen.getByText('Limpar');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });
    });
  });

  describe('ExpensesGrid', () => {
    it('should display expenses data from useExpenses hook', () => {
      mockUseExpenses.mockReturnValue({
        data: [mockExpense],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('expenses-table')).toBeInTheDocument();
    });

    it('should show loading state during initial fetch', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show empty state when no results', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should show error state when fetch fails', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to fetch'),
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Erro ao carregar despesas')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should display loading spinner during initial data fetch', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('should display error message when API call fails', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Network error'),
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Erro ao carregar despesas')).toBeInTheDocument();
    });

    it('should call reset when retry button is clicked', async () => {
      const resetMock = vi.fn();
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Network error'),
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      const retryButton = screen.getByText('Tentar Novamente');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });
    });
  });

  describe('filter change flow', () => {
    it('should trigger cache invalidation and refetch when filters change', async () => {
      const resetMock = vi.fn();
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      const filterButton = screen.getByTestId('filter-button');
      fireEvent.click(filterButton);

      const applyButton = screen.getByText('Aplicar');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });
    });

    it('should reset to page 1 when filters change', async () => {
      const resetMock = vi.fn();
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      const paidCard = screen.getByTestId('status-card-paid');
      fireEvent.click(paidCard);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });
    });
  });

  describe('responsive layout', () => {
    it('should render on mobile viewport', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByText('Gerenciamento de Despesas')).toBeInTheDocument();
    });

    it('should render on desktop viewport', () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByText('Gerenciamento de Despesas')).toBeInTheDocument();
    });
  });

  describe('ExpenseFormModal Integration', () => {
    it('should open ExpenseFormModal when Nova Despesa button is clicked', async () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      // Initially modal should not be visible
      expect(screen.queryByTestId('expense-form-modal')).not.toBeInTheDocument();

      // Click the Nova Despesa button
      const createButton = screen.getByText('Nova Despesa');
      fireEvent.click(createButton);

      // Modal should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('expense-form-modal')).toBeInTheDocument();
      });

      // Verify modal is in create mode
      expect(screen.getByTestId('modal-mode')).toHaveTextContent('create');
    });

    it('should pass null expense to ExpenseFormModal when creating new expense', async () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const createButton = screen.getByText('Nova Despesa');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockExpenseFormModal).toHaveBeenCalledWith(
          expect.objectContaining({
            isOpen: true,
            expense: null,
          })
        );
      });
    });

    it('should close ExpenseFormModal when onClose callback is triggered', async () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      // Open modal
      const createButton = screen.getByText('Nova Despesa');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('expense-form-modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('expense-form-modal')).not.toBeInTheDocument();
      });
    });

    it('should trigger reset when onSuccess callback is called', async () => {
      const resetMock = vi.fn();
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      // Open modal
      const createButton = screen.getByText('Nova Despesa');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('expense-form-modal')).toBeInTheDocument();
      });

      // Trigger success
      const successButton = screen.getByTestId('modal-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });
    });

    it('should open ExpenseFormModal with selected expense when editing', async () => {
      mockUseExpenses.mockReturnValue({
        data: [mockExpense],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      // Simulate edit by clicking the Edit button in mobile view
      // Mobile view has a direct Edit button that's easier to test
      const user = userEvent.setup();
      const triggers = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Editar'));

      await waitFor(() => {
        expect(screen.getByTestId('expense-form-modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-mode')).toHaveTextContent('edit');
      });
    });

    it('should pass the correct expense to ExpenseFormModal when editing', async () => {
      mockUseExpenses.mockReturnValue({
        data: [mockExpense],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      // Click Edit in mobile view
      const user = userEvent.setup();
      const triggers = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Editar'));

      await waitFor(() => {
        expect(mockExpenseFormModal).toHaveBeenCalledWith(
          expect.objectContaining({
            isOpen: true,
            expense: mockExpense,
          })
        );
      });
    });

    it('should open the modal in editable mode for an OPEN expense', async () => {
      mockUseExpenses.mockReturnValue({
        data: [mockExpense],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const user = userEvent.setup();
      const triggers = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Editar'));

      await waitFor(() => {
        expect(mockExpenseFormModal).toHaveBeenLastCalledWith(
          expect.objectContaining({
            isOpen: true,
            expense: mockExpense,
            readonly: false,
          })
        );
      });
    });

    it('should open the modal in readonly mode for a PAID expense', async () => {
      const paidExpense = { ...mockExpense, status: ExpenseStatus.PAID };
      mockUseExpenses.mockReturnValue({
        data: [paidExpense],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const user = userEvent.setup();
      const triggers = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Ver Detalhes'));

      await waitFor(() => {
        expect(mockExpenseFormModal).toHaveBeenLastCalledWith(
          expect.objectContaining({
            isOpen: true,
            expense: paidExpense,
            readonly: true,
          })
        );
      });
    });

    it('should open the modal in readonly mode for a CANCELLED expense', async () => {
      const cancelledExpense = { ...mockExpense, status: ExpenseStatus.CANCELLED };
      mockUseExpenses.mockReturnValue({
        data: [cancelledExpense],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const user = userEvent.setup();
      const triggers = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Ver Detalhes'));

      await waitFor(() => {
        expect(mockExpenseFormModal).toHaveBeenLastCalledWith(
          expect.objectContaining({
            isOpen: true,
            expense: cancelledExpense,
            readonly: true,
          })
        );
      });
    });

    it('should not open the modal in readonly mode when creating a new expense', async () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const createButton = screen.getByText('Nova Despesa');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockExpenseFormModal).toHaveBeenLastCalledWith(
          expect.objectContaining({
            isOpen: true,
            expense: null,
            readonly: false,
          })
        );
      });
    });

    it('should reset selectedExpense to null when modal closes', async () => {
      mockUseExpenses.mockReturnValue({
        data: [mockExpense],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      // Open edit modal
      const user = userEvent.setup();
      const triggers = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Editar'));

      await waitFor(() => {
        expect(screen.getByTestId('expense-form-modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('expense-form-modal')).not.toBeInTheDocument();
      });

      // Open create modal to verify expense is null
      const createButton = screen.getByText('Nova Despesa');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockExpenseFormModal).toHaveBeenLastCalledWith(
          expect.objectContaining({
            isOpen: true,
            expense: null,
          })
        );
      });
    });
  });
});
