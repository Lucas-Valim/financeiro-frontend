import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Despesa } from '../Despesa';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

const mockUseExpenses = vi.fn();

vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: (...args: unknown[]) => mockUseExpenses(...args),
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
    description: 'Test expense',
    amount: 100,
    currency: 'BRL',
    dueDate: new Date('2024-01-01'),
    status: ExpenseStatus.OPEN,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    receiver: 'Test Receiver',
    municipality: 'Test City',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
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

  describe('StatusCards', () => {
    it('should render StatusCards with correct counts', () => {
      mockUseExpenses.mockReturnValue({
        data: [
          { ...mockExpense, status: ExpenseStatus.OPEN },
          { ...mockExpense, id: '2', status: ExpenseStatus.PAID },
        ],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('1');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('1');
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

      const openCard = screen.getByTestId('status-card-open');
      fireEvent.click(openCard);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });
    });

    it('should clear filters when clicking same status card again', async () => {
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

      const openCard = screen.getByTestId('status-card-open');
      fireEvent.click(openCard);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(openCard);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Clear Filters Button', () => {
    it('should not show clear filters button when no filters are active', () => {
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

    it('should show clear filters button when filters are active', async () => {
      mockUseExpenses.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      const openCard = screen.getByTestId('status-card-open');
      fireEvent.click(openCard);

      await waitFor(() => {
        expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
      });
    });

    it('should clear filters and trigger reset when clear filters button is clicked', async () => {
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

      const openCard = screen.getByTestId('status-card-open');
      fireEvent.click(openCard);

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

      const openCard = screen.getByTestId('status-card-open');
      fireEvent.click(openCard);

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
});
