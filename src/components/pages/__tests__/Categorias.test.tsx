import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Categorias } from '../Categorias';
import type { CategoryDTO } from '@/types/categories';
import { ORGANIZATION_ID } from '@/constants/expenses';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockUsePaginatedCategories = vi.fn();
vi.mock('@/hooks/use-paginated-categories', () => ({
  usePaginatedCategories: (...args: unknown[]) => mockUsePaginatedCategories(...args),
}));

const mockFormModal = vi.fn();
vi.mock('@/components/categories/CategoryFormModal', () => ({
  CategoryFormModal: (props: {
    isOpen: boolean;
    onClose: () => void;
    category?: CategoryDTO | null;
  }) => {
    mockFormModal(props);
    if (!props.isOpen) return null;
    return (
      <div data-testid="category-form-modal" role="dialog">
        <span data-testid="form-modal-mode">
          {props.category ? 'edit' : 'create'}
        </span>
        <span data-testid="form-modal-category-id">
          {props.category?.id ?? 'null'}
        </span>
        <button type="button" data-testid="form-modal-close" onClick={props.onClose}>
          Close
        </button>
      </div>
    );
  },
}));

const mockDeleteDialog = vi.fn();
vi.mock('@/components/categories/CategoryDeleteDialog', () => ({
  CategoryDeleteDialog: (props: {
    isOpen: boolean;
    onClose: () => void;
    category: CategoryDTO;
  }) => {
    mockDeleteDialog(props);
    if (!props.isOpen) return null;
    return (
      <div data-testid="category-delete-dialog" role="dialog">
        <span data-testid="delete-dialog-category-id">{props.category.id}</span>
        <button type="button" data-testid="delete-dialog-close" onClick={props.onClose}>
          Close
        </button>
      </div>
    );
  },
}));

// ── Fixtures ────────────────────────────────────────────────────────────────

function buildCategory(overrides: Partial<CategoryDTO> = {}): CategoryDTO {
  return {
    id: 'cat-default',
    organizationId: 'org-1',
    name: 'Default',
    description: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderCategorias() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<Categorias />, { wrapper });
}

/** Counts data rows in the canonical desktop table (excludes the header row). */
function desktopRowCount() {
  const table = screen.getByTestId('categories-table');
  return within(table).getAllByRole('row').length - 1;
}

