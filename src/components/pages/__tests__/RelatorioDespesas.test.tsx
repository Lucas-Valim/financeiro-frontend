import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { RelatorioDespesas } from '../RelatorioDespesas';
import type { ExpenseReportSummary, ReportFilter } from '@/types/reports';
import { useExpenseReportSummary } from '@/hooks/use-expense-report-summary';
import { useExportExpenseReport } from '@/hooks/use-export-expense-report';
import { useCategories } from '@/hooks/use-categories';
import { useFavorecidos } from '@/hooks/use-favorecidos';

vi.mock('@/hooks/use-expense-report-summary', () => ({
  useExpenseReportSummary: vi.fn(),
}));
vi.mock('@/hooks/use-export-expense-report', () => ({
  useExportExpenseReport: vi.fn(),
}));
vi.mock('@/hooks/use-categories', () => ({ useCategories: vi.fn() }));
vi.mock('@/hooks/use-favorecidos', () => ({ useFavorecidos: vi.fn() }));

const mockUseSummary = vi.mocked(useExpenseReportSummary);
const mockUseExport = vi.mocked(useExportExpenseReport);
const mockUseCategories = vi.mocked(useCategories);
const mockUseFavorecidos = vi.mocked(useFavorecidos);

function buildSummary(
  overrides: Partial<ExpenseReportSummary> = {}
): ExpenseReportSummary {
  return {
    expenseCount: 42,
    totalAmount: 12480,
    attachmentCount: 97,
    expensesWithoutAttachments: 0,
    exportLimit: 100,
    exceedsLimit: false,
    ...overrides,
  };
}

function currentMonthStart(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
}

/** Summary that varies with the filters so the screen reflects each change. */
function summaryForFilters(filters: ReportFilter): ExpenseReportSummary {
  if (filters.municipality) {
    return buildSummary({ expenseCount: 5 });
  }
  if (
    filters.dueDateStart &&
    format(filters.dueDateStart, 'yyyy-MM-dd') !== currentMonthStart()
  ) {
    return buildSummary({ expenseCount: 7 });
  }
  return buildSummary({ expenseCount: 42 });
}

const exportReportSpy = vi.fn();

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('RelatorioDespesas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCategories.mockReturnValue({
      categories: [],
      isLoading: false,
      error: null,
    });
    mockUseFavorecidos.mockReturnValue({
      favorecidos: [],
      isLoading: false,
      error: null,
    });
    mockUseExport.mockReturnValue({
      exportReport: exportReportSpy,
      isExporting: false,
      receivedBytes: 0,
    });
    mockUseSummary.mockImplementation((filters: ReportFilter) => ({
      summary: summaryForFilters(filters),
      isLoading: false,
      error: null,
    }));
  });

  it('renderiza a tela pronta para exportar o mês corrente', () => {
    render(<RelatorioDespesas />, { wrapper });

    expect(screen.getByText('Relatório de Despesas')).toBeInTheDocument();
    expect(screen.getByTestId('summary-expense-count')).toHaveTextContent('42');
    expect(screen.getByTestId('export-button')).toBeEnabled();
  });

  it('atualiza os dados do resumo quando um filtro do painel muda', async () => {
    render(<RelatorioDespesas />, { wrapper });

    expect(screen.getByTestId('summary-expense-count')).toHaveTextContent('42');

    fireEvent.change(screen.getByLabelText('Município'), {
      target: { value: 'Porto Alegre' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('summary-expense-count')).toHaveTextContent('5');
    });
  });

  it('exibe o estado de carregamento enquanto a consulta do resumo está pendente', () => {
    mockUseSummary.mockReturnValue({
      summary: undefined,
      isLoading: true,
      error: null,
    });

    render(<RelatorioDespesas />, { wrapper });

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('renderiza o estado de erro com ação de tentar novamente', () => {
    mockUseSummary.mockReturnValue({
      summary: undefined,
      isLoading: false,
      error: new Error('Falha ao carregar'),
    });

    render(<RelatorioDespesas />, { wrapper });

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: 'Tentar Novamente' });
    expect(retry).toBeInTheDocument();
    fireEvent.click(retry);
  });

  it('preserva os filtros preenchidos e permite nova tentativa após uma exportação', () => {
    render(<RelatorioDespesas />, { wrapper });

    const municipality = screen.getByLabelText('Município');
    fireEvent.change(municipality, { target: { value: 'Porto Alegre' } });

    fireEvent.click(screen.getByTestId('export-button'));
    expect(exportReportSpy).toHaveBeenCalledWith(
      expect.objectContaining({ municipality: 'Porto Alegre' })
    );

    // A failed export is handled inside the hook and never touches page state,
    // so the filters remain filled and the action stays available for retry.
    expect(municipality).toHaveValue('Porto Alegre');
    expect(screen.getByTestId('export-button')).toBeEnabled();
  });

  it('percorre o fluxo: abrir, ajustar o intervalo de datas, ver o resumo mudar e exportar', async () => {
    render(<RelatorioDespesas />, { wrapper });

    expect(screen.getByTestId('summary-expense-count')).toHaveTextContent('42');

    const otherDay = format(
      new Date(new Date().getFullYear(), new Date().getMonth(), 10),
      'yyyy-MM-dd'
    );
    fireEvent.change(screen.getByTestId('filter-due-date-start'), {
      target: { value: otherDay },
    });

    await waitFor(() => {
      expect(screen.getByTestId('summary-expense-count')).toHaveTextContent('7');
    });

    fireEvent.click(screen.getByTestId('export-button'));
    expect(exportReportSpy).toHaveBeenCalledTimes(1);
  });

  it('mantém a tela utilizável com exportação desabilitada e explicação quando o recorte é vazio', () => {
    mockUseSummary.mockReturnValue({
      summary: buildSummary({ expenseCount: 0 }),
      isLoading: false,
      error: null,
    });

    render(<RelatorioDespesas />, { wrapper });

    expect(screen.getByTestId('report-filter-panel')).toBeInTheDocument();
    expect(screen.getByTestId('export-button')).toBeDisabled();
    expect(screen.getByTestId('export-explanation')).toHaveTextContent(
      'Nenhuma despesa'
    );
  });
});
