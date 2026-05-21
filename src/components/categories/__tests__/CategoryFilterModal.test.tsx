import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
  CategoryFilterModal,
  type CategoryFilter,
} from '../CategoryFilterModal';

// ── Mocks ──────────────────────────────────────────────────────────────────

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
        {/* Simulates Escape / backdrop dismiss */}
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

// ── Fixtures ────────────────────────────────────────────────────────────────

const EMPTY_FILTER: CategoryFilter = { name: '' };
const ACTIVE_FILTER: CategoryFilter = { name: 'Alimentação' };

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CategoryFilterModal', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('controlled input', () => {
    it('renders the current filter.name value in the input', () => {
      render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nome')).toHaveValue(
        ACTIVE_FILTER.name
      );
    });

    it('renders an empty input when filter.name is ""', () => {
      render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nome')).toHaveValue('');
    });
  });

  describe('input change propagation', () => {
    it('calls onFilterChange with { name: "<typed>" } on every keystroke', async () => {
      const onFilterChange = vi.fn();
      render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={onFilterChange}
        />
      );

      await user.type(screen.getByPlaceholderText('Buscar por nome'), 'Ali');

      // userEvent.type fires one event per character
      expect(onFilterChange).toHaveBeenCalledTimes(3);
      expect(onFilterChange).toHaveBeenNthCalledWith(1, { name: 'A' });
      expect(onFilterChange).toHaveBeenNthCalledWith(2, { name: 'l' });
      expect(onFilterChange).toHaveBeenNthCalledWith(3, { name: 'i' });
    });

    it('propagates the full input value when changed programmatically', async () => {
      const onFilterChange = vi.fn();
      render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={{ name: 'Alim' }}
          onFilterChange={onFilterChange}
        />
      );

      const input = screen.getByPlaceholderText('Buscar por nome');
      await user.clear(input);

      expect(onFilterChange).toHaveBeenLastCalledWith({ name: '' });
    });
  });

  describe('"Limpar filtros" control', () => {
    it('does not render "Limpar filtros" when filter.name is ""', () => {
      render(
        <CategoryFilterModal
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

    it('renders "Limpar filtros" when filter.name is non-empty', () => {
      render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(
        screen.getByRole('button', { name: /limpar filtros/i })
      ).toBeInTheDocument();
    });

    it('calls onFilterChange({ name: "" }) when "Limpar filtros" is clicked', async () => {
      const onFilterChange = vi.fn();
      render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER}
          onFilterChange={onFilterChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /limpar filtros/i }));

      expect(onFilterChange).toHaveBeenCalledTimes(1);
      expect(onFilterChange).toHaveBeenCalledWith({ name: '' });
    });
  });

  describe('active filter indicator', () => {
    it('renders a "Filtro ativo" badge when filter.name is non-empty', () => {
      render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={ACTIVE_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('filter-active-badge')).toBeInTheDocument();
    });

    it('does not render the badge when filter.name is ""', () => {
      render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.queryByTestId('filter-active-badge')).not.toBeInTheDocument();
    });
  });

  describe('modal dismiss (Escape / backdrop)', () => {
    it('calls onClose when the dialog is dismissed via onOpenChange(false)', async () => {
      const onClose = vi.fn();
      render(
        <CategoryFilterModal
          isOpen
          onClose={onClose}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('dialog-dismiss'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when "Fechar" footer button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <CategoryFilterModal
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
        <CategoryFilterModal
          isOpen={false}
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('integration: parent state changes reflect in the input', () => {
    it('updates the input value when the parent passes a new filter prop', () => {
      const { rerender } = render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nome')).toHaveValue('');

      rerender(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={{ name: 'Transporte' }}
          onFilterChange={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nome')).toHaveValue(
        'Transporte'
      );
    });

    it('toggles "Limpar filtros" visibility based on the latest filter prop', () => {
      const { rerender } = render(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={EMPTY_FILTER}
          onFilterChange={vi.fn()}
        />
      );

      expect(
        screen.queryByRole('button', { name: /limpar filtros/i })
      ).not.toBeInTheDocument();

      rerender(
        <CategoryFilterModal
          isOpen
          onClose={vi.fn()}
          filter={{ name: 'Outros' }}
          onFilterChange={vi.fn()}
        />
      );

      expect(
        screen.getByRole('button', { name: /limpar filtros/i })
      ).toBeInTheDocument();
    });
  });
});
