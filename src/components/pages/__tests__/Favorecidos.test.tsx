import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Favorecidos } from '../Favorecidos';
import type { FavorecidoDTO } from '@/types/favorecidos';
import { ORGANIZATION_ID } from '@/constants/expenses';

const mockUseFavorecidos = vi.fn();
vi.mock('@/hooks/use-favorecidos', () => ({
  useFavorecidos: (...args: unknown[]) => mockUseFavorecidos(...args),
}));

const mockFormModal = vi.fn();
vi.mock('@/components/favorecidos/FavorecidoFormModal', () => ({
  FavorecidoFormModal: (props: {
    isOpen: boolean;
    onClose: () => void;
    favorecido?: FavorecidoDTO | null;
  }) => {
    mockFormModal(props);
    if (!props.isOpen) return null;
    return (
      <div data-testid="favorecido-form-modal" role="dialog">
        <span data-testid="form-modal-mode">
          {props.favorecido ? 'edit' : 'create'}
        </span>
        <span data-testid="form-modal-favorecido-id">
          {props.favorecido?.id ?? 'null'}
        </span>
        <button type="button" data-testid="form-modal-close" onClick={props.onClose}>
          Close
        </button>
      </div>
    );
  },
}));

const mockDeleteDialog = vi.fn();
vi.mock('@/components/favorecidos/FavorecidoDeleteDialog', () => ({
  FavorecidoDeleteDialog: (props: {
    isOpen: boolean;
    onClose: () => void;
    favorecido: FavorecidoDTO;
  }) => {
    mockDeleteDialog(props);
    if (!props.isOpen) return null;
    return (
      <div data-testid="favorecido-delete-dialog" role="dialog">
        <span data-testid="delete-dialog-favorecido-id">{props.favorecido.id}</span>
        <button type="button" data-testid="delete-dialog-close" onClick={props.onClose}>
          Close
        </button>
      </div>
    );
  },
}));

function buildFavorecido(overrides: Partial<FavorecidoDTO> = {}): FavorecidoDTO {
  return {
    id: 'fav-default',
    organizationId: 'org-1',
    name: 'Default',
    document: '12345678901',
    documentType: 'CPF',
    zipCode: null,
    street: null,
    number: null,
    city: null,
    state: null,
    phone: null,
    email: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderFavorecidos() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<Favorecidos />, { wrapper });
}

