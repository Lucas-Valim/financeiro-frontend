import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/Sidebar';
import { Despesa } from '@/components/pages/Despesa';
import { Recorrencias } from '@/components/pages/Recorrencias';
import type { ExpenseDTO } from '@/types/expenses';

// Captura o navigate real disparado pelo ponto de entrada secundário. O mock global
// de setup.ts devolve um vi.fn() novo a cada chamada, então sobrescrevemos aqui com
// um spy estável — preservando Link/useLocation/Outlet usados na árvore.
const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }));

vi.mock('@tanstack/react-router', () => ({
  Outlet: () => null,
  useLocation: () => ({ pathname: '/', search: {}, hash: '', state: null, key: 'default' }),
  useNavigate: () => navigateSpy,
  Link: ({
    to,
    children,
    ...props
  }: React.PropsWithChildren<{ to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) =>
    React.createElement('a', { href: to, 'data-to': to, ...props }, children),
}));

// Modais pesados de Despesa: mockados como em Despesa.test para focar na navegação.
vi.mock('@/components/expenses/ExpenseFormModal', () => ({
  ExpenseFormModal: () => null,
}));

const mockUseExpenses = vi.fn();
vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: (...args: unknown[]) => mockUseExpenses(...args),
}));

const mockUseExpensesSummary = vi.fn();
vi.mock('@/hooks/use-expenses-summary', () => ({
  useExpensesSummary: (...args: unknown[]) => mockUseExpensesSummary(...args),
}));

vi.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({ categories: [], isLoading: false, error: null }),
}));

vi.mock('@/hooks/use-favorecidos', () => ({
  useFavorecidos: () => ({
    favorecidos: [{ id: 'fav-1', name: 'Favorecido Um' }],
    isLoading: false,
    error: null,
  }),
}));

// Recorrencias: hook de listagem e diálogos mockados (o miolo é coberto pelas tasks 06/07).
const mockUseRecurringExpenses = vi.fn();
vi.mock('@/hooks/use-recurring-expenses', () => ({
  useRecurringExpenses: () => mockUseRecurringExpenses(),
}));

vi.mock('@/components/recurring-expenses/RecurringExpenseFormModal', () => ({
  RecurringExpenseFormModal: ({
    isOpen,
    recurringExpense,
    readOnly,
  }: {
    isOpen: boolean;
    recurringExpense?: unknown;
    readOnly?: boolean;
  }) => {
    if (!isOpen) return null;
    const mode = readOnly ? 'readonly' : recurringExpense ? 'edit' : 'create';
    return (
      <div data-testid="recurring-form-modal" role="dialog">
        <span data-testid="form-modal-mode">{mode}</span>
      </div>
    );
  },
}));

vi.mock('@/components/recurring-expenses/TerminateRecurringExpenseDialog', () => ({
  TerminateRecurringExpenseDialog: () => null,
}));

const emptyItem = () => ({ count: 0, total: 0, estimatedCount: 0, estimatedTotal: 0 });
const emptySummary = () => ({
  OPEN: emptyItem(),
  OVERDUE: emptyItem(),
  PAID: emptyItem(),
  CANCELLED: emptyItem(),
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Integration: navegação até a área de recorrências', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    mockUseExpenses.mockReturnValue({
      data: [] as ExpenseDTO[],
      total: 0,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      reset: vi.fn(),
    });
    mockUseExpensesSummary.mockReturnValue({
      summary: emptySummary(),
      isLoading: false,
      error: null,
    });
    mockUseRecurringExpenses.mockReturnValue({
      data: [],
      total: 0,
      isTruncated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('Entrada da barra lateral', () => {
    it('expõe "Recorrências" como link para /recorrencias e a página renderiza ao ser montada', () => {
      const { unmount } = render(
        <SidebarProvider defaultOpen={true}>
          <Sidebar currentPath="/despesa" />
        </SidebarProvider>
      );

      // Recorrências é um cadastro: vive dentro do grupo "Cadastros", que fica
      // recolhido fora das suas rotas. Abrir o grupo é o caminho do usuário.
      fireEvent.click(screen.getByRole('button', { name: 'Cadastros' }));

      const recorrenciasLink = screen.getByText('Recorrências').closest('a');
      expect(recorrenciasLink).toHaveAttribute('data-to', '/recorrencias');

      unmount();

      // Navegar até a rota renderiza a página de recorrências.
      render(<Recorrencias />, { wrapper });
      expect(screen.getByText('Recorrências')).toBeInTheDocument();
      expect(
        screen.getByText('Cadastre e acompanhe as despesas que se repetem todo mês')
      ).toBeInTheDocument();
    });
  });

  describe('Ponto de entrada secundário na tela de despesas', () => {
    it('navega para /recorrencias com o formulário aberto (search novo)', async () => {
      const user = userEvent.setup();
      render(<Despesa />, { wrapper });

      await user.click(
        screen.getByRole('button', { name: /nova despesa recorrente/i })
      );

      expect(navigateSpy).toHaveBeenCalledWith({
        to: '/recorrencias',
        search: { novo: true },
      });
    });

    it('a chegada com novo=true abre o formulário de criação na página', () => {
      render(<Recorrencias initialCreateOpen />, { wrapper });

      expect(screen.getByTestId('recurring-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('create');
    });
  });

  describe('Despesa sem regressão após a mudança', () => {
    it('continua renderizando StatusCards, filtros e grid', () => {
      render(<Despesa />, { wrapper });

      expect(screen.getByText('Gerenciamento de Despesas')).toBeInTheDocument();
      expect(screen.getByTestId('filter-button')).toBeInTheDocument();
      expect(screen.getByTestId('new-recurring-expense-button')).toBeInTheDocument();
      expect(screen.getByTestId('status-card-open')).toBeInTheDocument();
      // O grid compartilhado renderiza (estado vazio, sem despesas no mock).
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });
});
