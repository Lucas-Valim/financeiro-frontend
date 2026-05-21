import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryRow } from '../CategoryRow';
import type { CategoryDTO } from '@/types/categories';

// ── Fixtures ────────────────────────────────────────────────────────────────

const baseCategory: CategoryDTO = {
  id: 'cat-1',
  organizationId: 'org-1',
  name: 'Alimentação',
  description: 'Despesas com alimentação',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function buildCategory(overrides: Partial<CategoryDTO> = {}): CategoryDTO {
  return { ...baseCategory, ...overrides };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CategoryRow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the category name', () => {
      render(
        <CategoryRow
          category={buildCategory({ name: 'Transporte' })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Transporte')).toBeInTheDocument();
    });

    it('renders the description when it is a non-empty string', () => {
      render(
        <CategoryRow
          category={buildCategory({ description: 'Gastos com transporte público' })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Gastos com transporte público')).toBeInTheDocument();
      expect(screen.getByTestId('category-row-description')).toBeInTheDocument();
    });

    it('does NOT render the description element when description is ""', () => {
      render(
        <CategoryRow
          category={buildCategory({ description: '' })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('category-row-description')).not.toBeInTheDocument();
    });

    it('does NOT render the description element when description is null', () => {
      render(
        <CategoryRow
          category={buildCategory({ description: null as unknown as string })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('category-row-description')).not.toBeInTheDocument();
    });

    it('does NOT render the description element when description is undefined', () => {
      render(
        <CategoryRow
          category={buildCategory({ description: undefined as unknown as string })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByTestId('category-row-description')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders an edit button with an aria-label that includes the category name', () => {
      render(
        <CategoryRow
          category={buildCategory({ name: 'Lazer' })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /editar categoria lazer/i })).toBeInTheDocument();
    });

    it('renders a delete button with an aria-label that includes the category name', () => {
      render(
        <CategoryRow
          category={buildCategory({ name: 'Lazer' })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /excluir categoria lazer/i })).toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('calls onEdit with the full CategoryDTO when the edit button is clicked', async () => {
      const onEdit = vi.fn();
      const category = buildCategory({ id: 'cat-42', name: 'Saúde' });
      render(<CategoryRow category={category} onEdit={onEdit} onDelete={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /editar categoria saúde/i }));

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(category);
    });

    it('calls onDelete with the full CategoryDTO when the delete button is clicked', async () => {
      const onDelete = vi.fn();
      const category = buildCategory({ id: 'cat-99', name: 'Educação' });
      render(<CategoryRow category={category} onEdit={vi.fn()} onDelete={onDelete} />);

      await user.click(screen.getByRole('button', { name: /excluir categoria educação/i }));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(category);
    });

    it('does not call onDelete when only the edit button is clicked', async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(
        <CategoryRow category={buildCategory()} onEdit={onEdit} onDelete={onDelete} />
      );

      await user.click(screen.getByRole('button', { name: /editar categoria/i }));

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('does not call onEdit when only the delete button is clicked', async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(
        <CategoryRow category={buildCategory()} onEdit={onEdit} onDelete={onDelete} />
      );

      await user.click(screen.getByRole('button', { name: /excluir categoria/i }));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onEdit).not.toHaveBeenCalled();
    });
  });
});
