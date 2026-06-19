import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FavorecidoActions } from '../FavorecidoActions';
import type { FavorecidoDTO } from '@/types/favorecidos';

function buildFavorecido(overrides: Partial<FavorecidoDTO> = {}): FavorecidoDTO {
  return {
    id: 'fav-1',
    organizationId: 'org-1',
    name: 'João Silva',
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

describe('FavorecidoActions', () => {
  it('renders a trigger labelled with the favorecido name', () => {
    render(
      <FavorecidoActions favorecido={buildFavorecido()} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    expect(
      screen.getByRole('button', { name: /ações de joão silva/i })
    ).toBeInTheDocument();
  });

  it('invokes onEdit with the favorecido when Editar is selected', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const favorecido = buildFavorecido();
    render(<FavorecidoActions favorecido={favorecido} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /ações de/i }));
    await user.click(screen.getByText('Editar'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(favorecido);
  });

  it('invokes onDelete with the favorecido when Excluir is selected', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const favorecido = buildFavorecido();
    render(<FavorecidoActions favorecido={favorecido} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /ações de/i }));
    await user.click(screen.getByText('Excluir'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(favorecido);
  });
});
