import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringExpensesGrid } from '../RecurringExpensesGrid';
import { useRecurringExpenses } from '@/hooks/use-recurring-expenses';
import type { RecurringExpenseDTO } from '@/types/recurring-expenses';

const mockUseFavorecidos = vi.fn();
const mockUseRecurringExpenses = vi.fn();

vi.mock('@/hooks/use-favorecidos', () => ({
  useFavorecidos: () => mockUseFavorecidos(),
}));

vi.mock('@/hooks/use-recurring-expenses', () => ({
  useRecurringExpenses: () => mockUseRecurringExpenses(),
}));

// Os diálogos de ação usam react-query e as fontes de dados do formulário mesmo
// fechados; este teste é do grid, não deles — isolamos como o teste de
// `RecurringExpenseActions` já faz.
vi.mock('../RecurringExpenseFormModal', () => ({
  RecurringExpenseFormModal: () => null,
}));

vi.mock('../TerminateRecurringExpenseDialog', () => ({
  TerminateRecurringExpenseDialog: () => null,
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

const threeRecurrences: RecurringExpenseDTO[] = [
  makeRecurrence({ id: 'rec-1', description: 'Aluguel' }),
  makeRecurrence({ id: 'rec-2', description: 'Internet' }),
  makeRecurrence({ id: 'rec-3', description: 'Contabilidade' }),
];

const defaultProps = {
  recurringExpenses: threeRecurrences,
  isLoading: false,
  error: null as Error | null,
  total: 3,
  isTruncated: false,
  onRefresh: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseFavorecidos.mockReturnValue({
    favorecidos: [{ id: 'fav-1', name: 'Favorecido Um' }],
    isLoading: false,
    error: null,
  });
});

function desktopRowCount() {
  const table = screen.getByTestId('recurring-expenses-table');
  return table.querySelectorAll('tbody tr').length;
}

describe('RecurringExpensesGrid', () => {
  describe('Rendering from data', () => {
    it('renders one row per recurrence and a footer counter naming the total', () => {
      render(<RecurringExpensesGrid {...defaultProps} />);

      expect(desktopRowCount()).toBe(3);
      expect(screen.getByTestId('footer-counter')).toHaveTextContent(
        'Mostrando 1-3 de 3 recorrências'
      );
    });

    it('resolves the favorecido name from the shared favorecidos query', () => {
      render(<RecurringExpensesGrid {...defaultProps} />);

      expect(screen.getAllByText('Favorecido Um').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Empty state', () => {
    it('renders the DataGrid empty state while keeping the create button', () => {
      const onCreate = vi.fn();
      render(
        <RecurringExpensesGrid
          {...defaultProps}
          recurringExpenses={[]}
          total={0}
          onCreate={onCreate}
        />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma recorrência encontrada')).toBeInTheDocument();
      expect(screen.getByText('Nova Recorrência')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('renders the DataGrid skeleton while loading', () => {
      render(<RecurringExpensesGrid {...defaultProps} isLoading={true} />);

      const skeletons = screen
        .getAllByRole('generic')
        .filter((el) => el.className?.includes('animate-pulse'));
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error state', () => {
    it('renders the error state with a retry action', () => {
      const onRefresh = vi.fn();
      const error = new Error('Falha ao carregar');
      render(
        <RecurringExpensesGrid {...defaultProps} error={error} onRefresh={onRefresh} />
      );

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Erro ao carregar recorrências')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Tente novamente'));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Truncation warning', () => {
    it('shows the truncation warning when isTruncated is true', () => {
      render(<RecurringExpensesGrid {...defaultProps} isTruncated={true} />);

      expect(
        screen.getByTestId('recurring-expenses-truncation-warning')
      ).toBeInTheDocument();
    });

    it('does not show the truncation warning when isTruncated is false', () => {
      render(<RecurringExpensesGrid {...defaultProps} isTruncated={false} />);

      expect(
        screen.queryByTestId('recurring-expenses-truncation-warning')
      ).not.toBeInTheDocument();
    });
  });

  describe('Fed by the listing hook', () => {
    function Harness() {
      const { data, total, isTruncated, isLoading, error } = useRecurringExpenses();
      return (
        <RecurringExpensesGrid
          recurringExpenses={data}
          total={total}
          isTruncated={isTruncated}
          isLoading={isLoading}
          error={error}
          onRefresh={vi.fn()}
        />
      );
    }

    it('renders three rows from the hook payload', () => {
      mockUseRecurringExpenses.mockReturnValue({
        data: threeRecurrences,
        total: 3,
        isTruncated: false,
        isLoading: false,
        error: null,
      });

      render(<Harness />);

      expect(desktopRowCount()).toBe(3);
    });

    it('surfaces the hook truncation signal on screen', () => {
      mockUseRecurringExpenses.mockReturnValue({
        data: threeRecurrences,
        total: 120,
        isTruncated: true,
        isLoading: false,
        error: null,
      });

      render(<Harness />);

      expect(
        screen.getByTestId('recurring-expenses-truncation-warning')
      ).toBeInTheDocument();
    });
  });
});