/** Counts data rows in the canonical desktop table (excludes the header row). */
function desktopRowCount() {
  const table = screen.getByTestId('favorecidos-table');
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

describe('Favorecidos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title and description', () => {
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      expect(screen.getByText('Gerenciamento de Favorecidos')).toBeInTheDocument();
      expect(
        screen.getByText('Gerencie os favorecidos utilizados no lançamento de despesas')
      ).toBeInTheDocument();
    });

    it('renders one row per favorecido returned by useFavorecidos', () => {
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [
          buildFavorecido({ id: 'a', name: 'João Silva' }),
          buildFavorecido({ id: 'b', name: 'Maria Santos' }),
          buildFavorecido({ id: 'c', name: 'Empresa XYZ' }),
        ],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      expect(desktopRowCount()).toBe(3);
      expect(screen.getAllByText('João Silva').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Maria Santos').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Empresa XYZ').length).toBeGreaterThanOrEqual(1);
    });

    it('invokes useFavorecidos with the ORGANIZATION_ID constant', () => {
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      expect(mockUseFavorecidos).toHaveBeenCalledWith(ORGANIZATION_ID);
    });
  });

  describe('loading state', () => {
    it('shows the loading spinner when isLoading is true and no favorecidos are cached yet', () => {
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [],
        isLoading: true,
        error: null,
      });

      renderFavorecidos();

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Carregando favorecidos...')).toBeInTheDocument();
    });

    it('does not render the empty state while loading', () => {
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [],
        isLoading: true,
        error: null,
      });

      renderFavorecidos();

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('shows "Nenhum favorecido encontrado" when the list is empty and no filter is active', () => {
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Nenhum favorecido encontrado')).toBeInTheDocument();
    });
  });

  describe('filtering by name', () => {
    it('narrows the displayed rows to substring matches (case-insensitive)', async () => {
      const user = userEvent.setup();
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [
          buildFavorecido({ id: 'a', name: 'João Silva' }),
          buildFavorecido({ id: 'b', name: 'Maria Santos' }),
        ],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.type(input, 'João');

      expect(screen.getAllByText('João Silva').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
    });

    it('shows "Nenhum favorecido encontrado" when the filter excludes every favorecido', async () => {
      const user = userEvent.setup();
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [buildFavorecido({ id: 'a', name: 'João Silva' })],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.type(input, 'XYZ');

      expect(screen.getByTestId('favorecidos-no-results')).toBeInTheDocument();
    });
  });

  describe('filtering by document', () => {
    it('narrows the displayed rows to document matches', async () => {
      const user = userEvent.setup();
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [
          buildFavorecido({ id: 'a', name: 'João', document: '12345678901' }),
          buildFavorecido({ id: 'b', name: 'Maria', document: '98765432100' }),
        ],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por CPF/CNPJ');
      await user.type(input, '123');

      expect(screen.getAllByText('João').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Maria')).not.toBeInTheDocument();
    });
  });

  describe('filter badge', () => {
    it('shows the filter badge when a filter is active', async () => {
      const user = userEvent.setup();
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [buildFavorecido({ id: 'a', name: 'João' })],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      expect(screen.queryByTestId('filter-badge')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.type(input, 'J');

      expect(screen.getByTestId('filter-badge')).toBeInTheDocument();
    });

    it('hides the filter badge after clicking "Limpar filtros"', async () => {
      const user = userEvent.setup();
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [buildFavorecido({ id: 'a', name: 'João' })],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      await user.click(screen.getByTestId('filter-button'));
      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.type(input, 'J');
      expect(screen.getByTestId('filter-badge')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /limpar filtros/i }));

      expect(screen.queryByTestId('filter-badge')).not.toBeInTheDocument();
    });
  });

  describe('FavorecidoFormModal integration', () => {
    it('opens the form modal in create mode when "Novo Favorecido" is clicked', async () => {
      const user = userEvent.setup();
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      expect(screen.queryByTestId('favorecido-form-modal')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('create-favorecido-button'));

      expect(screen.getByTestId('favorecido-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('create');
      expect(screen.getByTestId('form-modal-favorecido-id')).toHaveTextContent('null');
    });

    it('opens the form modal pre-filled with the selected favorecido when the edit icon is clicked', async () => {
      const user = userEvent.setup();
      const target = buildFavorecido({ id: 'fav-2', name: 'Maria Santos' });
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [
          buildFavorecido({ id: 'fav-1', name: 'João Silva' }),
          target,
        ],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      await selectRowAction(user, 'Maria Santos', 'Editar');

      expect(screen.getByTestId('favorecido-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('edit');
      expect(screen.getByTestId('form-modal-favorecido-id')).toHaveTextContent('fav-2');
    });

    it('closes the form modal when onClose is invoked', async () => {
      const user = userEvent.setup();
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      await user.click(screen.getByTestId('create-favorecido-button'));
      expect(screen.getByTestId('favorecido-form-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('form-modal-close'));
      expect(screen.queryByTestId('favorecido-form-modal')).not.toBeInTheDocument();
    });

    it('resets selectedFavorecido to null after closing the edit modal', async () => {
      const user = userEvent.setup();
      const target = buildFavorecido({ id: 'fav-1', name: 'João Silva' });
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [target],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      await selectRowAction(user, 'João Silva', 'Editar');
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('edit');

      await user.click(screen.getByTestId('form-modal-close'));
      expect(screen.queryByTestId('favorecido-form-modal')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('create-favorecido-button'));
      expect(screen.getByTestId('form-modal-mode')).toHaveTextContent('create');
      expect(screen.getByTestId('form-modal-favorecido-id')).toHaveTextContent('null');
    });
  });

  describe('FavorecidoDeleteDialog integration', () => {
    it('opens the delete dialog with the selected favorecido when the delete icon is clicked', async () => {
      const user = userEvent.setup();
      const target = buildFavorecido({ id: 'fav-2', name: 'Maria Santos' });
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [
          buildFavorecido({ id: 'fav-1', name: 'João Silva' }),
          target,
        ],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      await selectRowAction(user, 'Maria Santos', 'Excluir');

      expect(screen.getByTestId('favorecido-delete-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('delete-dialog-favorecido-id')).toHaveTextContent('fav-2');
    });

    it('closes the delete dialog when onClose is invoked', async () => {
      const user = userEvent.setup();
      const target = buildFavorecido({ id: 'fav-1', name: 'João Silva' });
      mockUseFavorecidos.mockReturnValue({
        favorecidos: [target],
        isLoading: false,
        error: null,
      });

      renderFavorecidos();

      await selectRowAction(user, 'João Silva', 'Excluir');
      expect(screen.getByTestId('favorecido-delete-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('delete-dialog-close'));
      expect(screen.queryByTestId('favorecido-delete-dialog')).not.toBeInTheDocument();
    });
  });
});
