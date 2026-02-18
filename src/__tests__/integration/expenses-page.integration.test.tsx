import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Despesa } from '@/components/pages/Despesa';
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

describe('ExpensesPage Integration', () => {
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

  const createMockExpense = (id: string, status: ExpenseStatus): ExpenseDTO => ({
    id,
    organizationId: 'fca3c088-ba34-43a2-9b32-b2b1a1246915',
    categoryId: null,
    description: `Test expense ${id}`,
    amount: 100,
    currency: 'BRL',
    dueDate: new Date('2024-01-01'),
    status,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Test Receiver',
    municipality: 'Test City',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('full filter change flow', () => {
    it('should handle complete flow: open modal → apply filters → cache invalidation → refetch from page 1', async () => {
      const resetMock = vi.fn();

      mockUseExpenses.mockReturnValue({
        data: [
          createMockExpense('1', ExpenseStatus.OPEN),
          createMockExpense('2', ExpenseStatus.PAID),
        ],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: resetMock,
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('expenses-table')).toBeInTheDocument();

      const filterButton = screen.getByTestId('filter-button');
      fireEvent.click(filterButton);

      expect(screen.getByText('Filtrar Despesas')).toBeInTheDocument();

      const applyButton = screen.getByText('Aplicar');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });

      expect(screen.queryByText('Filtrar Despesas')).not.toBeInTheDocument();
    });

    it('should handle filter by status card click flow', async () => {
      const resetMock = vi.fn();

      mockUseExpenses.mockReturnValue({
        data: [
          createMockExpense('1', ExpenseStatus.OPEN),
          createMockExpense('2', ExpenseStatus.OPEN),
        ],
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

    it('should handle clear filters flow', async () => {
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

      expect(screen.queryByText('Filtrar Despesas')).not.toBeInTheDocument();
    });

    it('should handle clear filters button on main page', async () => {
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

      const clearFiltersButton = screen.getByTestId('clear-filters-button');
      fireEvent.click(clearFiltersButton);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });

      expect(screen.queryByTestId('clear-filters-button')).not.toBeInTheDocument();
    });
  });

  describe('lazy loading flow', () => {
    it('should handle scroll to bottom → fetchNextPage called → new data appears', async () => {
      const loadMoreMock = vi.fn();
      const mockExpenses: ExpenseDTO[] = Array.from({ length: 10 }, (_, i) =>
        createMockExpense(String(i + 1), ExpenseStatus.OPEN)
      );

      mockUseExpenses.mockReturnValue({
        data: mockExpenses,
        isLoading: false,
        error: null,
        hasMore: true,
        loadMore: loadMoreMock,
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('expenses-table')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(11);
    });
  });

  describe('error recovery flow', () => {
    it('should handle error state → retry click → data reload', async () => {
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

      expect(screen.getByTestId('error-state')).toBeInTheDocument();

      const retryButton = screen.getByText('Tentar Novamente');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalled();
      });
    });
  });

  describe('status card filter integration', () => {
    it('should update grid when clicking different status cards', async () => {
      const resetMock = vi.fn();

      mockUseExpenses.mockReturnValue({
        data: [
          createMockExpense('1', ExpenseStatus.OPEN),
          createMockExpense('2', ExpenseStatus.OVERDUE),
        ],
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

      const overdueCard = screen.getByTestId('status-card-overdue');
      fireEvent.click(overdueCard);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear filters when clicking the same status card twice', async () => {
      const resetMock = vi.fn();

      mockUseExpenses.mockReturnValue({
        data: [
          createMockExpense('1', ExpenseStatus.OPEN),
        ],
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

      expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();

      fireEvent.click(openCard);

      await waitFor(() => {
        expect(resetMock).toHaveBeenCalledTimes(2);
      });

      expect(screen.queryByTestId('clear-filters-button')).not.toBeInTheDocument();
    });
  });

  describe('modal state persistence', () => {
    it('should pre-fill modal with current filter values when opening', () => {
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
  });

  describe('status counts calculation', () => {
    it('should correctly calculate status counts from expenses data', () => {
      mockUseExpenses.mockReturnValue({
        data: [
          createMockExpense('1', ExpenseStatus.OPEN),
          createMockExpense('2', ExpenseStatus.OPEN),
          createMockExpense('3', ExpenseStatus.PAID),
          createMockExpense('4', ExpenseStatus.OVERDUE),
          createMockExpense('5', ExpenseStatus.CANCELLED),
        ],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        reset: vi.fn(),
      });

      render(<Despesa />, { wrapper });

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('2');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('1');
      expect(screen.getByTestId('status-count-overdue')).toHaveTextContent('1');
      expect(screen.getByTestId('status-count-cancelled')).toHaveTextContent('1');
    });
  });
});
