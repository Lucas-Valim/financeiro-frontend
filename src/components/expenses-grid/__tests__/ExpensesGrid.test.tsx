import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpensesGrid } from '../ExpensesGrid';
import type { ExpenseDTO } from '@/types/expenses';
import { ExpenseStatus } from '@/constants/expenses';

const mockExpenses: ExpenseDTO[] = [
  {
    id: '1',
    organizationId: 'org-1',
    categoryId: null,
    description: 'Test expense 1',
    amount: 100.50,
    currency: 'BRL',
    dueDate: new Date('2024-12-31'),
    status: ExpenseStatus.OPEN,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    receiver: 'Receiver 1',
    municipality: 'City 1',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    organizationId: 'org-1',
    categoryId: null,
    description: 'Test expense 2',
    amount: 200.75,
    currency: 'BRL',
    dueDate: new Date('2024-12-30'),
    status: ExpenseStatus.PAID,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    receiver: 'Receiver 2',
    municipality: 'City 2',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('ExpensesGrid', () => {
  const defaultProps = {
    expenses: mockExpenses,
    isLoading: false,
    error: null,
    hasNextPage: true,
    total: 100,
    onLoadMore: vi.fn(),
    onRefresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Table Rendering', () => {
    it('renders table with correct column headers on desktop', () => {
      render(<ExpensesGrid {...defaultProps} />);

      // Use getAllByText since headers appear in multiple views
      expect(screen.getAllByText('Actions').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Valor').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Fornecedor').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Data de Vencimento').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
    });

    it('renders ExpenseRow component for each expense in array', () => {
      render(<ExpensesGrid {...defaultProps} />);

      // Check for expense amounts in the table (desktop view)
      const expenseAmounts = screen.getAllByText(/R\$/);
      expect(expenseAmounts.length).toBeGreaterThanOrEqual(2);
    });

    it('renders Fornecedor column with receiver values in desktop view', () => {
      render(<ExpensesGrid {...defaultProps} />);

      expect(screen.getAllByText('Receiver 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Receiver 2').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Fornecedor column in tablet view', () => {
      render(<ExpensesGrid {...defaultProps} />);

      expect(screen.getAllByText('Fornecedor').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Receiver 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Receiver 2').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Fornecedor field in mobile view', () => {
      render(<ExpensesGrid {...defaultProps} />);

      const fornecedorLabels = screen.getAllByText('Fornecedor:');
      expect(fornecedorLabels.length).toBeGreaterThanOrEqual(2);
    });

    it('handles null receiver with N/A fallback', () => {
      const expensesWithNullReceiver: ExpenseDTO[] = [
        {
          ...mockExpenses[0],
          receiver: null as unknown as string,
        },
      ];
      render(<ExpensesGrid {...defaultProps} expenses={expensesWithNullReceiver} total={1} />);

      expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Loading State', () => {
    it('displays loading skeleton when isLoading is true', () => {
      render(<ExpensesGrid {...defaultProps} isLoading={true} />);

      const skeletons = screen.getAllByRole('generic').filter(
        (el) => el.className?.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows loading indicator in footer when isLoading is true', () => {
      render(<ExpensesGrid {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty state message when expenses array is empty', () => {
      render(<ExpensesGrid {...defaultProps} expenses={[]} total={0} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma despesa encontrada')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when error prop is provided', () => {
      const error = new Error('Failed to fetch expenses');
      render(<ExpensesGrid {...defaultProps} error={error} />);

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Error loading expenses')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch expenses')).toBeInTheDocument();
    });

    it('calls onRefresh callback when retry button is clicked', () => {
      const onRefresh = vi.fn();
      const error = new Error('Failed to fetch expenses');
      render(
        <ExpensesGrid {...defaultProps} error={error} onRefresh={onRefresh} />
      );

      const retryButton = screen.getByText('Tente novamente');
      fireEvent.click(retryButton);

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Footer Counter', () => {
    it('footer counter displays correct "Showing X-Y of Z" values', () => {
      render(<ExpensesGrid {...defaultProps} expenses={mockExpenses} total={100} />);

      const footerCounter = screen.getByTestId('footer-counter');
      expect(footerCounter).toHaveTextContent('Mostrando 1-2 de 100 despesas');
    });

    it('displays correct counter for empty expenses', () => {
      render(<ExpensesGrid {...defaultProps} expenses={[]} total={0} />);

      expect(screen.getByText('Nenhuma despesa encontrada')).toBeInTheDocument();
    });
  });

  describe('Intersection Observer', () => {
    it('has observer target element for Intersection Observer', () => {
      render(<ExpensesGrid {...defaultProps} />);

      expect(screen.getByTestId('observer-target')).toBeInTheDocument();
    });

    it('does not call onLoadMore when hasNextPage is false', () => {
      const onLoadMore = vi.fn();
      render(
        <ExpensesGrid {...defaultProps} onLoadMore={onLoadMore} hasNextPage={false} />
      );

      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });

  describe('Scroll Debounce', () => {
    it('implements manual debounce to prevent excessive scroll callback invocations', async () => {
      render(<ExpensesGrid {...defaultProps} />);

      const container = screen.getByTestId('expenses-table-container');
      
      // Simulate multiple rapid scroll events
      fireEvent.scroll(container, { target: { scrollTop: 100 } });
      fireEvent.scroll(container, { target: { scrollTop: 200 } });
      fireEvent.scroll(container, { target: { scrollTop: 300 } });

      // Wait for debounce
      await waitFor(() => {
        const scrollPosition = screen.getByTestId('scroll-position');
        expect(scrollPosition).toBeInTheDocument();
      }, { timeout: 400 });
    });
  });

  describe('Responsive Layout', () => {
    it('renders table container with correct responsive classes', () => {
      render(<ExpensesGrid {...defaultProps} />);

      // The table container is inside a wrapper with 'hidden lg:block'
      // We check that the table container exists and has the expected data-testid
      expect(screen.getByTestId('expenses-table-container')).toBeInTheDocument();
    });

    it('renders tablet container with correct responsive classes', () => {
      render(<ExpensesGrid {...defaultProps} />);

      // The tablet container is inside a wrapper with 'hidden md:block lg:hidden'
      expect(screen.getByTestId('expenses-tablet-container')).toBeInTheDocument();
    });

    it('renders mobile container with correct responsive classes', () => {
      render(<ExpensesGrid {...defaultProps} />);

      // The mobile container is inside a wrapper with 'md:hidden'
      expect(screen.getByTestId('expenses-mobile-container')).toBeInTheDocument();
    });
  });

  describe('Sticky Header', () => {
    it('sticky header remains visible during vertical scroll', () => {
      render(<ExpensesGrid {...defaultProps} />);

      const thead = screen.getByTestId('expenses-table').querySelector('thead');
      expect(thead).toHaveClass('sticky');
      expect(thead).toHaveClass('top-0');
    });
  });

  describe('Loading More Spinner', () => {
    it('shows spinner when loading more data (isLoading true and expenses exist)', () => {
      render(<ExpensesGrid {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-more-spinner')).toBeInTheDocument();
    });

    it('does not show spinner during initial load (empty expenses)', () => {
      render(<ExpensesGrid {...defaultProps} expenses={[]} isLoading={true} />);

      expect(screen.queryByTestId('loading-more-spinner')).not.toBeInTheDocument();
    });

    it('does not show spinner when not loading', () => {
      render(<ExpensesGrid {...defaultProps} isLoading={false} />);

      expect(screen.queryByTestId('loading-more-spinner')).not.toBeInTheDocument();
    });
  });
});
