import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ReportFilterPanel } from '../ReportFilterPanel';
import { getDefaultReportFilters } from '@/constants/reports';
import type { ReportFilter } from '@/types/reports';
import type { CategoryDTO } from '@/types/categories';
import type { FavorecidoDTO } from '@/types/favorecidos';
import { useCategories } from '@/hooks/use-categories';
import { useFavorecidos } from '@/hooks/use-favorecidos';

vi.mock('@/hooks/use-categories', () => ({ useCategories: vi.fn() }));
vi.mock('@/hooks/use-favorecidos', () => ({ useFavorecidos: vi.fn() }));

const mockUseCategories = vi.mocked(useCategories);
const mockUseFavorecidos = vi.mocked(useFavorecidos);

const CATEGORIES: CategoryDTO[] = [
  {
    id: 'cat-1',
    organizationId: 'org-1',
    name: 'Aluguel',
    description: '',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'cat-2',
    organizationId: 'org-1',
    name: 'Energia',
    description: '',
    createdAt: '',
    updatedAt: '',
  },
];

const FAVORECIDOS: FavorecidoDTO[] = [
  {
    id: 'fav-1',
    organizationId: 'org-1',
    name: 'Imobiliária Silva',
    document: null,
    documentType: null,
    zipCode: null,
    street: null,
    number: null,
    city: null,
    state: null,
    phone: null,
    email: null,
    createdAt: '',
    updatedAt: '',
  },
];

function currentMonthStart(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
}

function currentMonthEnd(): string {
  return format(endOfMonth(new Date()), 'yyyy-MM-dd');
}

/** Stateful harness mirroring how the page owns the filter state. */
function ControlledPanel() {
  const [filters, setFilters] = useState<ReportFilter>(getDefaultReportFilters);
  return (
    <ReportFilterPanel
      filters={filters}
      onFiltersChange={setFilters}
      onClear={() => setFilters(getDefaultReportFilters())}
    />
  );
}

describe('ReportFilterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCategories.mockReturnValue({
      categories: CATEGORIES,
      isLoading: false,
      error: null,
    });
    mockUseFavorecidos.mockReturnValue({
      favorecidos: FAVORECIDOS,
      isLoading: false,
      error: null,
    });
  });

  it('pré-preenche o intervalo com o primeiro e o último dia do mês corrente na montagem', () => {
    render(<ControlledPanel />);

    expect(screen.getByTestId('filter-due-date-start')).toHaveValue(
      currentMonthStart()
    );
    expect(screen.getByTestId('filter-due-date-end')).toHaveValue(
      currentMonthEnd()
    );
  });

  it('não seleciona nenhum status na montagem', () => {
    render(<ControlledPanel />);

    expect(screen.getByTestId('filter-status')).toHaveTextContent(
      'Todos os status'
    );
  });

  it('restaura o mês corrente e remove o status ao limpar os filtros', async () => {
    const user = userEvent.setup();
    render(<ControlledPanel />);

    await user.click(screen.getByTestId('filter-status'));
    await user.click(screen.getByRole('option', { name: 'Paga' }));
    expect(screen.getByTestId('filter-status')).toHaveTextContent('Paga');

    await user.click(screen.getByTestId('clear-filters-button'));

    expect(screen.getByTestId('filter-status')).toHaveTextContent(
      'Todos os status'
    );
    expect(screen.getByTestId('filter-due-date-start')).toHaveValue(
      currentMonthStart()
    );
    expect(screen.getByTestId('filter-due-date-end')).toHaveValue(
      currentMonthEnd()
    );
  });

  it('dispara a mudança de filtro com o categoryId ao selecionar uma categoria', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(
      <ReportFilterPanel
        filters={getDefaultReportFilters()}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />
    );

    await user.click(screen.getByTestId('filter-category'));
    await user.click(screen.getByRole('option', { name: 'Aluguel' }));

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-1' })
    );
  });

  it('mapeia o favorecido selecionado para o filtro receiver com o nome correspondente', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(
      <ReportFilterPanel
        filters={getDefaultReportFilters()}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'Favorecido' }));
    await user.click(screen.getByText('Imobiliária Silva'));

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ receiver: 'Imobiliária Silva' })
    );
  });

  it('dispara a mudança de filtro ao digitar um município', () => {
    const onFiltersChange = vi.fn();
    render(
      <ReportFilterPanel
        filters={getDefaultReportFilters()}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Município'), {
      target: { value: 'Porto Alegre' },
    });

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ municipality: 'Porto Alegre' })
    );
  });

  it('dispara a mudança de filtro ao selecionar uma forma de pagamento', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(
      <ReportFilterPanel
        filters={getDefaultReportFilters()}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />
    );

    await user.click(screen.getByTestId('filter-payment-method'));
    await user.click(screen.getByRole('option', { name: 'PIX' }));

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: 'PIX' })
    );
  });

  it('dispara a mudança de filtro ao alterar o fim do intervalo de vencimento', () => {
    const onFiltersChange = vi.fn();
    render(
      <ReportFilterPanel
        filters={getDefaultReportFilters()}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />
    );

    fireEvent.change(screen.getByTestId('filter-due-date-end'), {
      target: { value: '2026-08-20' },
    });

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dueDateEnd: expect.any(Date),
      })
    );
  });

  it('lista as opções de categoria e favorecido vindas dos hooks, não de listas fixas', async () => {
    const user = userEvent.setup();
    render(<ControlledPanel />);

    await user.click(screen.getByTestId('filter-category'));
    expect(screen.getByRole('option', { name: 'Aluguel' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Energia' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Aluguel' }));

    await user.click(screen.getByRole('combobox', { name: 'Favorecido' }));
    expect(screen.getByText('Imobiliária Silva')).toBeInTheDocument();
  });
});
