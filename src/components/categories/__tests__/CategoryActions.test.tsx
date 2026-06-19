import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryActions } from '../CategoryActions';
import type { CategoryDTO } from '@/types/categories';

function buildCategory(overrides: Partial<CategoryDTO> = {}): CategoryDTO {
  return {
    id: 'cat-1',
    organizationId: 'org-1',
    name: 'Alimentação',
    description: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('CategoryActions', () => {
  it('renders a trigger labelled with the category name', () => {
    render(<CategoryActions category={buildCategory()} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /ações de alimentação/i })
    ).toBeInTheDocument();
  });

  it('invokes onEdit with the category when Editar is selected', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const category = buildCategory();
    render(<CategoryActions category={category} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /ações de/i }));
    await user.click(screen.getByText('Editar'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(category);
  });

  it('invokes onDelete with the category when Excluir is selected', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const category = buildCategory();
    render(<CategoryActions category={category} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /ações de/i }));
    await user.click(screen.getByText('Excluir'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(category);
  });
});
