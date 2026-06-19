import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriesList } from '../CategoriesList';
import type { CategoryDTO } from '@/types/categories';

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

const EMPTY_STATE_MESSAGE = 'Nenhuma categoria cadastrada. Crie uma agora.';

/** Counts data rows in the canonical desktop table (excludes the header row). */
function desktopRowCount() {
  const table = screen.getByTestId('categories-table');
  return within(table).getAllByRole('row').length - 1;
}

describe('CategoriesList', () => {
  describe('loading state', () => {
    it('renders skeletons when isLoading is true', () => {
      render(
        <CategoriesList categories={[]} isLoading onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      const skeletons = screen
        .getAllByRole('generic')
        .filter((el) => el.className?.includes('animate-pulse'));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render the empty state while loading with no categories', () => {
      render(
        <CategoriesList categories={[]} isLoading onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      expect(screen.queryByText(EMPTY_STATE_MESSAGE)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders the empty state message when categories is [] and not loading', () => {
      render(
        <CategoriesList categories={[]} isLoading={false} onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText(EMPTY_STATE_MESSAGE)).toBeInTheDocument();
    });
  });

  describe('populated state', () => {
    it('renders one data row per category in the desktop table', () => {
      render(
        <CategoriesList
          categories={[
            buildCategory({ id: 'a', name: 'Alimentação' }),
            buildCategory({ id: 'b', name: 'Transporte' }),
            buildCategory({ id: 'c', name: 'Lazer' }),
          ]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(desktopRowCount()).toBe(3);
      expect(screen.getAllByText('Alimentação').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Transporte').length).toBeGreaterThanOrEqual(1);
    });

    it('does not render the empty state when there are categories', () => {
      render(
        <CategoriesList
          categories={[buildCategory({ id: 'a', name: 'A' })]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('renders the description column header', () => {
      render(
        <CategoriesList
          categories={[buildCategory({ id: 'a', name: 'A', description: 'desc' })]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getAllByText('Descrição').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('callback wiring through the actions menu', () => {
    it('invokes onEdit with the selected category', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const target = buildCategory({ id: 'cat-2', name: 'Transporte' });
      render(
        <CategoriesList
          categories={[buildCategory({ id: 'cat-1', name: 'Alimentação' }), target]}
          isLoading={false}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />
      );

      const triggers = screen.getAllByRole('button', { name: /ações de transporte/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Editar'));

      expect(onEdit).toHaveBeenCalledWith(target);
    });

    it('invokes onDelete with the selected category', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const target = buildCategory({ id: 'cat-1', name: 'Alimentação' });
      render(
        <CategoriesList
          categories={[target, buildCategory({ id: 'cat-2', name: 'Transporte' })]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />
      );

      const triggers = screen.getAllByRole('button', { name: /ações de alimentação/i });
      await user.click(triggers[0]);
      await user.click(screen.getByText('Excluir'));

      expect(onDelete).toHaveBeenCalledWith(target);
    });
  });
});
