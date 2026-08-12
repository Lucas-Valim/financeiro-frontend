import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseFilterFields } from '../ExpenseFilterFields';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseFilter } from '@/types/expenses';
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
];

const FAVORECIDOS: FavorecidoDTO[] = [
  {
    id: 'fav-1',
    organizationId: 'org-1',
    name: 'Imobiliária Silva',
    document: '12345678000199',
    documentType: 'CNPJ',
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

function renderFields(filters: ExpenseFilter = {}) {
  const onChange = vi.fn();
  render(<ExpenseFilterFields filters={filters} onChange={onChange} />);
  return { onChange };
}

describe('ExpenseFilterFields', () => {
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

  it('renderiza os seis campos de filtro', () => {
    renderFields();

    expect(screen.getByTestId('filter-status')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Favorecido' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Município')).toBeInTheDocument();
    expect(screen.getByTestId('filter-payment-method')).toBeInTheDocument();
    expect(screen.getByTestId('filter-category')).toBeInTheDocument();
    expect(screen.getByTestId('filter-due-date-start')).toBeInTheDocument();
    expect(screen.getByTestId('filter-due-date-end')).toBeInTheDocument();
  });

  it('exibe as opções "todos" quando nenhum filtro está aplicado', () => {
    renderFields();

    expect(screen.getByTestId('filter-status')).toHaveTextContent(
      'Todos os status'
    );
    expect(screen.getByTestId('filter-payment-method')).toHaveTextContent(
      'Todas as formas'
    );
    expect(screen.getByTestId('filter-category')).toHaveTextContent(
      'Todas as categorias'
    );
  });

  it('emite o status selecionado', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFields();

    await user.click(screen.getByTestId('filter-status'));
    await user.click(screen.getByRole('option', { name: 'Paga' }));

    expect(onChange).toHaveBeenCalledWith({ status: ExpenseStatus.PAID });
  });

  it('emite status indefinido ao escolher "Todos os status"', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFields({ status: ExpenseStatus.PAID });

    await user.click(screen.getByTestId('filter-status'));
    await user.click(screen.getByRole('option', { name: 'Todos os status' }));

    expect(onChange).toHaveBeenCalledWith({ status: undefined });
  });

  it('mapeia o favorecido selecionado para o filtro receiver com o nome', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFields();

    await user.click(screen.getByRole('combobox', { name: 'Favorecido' }));
    await user.click(screen.getByText('Imobiliária Silva'));

    expect(onChange).toHaveBeenCalledWith({ receiver: 'Imobiliária Silva' });
  });

  it('permite buscar o favorecido pelo documento formatado', async () => {
    const user = userEvent.setup();
    renderFields();

    await user.click(screen.getByRole('combobox', { name: 'Favorecido' }));
    await user.type(
      screen.getByPlaceholderText('Buscar por nome ou documento...'),
      '12.345.678'
    );

    expect(screen.getByText('Imobiliária Silva')).toBeInTheDocument();
  });

  it('emite o município digitado', () => {
    const { onChange } = renderFields();

    fireEvent.change(screen.getByLabelText('Município'), {
      target: { value: 'Porto Alegre' },
    });

    expect(onChange).toHaveBeenCalledWith({ municipality: 'Porto Alegre' });
  });

  it('emite município indefinido quando o campo é esvaziado', () => {
    const { onChange } = renderFields({ municipality: 'Porto Alegre' });

    fireEvent.change(screen.getByLabelText('Município'), {
      target: { value: '' },
    });

    expect(onChange).toHaveBeenCalledWith({ municipality: undefined });
  });

  it('emite a forma de pagamento selecionada', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFields();

    await user.click(screen.getByTestId('filter-payment-method'));
    await user.click(screen.getByRole('option', { name: 'PIX' }));

    expect(onChange).toHaveBeenCalledWith({ paymentMethod: 'PIX' });
  });

  it('emite forma de pagamento indefinida ao escolher "Todas as formas"', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFields({ paymentMethod: 'PIX' });

    await user.click(screen.getByTestId('filter-payment-method'));
    await user.click(screen.getByRole('option', { name: 'Todas as formas' }));

    expect(onChange).toHaveBeenCalledWith({ paymentMethod: undefined });
  });

  it('emite o categoryId da categoria selecionada', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFields();

    await user.click(screen.getByTestId('filter-category'));
    await user.click(screen.getByRole('option', { name: 'Aluguel' }));

    expect(onChange).toHaveBeenCalledWith({ categoryId: 'cat-1' });
  });

  it('emite Date ao alterar o intervalo de vencimento', () => {
    const { onChange } = renderFields();

    fireEvent.change(screen.getByTestId('filter-due-date-start'), {
      target: { value: '2026-08-01' },
    });

    expect(onChange).toHaveBeenCalledWith({
      dueDateStart: new Date(2026, 7, 1),
    });
  });

  it('emite data indefinida quando o campo de data é esvaziado', () => {
    const { onChange } = renderFields({ dueDateEnd: new Date(2026, 7, 31) });

    fireEvent.change(screen.getByTestId('filter-due-date-end'), {
      target: { value: '' },
    });

    expect(onChange).toHaveBeenCalledWith({ dueDateEnd: undefined });
  });

  it('preenche os campos com os filtros recebidos', () => {
    renderFields({
      status: ExpenseStatus.OVERDUE,
      receiver: 'Imobiliária Silva',
      municipality: 'Caxias do Sul',
      paymentMethod: 'Boleto',
      categoryId: 'cat-1',
      dueDateStart: new Date(2026, 0, 15),
      dueDateEnd: new Date(2026, 5, 30),
    });

    expect(screen.getByTestId('filter-status')).toHaveTextContent('Atrasada');
    expect(
      screen.getByRole('combobox', { name: 'Favorecido' })
    ).toHaveTextContent('Imobiliária Silva');
    expect(screen.getByLabelText('Município')).toHaveValue('Caxias do Sul');
    expect(screen.getByTestId('filter-payment-method')).toHaveTextContent(
      'Boleto'
    );
    expect(screen.getByTestId('filter-category')).toHaveTextContent('Aluguel');
    expect(screen.getByTestId('filter-due-date-start')).toHaveValue(
      '2026-01-15'
    );
    expect(screen.getByTestId('filter-due-date-end')).toHaveValue('2026-06-30');
  });

  it('mantém o combobox vazio quando o receiver não corresponde a nenhum favorecido', () => {
    renderFields({ receiver: 'Nome antigo digitado à mão' });

    expect(
      screen.getByRole('combobox', { name: 'Favorecido' })
    ).toHaveTextContent('Todos os favorecidos');
  });

  it('desabilita o select de categoria enquanto as categorias carregam', () => {
    mockUseCategories.mockReturnValue({
      categories: [],
      isLoading: true,
      error: null,
    });

    renderFields();

    expect(screen.getByTestId('filter-category')).toBeDisabled();
  });
});
