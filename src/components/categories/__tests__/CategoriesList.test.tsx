import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriesList } from '../CategoriesList';
import type { CategoryDTO } from '@/types/categories';

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

const EMPTY_STATE_MESSAGE = 'Nenhuma categoria cadastrada. Crie uma agora.';

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CategoriesList', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('renders a loading skeleton when isLoading is true', () => {
      render(
        <CategoriesList
          categories={[]}
          isLoading={true}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByTestId('categories-list-loading')).toBeInTheDocument();
    });

    it('does not render the empty state when isLoading is true with empty categories', () => {
      render(
        <CategoriesList
          categories={[]}
          isLoading={true}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('categories-list-empty')).not.toBeInTheDocument();
      expect(screen.queryByText(EMPTY_STATE_MESSAGE)).not.toBeInTheDocument();
    });

    it('does not render category rows when isLoading is true', () => {
      render(
        <CategoriesList
          categories={[buildCategory({ id: 'cat-1', name: 'Stale row' })]}
          isLoading={true}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('category-row')).not.toBeInTheDocument();
      expect(screen.queryByText('Stale row')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders the empty state message when categories is [] and isLoading is false', () => {
      render(
        <CategoriesList
          categories={[]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByTestId('categories-list-empty')).toBeInTheDocument();
      expect(screen.getByText(EMPTY_STATE_MESSAGE)).toBeInTheDocument();
    });

    it('does not render the loading skeleton in the empty state', () => {
      render(
        <CategoriesList
          categories={[]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('categories-list-loading')).not.toBeInTheDocument();
    });
  });

  describe('populated state', () => {
    it('renders exactly 3 rows when given an array of 3 categories', () => {
      const categories = [
        buildCategory({ id: 'a', name: 'Alimentação' }),
        buildCategory({ id: 'b', name: 'Transporte' }),
        buildCategory({ id: 'c', name: 'Lazer' }),
      ];

      render(
        <CategoriesList
          categories={categories}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getAllByTestId('category-row')).toHaveLength(3);
    });

    it('does NOT render the empty state when categories has items', () => {
      render(
        <CategoriesList
          categories={[buildCategory({ id: 'a', name: 'A' })]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('categories-list-empty')).not.toBeInTheDocument();
      expect(screen.queryByText(EMPTY_STATE_MESSAGE)).not.toBeInTheDocument();
    });

    it('does NOT render the loading skeleton when populated', () => {
      render(
        <CategoriesList
          categories={[buildCategory({ id: 'a', name: 'A' })]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('categories-list-loading')).not.toBeInTheDocument();
    });

    it('renders each category name in its row', () => {
      const categories = [
        buildCategory({ id: 'a', name: 'Alimentação' }),
        buildCategory({ id: 'b', name: 'Transporte' }),
      ];

      render(
        <CategoriesList
          categories={categories}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Alimentação')).toBeInTheDocument();
      expect(screen.getByText('Transporte')).toBeInTheDocument();
    });
  });

  describe('integration: callback wiring through rows', () => {
    it('invokes onEdit with the clicked row’s category', async () => {
      const onEdit = vi.fn();
      const target = buildCategory({ id: 'cat-2', name: 'Transporte' });
      const categories = [
        buildCategory({ id: 'cat-1', name: 'Alimentação' }),
        target,
      ];

      render(
        <CategoriesList
          categories={categories}
          isLoading={false}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />
      );

      await user.click(
        screen.getByRole('button', { name: /editar categoria transporte/i })
      );

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(target);
    });

    it('invokes onDelete with the clicked row’s category', async () => {
      const onDelete = vi.fn();
      const target = buildCategory({ id: 'cat-1', name: 'Alimentação' });
      const categories = [
        target,
        buildCategory({ id: 'cat-2', name: 'Transporte' }),
      ];

      render(
        <CategoriesList
          categories={categories}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />
      );

      await user.click(
        screen.getByRole('button', { name: /excluir categoria alimentação/i })
      );

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(target);
    });
  });
});
