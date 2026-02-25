import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarPage } from '../CalendarPage';
import { useExpenseCalendar } from '@/hooks/use-expense-calendar';
import { useCategories } from '@/hooks/use-categories';
import type { ExpenseDTO } from '@/types/expenses';
import type { CategoryDTO } from '@/types/categories';
import { ExpenseStatus } from '@/constants/expenses';

vi.mock('@/hooks/use-expense-calendar');
vi.mock('@/hooks/use-categories');
vi.mock('../CalendarToolbar', () => ({
  CalendarToolbar: vi.fn(({ currentDate, view, onViewChange, onNavigate, onCreateExpense, filters, onFilterChange, categories, receivers }) => (
    <div data-testid="calendar-toolbar">
      <button onClick={() => onNavigate('prev')} aria-label="Período anterior">
        Anterior
      </button>
      <span data-testid="current-date">{currentDate.toISOString()}</span>
      <span data-testid="current-view">{view}</span>
      <button onClick={() => onViewChange('week')} aria-label="Mudar para semanal">
        Semanal
      </button>
      <button onClick={() => onNavigate('next')} aria-label="Próximo período">
        Próximo
      </button>
      <button onClick={onCreateExpense} aria-label="Nova despesa">
        Nova Despesa
      </button>
      <span data-testid="filters">{JSON.stringify(filters)}</span>
      <span data-testid="categories-count">{categories.length}</span>
      <span data-testid="receivers-count">{receivers.length}</span>
      <button onClick={() => onFilterChange({ status: ExpenseStatus.PAID })}>
        Filtrar Pagos
      </button>
    </div>
  )),
}));
vi.mock('../ExpenseCalendar', () => ({
  ExpenseCalendar: vi.fn(({ expenses, currentDate, view, onEventClick }) => (
    <div data-testid="expense-calendar">
      <span data-testid="expenses-count">{expenses.length}</span>
      <span data-testid="calendar-date">{currentDate.toISOString()}</span>
      <span data-testid="calendar-view">{view}</span>
      {expenses.map((expense: ExpenseDTO) => (
        <button
          key={expense.id}
          onClick={() => onEventClick(expense)}
          data-testid={`event-${expense.id}`}
        >
          {expense.description}
        </button>
      ))}
    </div>
  )),
}));
vi.mock('../CalendarSkeleton', () => ({
  CalendarSkeleton: vi.fn(({ view }) => (
    <div data-testid="calendar-skeleton" data-view={view}>
      Loading...
    </div>
  )),
}));
vi.mock('@/components/expenses/ExpenseFormModal', () => ({
  ExpenseFormModal: vi.fn(({ isOpen, onClose, expense, onSuccess, readonly }) => (
    isOpen ? (
      <div data-testid="expense-form-modal" data-readonly={readonly}>
        <span data-testid="modal-expense-id">{expense?.id ?? 'new'}</span>
        <button onClick={onClose} aria-label="Fechar modal">
          Fechar
        </button>
        <button onClick={() => onSuccess?.(expense!)} aria-label="Confirmar">
          Confirmar
        </button>
      </div>
    ) : null
  )),
}));

