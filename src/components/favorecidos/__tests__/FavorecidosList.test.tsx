import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FavorecidosList } from '../FavorecidosList';
import type { FavorecidoDTO } from '@/types/favorecidos';

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

const EMPTY_STATE_MESSAGE = 'Nenhum favorecido encontrado';

/** Counts data rows in the canonical desktop table (excludes the header row). */
function desktopRowCount() {
  const table = screen.getByTestId('favorecidos-table');
  return within(table).getAllByRole('row').length - 1;
}

describe('FavorecidosList', () => {
  describe('loading state', () => {
    it('renders skeletons when isLoading is true', () => {
      render(
        <FavorecidosList favorecidos={[]} isLoading onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      const skeletons = screen
        .getAllByRole('generic')
        .filter((el) => el.className?.includes('animate-pulse'));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render the empty state while loading with no favorecidos', () => {
      render(
        <FavorecidosList favorecidos={[]} isLoading onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      expect(screen.queryByText(EMPTY_STATE_MESSAGE)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders the empty state message when favorecidos is [] and not loading', () => {
      render(
        <FavorecidosList favorecidos={[]} isLoading={false} onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText(EMPTY_STATE_MESSAGE)).toBeInTheDocument();
    });
  });

  describe('populated state', () => {
    it('renders one data row per favorecido in the desktop table', () => {
      render(
        <FavorecidosList
          favorecidos={[
            buildFavorecido({ id: 'a', name: 'João Silva' }),
            buildFavorecido({ id: 'b', name: 'Maria Santos' }),
            buildFavorecido({ id: 'c', name: 'Empresa XYZ' }),
          ]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(desktopRowCount()).toBe(3);
      expect(screen.getAllByText('João Silva').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Maria Santos').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the formatted document', () => {
      render(
        <FavorecidosList
          favorecidos={[buildFavorecido({ id: 'a', name: 'João', document: '12345678901' })]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getAllByText('123.456.789-01').length).toBeGreaterThanOrEqual(1);
    });

    it('does not render the empty state when there are favorecidos', () => {
      render(
        <FavorecidosList
          favorecidos={[buildFavorecido({ id: 'a', name: 'João' })]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('callback wiring through the actions menu', () => {
    it('invokes onEdit with the selected favorecido', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const target = buildFavorecido({ id: 'fav-2', name: 'Maria Santos' });
      render(
        <FavorecidosList
          favorecidos={[buildFavorecido({ id: 'fav-1', name: 'João Silva' }), target]}
          isLoading={false}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />
      );

      const triggers = screen.getAllByRole('button', { name: /ações de maria santos/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Editar'));

      expect(onEdit).toHaveBeenCalledWith(target);
    });

    it('invokes onDelete with the selected favorecido', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const target = buildFavorecido({ id: 'fav-1', name: 'João Silva' });
      render(
        <FavorecidosList
          favorecidos={[target, buildFavorecido({ id: 'fav-2', name: 'Maria Santos' })]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />
      );

      const triggers = screen.getAllByRole('button', { name: /ações de joão silva/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Excluir'));

      expect(onDelete).toHaveBeenCalledWith(target);
    });
  });
});
