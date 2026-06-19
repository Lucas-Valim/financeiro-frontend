import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
  FavorecidoFilterModal,
  type FavorecidoFilter,
} from '../FavorecidoFilterModal';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: ReactNode;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog">
        <button data-testid="dialog-dismiss" onClick={() => onOpenChange?.(false)} />
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

const EMPTY_FILTER: FavorecidoFilter = { name: '', document: '' };
const ACTIVE_FILTER_NAME: FavorecidoFilter = { name: 'João', document: '' };
const ACTIVE_FILTER_DOC: FavorecidoFilter = { name: '', document: '123456' };
const ACTIVE_FILTER_BOTH: FavorecidoFilter = { name: 'João', document: '123456' };

describe('FavorecidoFilterModal', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('controlled input', () => {
    it('renders the current filter.name value in the name input', () => {
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER_NAME}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nome')).toHaveValue('João');
    });

    it('renders the current filter.document value in the document input', () => {
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER_DOC}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Buscar por CPF/CNPJ')).toHaveValue('123456');
    });

    it('renders empty inputs when filter is empty', () => {
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nome')).toHaveValue('');
      expect(screen.getByPlaceholderText('Buscar por CPF/CNPJ')).toHaveValue('');
    });
  });

  describe('input change propagation', () => {
    it('calls onFilterChange when name input changes', async () => {
      const onFilterChange = vi.fn();
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={onFilterChange}
        />
      );

      await user.type(screen.getByPlaceholderText('Buscar por nome'), 'Jo');

      expect(onFilterChange).toHaveBeenCalledTimes(2);
      expect(onFilterChange).toHaveBeenNthCalledWith(1, { name: 'J', document: '' });
      expect(onFilterChange).toHaveBeenNthCalledWith(2, { name: 'o', document: '' });
    });

    it('calls onFilterChange when document input changes', async () => {
      const onFilterChange = vi.fn();
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={onFilterChange}
        />
      );

      await user.type(screen.getByPlaceholderText('Buscar por CPF/CNPJ'), '12');

      expect(onFilterChange).toHaveBeenCalledTimes(2);
      expect(onFilterChange).toHaveBeenNthCalledWith(1, { name: '', document: '1' });
      expect(onFilterChange).toHaveBeenNthCalledWith(2, { name: '', document: '2' });
    });
  });

  describe('"Limpar filtros" control', () => {
    it('does not render "Limpar filtros" when filter is empty', () => {
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(
        screen.queryByRole('button', { name: /limpar filtros/i })
      ).not.toBeInTheDocument();
    });

    it('renders "Limpar filtros" when filter has name', () => {
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER_NAME}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
    });

    it('renders "Limpar filtros" when filter has document', () => {
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER_DOC}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
    });

    it('calls onFilterChange with empty filter when "Limpar filtros" is clicked', async () => {
      const onFilterChange = vi.fn();
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER_BOTH}
          onFilterChange={onFilterChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /limpar filtros/i }));

      expect(onFilterChange).toHaveBeenCalledWith({ name: '', document: '' });
    });
  });

  describe('active filter indicator', () => {
    it('renders "Filtro ativo" badge when filter is active', () => {
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER_NAME}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('filter-active-badge')).toBeInTheDocument();
    });

    it('does not render the badge when filter is empty', () => {
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.queryByTestId('filter-active-badge')).not.toBeInTheDocument();
    });
  });

  describe('modal dismiss', () => {
    it('calls onClose when the dialog is dismissed via onOpenChange(false)', async () => {
      const onClose = vi.fn();
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={onClose}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('dialog-dismiss'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when "Fechar" button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <FavorecidoFilterModal
          isOpen
          onClose={onClose}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /fechar/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('closed state', () => {
    it('does not render when isOpen is false', () => {
      render(
        <FavorecidoFilterModal
          isOpen={false}
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('integration: parent state changes reflect in inputs', () => {
    it('updates both inputs when the parent passes a new filter prop', () => {
      const { rerender } = render(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nome')).toHaveValue('');
      expect(screen.getByPlaceholderText('Buscar por CPF/CNPJ')).toHaveValue('');

      rerender(
        <FavorecidoFilterModal
          isOpen
          onClose={vi.fn()}
          filter={{ name: 'Maria', document: '987654' }}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nome')).toHaveValue('Maria');
      expect(screen.getByPlaceholderText('Buscar por CPF/CNPJ')).toHaveValue('987654');
    });
  });
});