/** Opens a row's `⋮` menu (desktop instance) and selects the given action. */
async function selectRowAction(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  action: 'Editar' | 'Excluir'
) {
  const triggers = screen.getAllByRole('button', {
    name: new RegExp(`ações de ${name}`, 'i'),
  });
  await user.click(triggers[0]);
  await user.click(screen.getByText(action));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Categorias', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title and description', () => {
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      expect(screen.getByText('Gerenciamento de Categorias')).toBeInTheDocument();
      expect(
        screen.getByText('Organize as categorias utilizadas no lançamento de despesas')
      ).toBeInTheDocument();
    });

    it('renders one row per category returned by usePaginatedCategories', () => {
      mockUsePaginatedCategories.mockReturnValue({
        categories: [
          buildCategory({ id: 'a', name: 'Alimentação' }),
          buildCategory({ id: 'b', name: 'Transporte' }),
          buildCategory({ id: 'c', name: 'Lazer' }),
        ],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      expect(desktopRowCount()).toBe(3);
      expect(screen.getAllByText('Alimentação').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Transporte').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Lazer').length).toBeGreaterThanOrEqual(1);
    });

    it('invokes usePaginatedCategories with the ORGANIZATION_ID constant and an empty filter', () => {
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      expect(mockUsePaginatedCategories).toHaveBeenCalledWith({
        organizationId: ORGANIZATION_ID,
        filter: { name: '' },
      });
    });
  });

  describe('loading state', () => {
    it('shows the loading spinner when isLoading is true and no categories are cached yet', () => {
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: true,
        error: null,
      });

      renderCategorias();

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Carregando categorias...')).toBeInTheDocument();
    });

    it('does not render the empty state while loading', () => {
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: true,
        error: null,
      });

      renderCategorias();

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('shows "Nenhuma categoria cadastrada" when the list is empty and no filter is active', () => {
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(
        screen.getByText('Nenhuma categoria cadastrada. Crie uma agora.')
      ).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders the grid error state instead of the empty state when the request fails', () => {
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: false,
        error: new Error('Erro de rede'),
        refetch: vi.fn(),
      });

      renderCategorias();

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Erro ao carregar categorias')).toBeInTheDocument();
      expect(screen.getByText('Erro de rede')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('retries through the hook refetch when "Tente novamente" is clicked', async () => {
      const user = userEvent.setup();
      const refetch = vi.fn();
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: false,
        error: new Error('Erro de rede'),
        refetch,
      });

      renderCategorias();

      await user.click(screen.getByRole('button', { name: /tente novamente/i }));

      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('pagination', () => {
    it('renders the footer counter with the server total', () => {
      mockUsePaginatedCategories.mockReturnValue({
        categories: [
          buildCategory({ id: 'a', name: 'Alimentação' }),
          buildCategory({ id: 'b', name: 'Transporte' }),
        ],
        total: 25,
        isLoading: false,
        error: null,
        hasMore: true,
        loadMore: vi.fn(),
      });

      renderCategorias();

      expect(
        screen.getAllByText('Mostrando 1-2 de 25 categorias').length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe('filtering', () => {
    it('sends the typed name to usePaginatedCategories so the server filters the list', async () => {
      const user = userEvent.setup();
      mockUsePaginatedCategories.mockReturnValue({
        categories: [buildCategory({ id: 'a', name: 'Alimentação' })],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.type(input, 'Alim');

      expect(mockUsePaginatedCategories).toHaveBeenLastCalledWith({
        organizationId: ORGANIZATION_ID,
        filter: { name: 'Alim' },
      });
    });

    it('shows "Nenhuma categoria encontrada" when the server returns nothing for an active filter', async () => {
      const user = userEvent.setup();
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.type(input, 'XYZ');

      expect(screen.getByTestId('categories-no-results')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma categoria encontrada')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('shows the loading spinner instead of "no results" while the filtered request is in flight', async () => {
      const user = userEvent.setup();
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: true,
        error: null,
      });

      renderCategorias();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.type(input, 'Anything');

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.queryByTestId('categories-no-results')).not.toBeInTheDocument();
    });

    it('shows the filter badge on the filter button when a filter is active', async () => {
      const user = userEvent.setup();
      mockUsePaginatedCategories.mockReturnValue({
        categories: [buildCategory({ id: 'a', name: 'Alimentação' })],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      expect(screen.queryByTestId('filter-badge')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.type(input, 'A');

      expect(screen.getByTestId('filter-badge')).toBeInTheDocument();
    });

    it('hides the filter badge after clicking "Limpar filtros"', async () => {
      const user = userEvent.setup();
      mockUsePaginatedCategories.mockReturnValue({
        categories: [buildCategory({ id: 'a', name: 'Alimentação' })],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.type(input, 'A');
      expect(screen.getByTestId('filter-badge')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /limpar filtros/i }));

      expect(screen.queryByTestId('filter-badge')).not.toBeInTheDocument();
    });
  });

  describe('CategoryFormModal integration', () => {
    it('opens the form modal in create mode when "Nova Categoria" is clicked', async () => {
      const user = userEvent.setup();
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      expect(screen.queryByTestId('category-form-modal')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('create-category-button'));

      expect(screen.getByTestId('category-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('create');
      expect(screen.getByTestId('form-modal-category-id')).toHaveTextContent('null');
    });

    it('opens the form modal pre-filled with the selected category when the edit icon is clicked', async () => {
      const user = userEvent.setup();
      const target = buildCategory({ id: 'cat-2', name: 'Transporte' });
      mockUsePaginatedCategories.mockReturnValue({
        categories: [
          buildCategory({ id: 'cat-1', name: 'Alimentação' }),
          target,
        ],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      await selectRowAction(user, 'Transporte', 'Editar');

      expect(screen.getByTestId('category-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('edit');
      expect(screen.getByTestId('form-modal-category-id')).toHaveTextContent('cat-2');
    });

    it('closes the form modal when onClose is invoked', async () => {
      const user = userEvent.setup();
      mockUsePaginatedCategories.mockReturnValue({
        categories: [],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      await user.click(screen.getByTestId('create-category-button'));
      expect(screen.getByTestId('category-form-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('form-modal-close'));
      expect(screen.queryByTestId('category-form-modal')).not.toBeInTheDocument();
    });

    it('resets selectedCategory to null after closing the edit modal, so the next create opens empty', async () => {
      const user = userEvent.setup();
      const target = buildCategory({ id: 'cat-1', name: 'Alimentação' });
      mockUsePaginatedCategories.mockReturnValue({
        categories: [target],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      await selectRowAction(user, 'Alimentação', 'Editar');
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('edit');

      await user.click(screen.getByTestId('form-modal-close'));
      expect(screen.queryByTestId('category-form-modal')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('create-category-button'));
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('create');
      expect(screen.getByTestId('form-modal-category-id')).toHaveTextContent('null');
    });
  });

  describe('CategoryDeleteDialog integration', () => {
    it('opens the delete dialog with the selected category when the delete icon is clicked', async () => {
      const user = userEvent.setup();
      const target = buildCategory({ id: 'cat-2', name: 'Transporte' });
      mockUsePaginatedCategories.mockReturnValue({
        categories: [
          buildCategory({ id: 'cat-1', name: 'Alimentação' }),
          target,
        ],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      await selectRowAction(user, 'Transporte', 'Excluir');

      expect(screen.getByTestId('category-delete-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('delete-dialog-category-id')).toHaveTextContent('cat-2');
    });

    it('closes the delete dialog when onClose is invoked', async () => {
      const user = userEvent.setup();
      const target = buildCategory({ id: 'cat-1', name: 'Alimentação' });
      mockUsePaginatedCategories.mockReturnValue({
        categories: [target],
        isLoading: false,
        error: null,
      });

      renderCategorias();

      await selectRowAction(user, 'Alimentação', 'Excluir');
      expect(screen.getByTestId('category-delete-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('delete-dialog-close'));
      expect(screen.queryByTestId('category-delete-dialog')).not.toBeInTheDocument();
    });
  });
});