function createMockExpense(overrides?: Partial<ExpenseDTO>): ExpenseDTO {
  return {
    id: 'expense-1',
    organizationId: 'org-1',
    categoryId: null,
    description: 'Test Expense',
    amount: 1500,
    currency: 'BRL',
    dueDate: new Date('2026-02-15T12:00:00'),
    status: ExpenseStatus.OPEN,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Test Receiver',
    municipality: 'São Paulo',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockCategory(overrides?: Partial<CategoryDTO>): CategoryDTO {
  return {
    id: 'cat-1',
    organizationId: 'org-1',
    name: 'Test Category',
    description: 'Test Category Description',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('CalendarPage', () => {
  const mockUseExpenseCalendar = vi.mocked(useExpenseCalendar);
  const mockUseCategories = vi.mocked(useCategories);

  const defaultExpenseCalendarReturn = {
    expenses: [] as ExpenseDTO[],
    isLoading: false,
    error: null as Error | null,
    receivers: [] as string[],
  };

  const defaultCategoriesReturn = {
    categories: [] as CategoryDTO[],
    isLoading: false,
    error: null as Error | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseExpenseCalendar.mockReturnValue(defaultExpenseCalendarReturn);
    mockUseCategories.mockReturnValue(defaultCategoriesReturn);
  });

  describe('rendering', () => {
    it('renders CalendarToolbar component', () => {
      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('calendar-toolbar')).toBeInTheDocument();
    });

    it('renders ExpenseCalendar component', () => {
      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('expense-calendar')).toBeInTheDocument();
    });

    it('renders with month view by default', () => {
      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('current-view')).toHaveTextContent('month');
    });
  });

  describe('loading state', () => {
    it('shows CalendarSkeleton when expenses are loading', () => {
      mockUseExpenseCalendar.mockReturnValue({
        ...defaultExpenseCalendarReturn,
        isLoading: true,
      });

      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
    });

    it('shows CalendarSkeleton when categories are loading', () => {
      mockUseCategories.mockReturnValue({
        ...defaultCategoriesReturn,
        isLoading: true,
      });

      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
    });

    it('passes current view to CalendarSkeleton', () => {
      mockUseExpenseCalendar.mockReturnValue({
        ...defaultExpenseCalendarReturn,
        isLoading: true,
      });

      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('calendar-skeleton')).toHaveAttribute('data-view', 'month');
    });
  });

  describe('error state', () => {
    it('shows error message when expenses fail to load', () => {
      mockUseExpenseCalendar.mockReturnValue({
        ...defaultExpenseCalendarReturn,
        error: new Error('Failed to load'),
      });

      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByText('Erro ao carregar despesas. Tente novamente.')).toBeInTheDocument();
    });
  });

  describe('data integration', () => {
    it('passes expenses to ExpenseCalendar', () => {
      const expenses = [createMockExpense({ id: 'exp-1' })];
      mockUseExpenseCalendar.mockReturnValue({
        ...defaultExpenseCalendarReturn,
        expenses,
      });

      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('expenses-count')).toHaveTextContent('1');
    });

    it('passes categories to CalendarToolbar', () => {
      const categories = [createMockCategory({ id: 'cat-1' })];
      mockUseCategories.mockReturnValue({
        ...defaultCategoriesReturn,
        categories,
      });

      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('categories-count')).toHaveTextContent('1');
    });

    it('passes receivers to CalendarToolbar', () => {
      mockUseExpenseCalendar.mockReturnValue({
        ...defaultExpenseCalendarReturn,
        receivers: ['Receiver A', 'Receiver B'],
      });

      render(<CalendarPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('receivers-count')).toHaveTextContent('2');
    });
  });

  describe('navigation', () => {
    it('navigates to previous period when prev button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Período anterior'));

      const dateElement = screen.getByTestId('current-date');
      expect(dateElement.textContent).toBeDefined();
    });

    it('navigates to next period when next button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Próximo período'));

      const dateElement = screen.getByTestId('current-date');
      expect(dateElement.textContent).toBeDefined();
    });

    it('changes view when view button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Mudar para semanal'));

      expect(screen.getByTestId('current-view')).toHaveTextContent('week');
    });
  });

  describe('filters', () => {
    it('updates filters when filter button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Filtrar Pagos'));

      expect(screen.getByTestId('filters')).toHaveTextContent(ExpenseStatus.PAID);
    });
  });

  describe('modal - create expense', () => {
    it('opens modal when "Nova Despesa" button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Nova despesa'));

      expect(screen.getByTestId('expense-form-modal')).toBeInTheDocument();
    });

    it('modal opens in create mode (not readonly)', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Nova despesa'));

      expect(screen.getByTestId('expense-form-modal')).toHaveAttribute('data-readonly', 'false');
    });

    it('modal shows new expense (no id)', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Nova despesa'));

      expect(screen.getByTestId('modal-expense-id')).toHaveTextContent('new');
    });
  });

  describe('modal - view expense', () => {
    it('opens modal when expense event is clicked', async () => {
      const user = userEvent.setup();
      const expense = createMockExpense({ id: 'exp-1', description: 'Test Expense' });
      mockUseExpenseCalendar.mockReturnValue({
        ...defaultExpenseCalendarReturn,
        expenses: [expense],
      });

      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('event-exp-1'));

      expect(screen.getByTestId('expense-form-modal')).toBeInTheDocument();
    });

    it('modal opens in readonly mode when viewing expense', async () => {
      const user = userEvent.setup();
      const expense = createMockExpense({ id: 'exp-1', description: 'Test Expense' });
      mockUseExpenseCalendar.mockReturnValue({
        ...defaultExpenseCalendarReturn,
        expenses: [expense],
      });

      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('event-exp-1'));

      expect(screen.getByTestId('expense-form-modal')).toHaveAttribute('data-readonly', 'true');
    });

    it('modal shows selected expense data', async () => {
      const user = userEvent.setup();
      const expense = createMockExpense({ id: 'exp-1', description: 'Test Expense' });
      mockUseExpenseCalendar.mockReturnValue({
        ...defaultExpenseCalendarReturn,
        expenses: [expense],
      });

      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('event-exp-1'));

      expect(screen.getByTestId('modal-expense-id')).toHaveTextContent('exp-1');
    });
  });

  describe('modal - close', () => {
    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Nova despesa'));
      expect(screen.getByTestId('expense-form-modal')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Fechar modal'));
      expect(screen.queryByTestId('expense-form-modal')).not.toBeInTheDocument();
    });
  });

  describe('modal - success', () => {
    it('closes modal after successful expense creation', async () => {
      const user = userEvent.setup();
      render(<CalendarPage />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Nova despesa'));
      expect(screen.getByTestId('expense-form-modal')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Confirmar'));
      expect(screen.queryByTestId('expense-form-modal')).not.toBeInTheDocument();
    });
  });
});
