import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormReturn } from 'react-hook-form';
import type { ReactNode } from 'react';
import { FavorecidoFormModal } from '../FavorecidoFormModal';
import type { FavorecidoDTO } from '@/types/favorecidos';
import {
  favorecidoFormSchema,
  defaultFavorecidoFormValues,
  type FavorecidoFormData,
} from '@/schemas/favorecido-form-schema';

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

vi.mock('@/hooks/useFavorecidoForm', () => ({
  useFavorecidoForm: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useFavorecidoForm } from '@/hooks/useFavorecidoForm';

let testIsSubmitting = false;

function setupHookMock() {
  vi.mocked(useFavorecidoForm).mockImplementation(({ favorecido: fav, onSuccess }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm<FavorecidoFormData>({
      // @ts-expect-error — Zod v4 resolver type compatibility
      resolver: zodResolver(favorecidoFormSchema),
      defaultValues: fav
        ? {
            name: fav.name,
            document: fav.document,
            zipCode: fav.zipCode ?? '',
            street: fav.street ?? '',
            number: fav.number ?? '',
            city: fav.city ?? '',
            state: fav.state ?? '',
            phone: fav.phone ?? '',
            email: fav.email ?? '',
          }
        : defaultFavorecidoFormValues,
      mode: 'onChange',
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const onSubmit = useCallback(async () => {
      const isValid = await form.trigger();
      if (isValid) {
        onSuccess?.(mockFavorecido);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const resetForm = useCallback(() => {
      form.reset(
        fav
          ? {
              name: fav.name,
              document: fav.document,
              zipCode: fav.zipCode ?? '',
              street: fav.street ?? '',
              number: fav.number ?? '',
              city: fav.city ?? '',
              state: fav.state ?? '',
              phone: fav.phone ?? '',
              email: fav.email ?? '',
            }
          : defaultFavorecidoFormValues
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
      form: form as unknown as UseFormReturn<FavorecidoFormData>,
      isDirty: false,
      isSubmitting: testIsSubmitting,
      onSubmit,
      resetForm,
    };
  });
}

const ORGANIZATION_ID = 'fca3c088-ba34-43a2-9b32-b2b1a1246915';

const mockFavorecido: FavorecidoDTO = {
  id: 'fav-1',
  organizationId: ORGANIZATION_ID,
  name: 'João Silva',
  document: '12345678901',
  documentType: 'CPF',
  zipCode: '01001000',
  street: 'Rua Teste',
  number: '123',
  city: 'São Paulo',
  state: 'SP',
  phone: '11999999999',
  email: 'joao@teste.com',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('FavorecidoFormModal', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    testIsSubmitting = false;
    setupHookMock();
  });

  describe('create mode (no favorecido prop)', () => {
    it('renders "Novo Favorecido" title and empty form', () => {
      render(<FavorecidoFormModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText('Novo Favorecido')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nome do favorecido')).toHaveValue('');
      expect(screen.getByPlaceholderText('000.000.000-00 ou 00.000.000/0000-00')).toHaveValue('');
    });

    it('renders all form fields', () => {
      render(<FavorecidoFormModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByPlaceholderText('Nome do favorecido')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('000.000.000-00 ou 00.000.000/0000-00')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('00000-000')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Rua, Av...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nº')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Cidade')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('UF')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('(00) 00000-0000')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('email@exemplo.com')).toBeInTheDocument();
    });

    it('renders "Salvar" and "Cancelar" buttons', () => {
      render(<FavorecidoFormModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole('button', { name: /^salvar$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  describe('edit mode (favorecido prop provided)', () => {
    it('renders "Editar Favorecido" title and pre-filled fields', () => {
      render(<FavorecidoFormModal isOpen={true} onClose={vi.fn()} favorecido={mockFavorecido} />);

      expect(screen.getByText('Editar Favorecido')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockFavorecido.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockFavorecido.document)).toBeInTheDocument();
    });
  });

  describe('"Salvar" button disabled state', () => {
    it('is disabled and shows "Salvando..." when isSubmitting is true', () => {
      testIsSubmitting = true;
      render(<FavorecidoFormModal isOpen={true} onClose={vi.fn()} />);

      const salvarButton = screen.getByRole('button', { name: /salvando\.\.\./i });
      expect(salvarButton).toBeDisabled();
    });

    it('"Cancelar" button is also disabled when isSubmitting is true', () => {
      testIsSubmitting = true;
      render(<FavorecidoFormModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
    });
  });

  describe('inline validation', () => {
    it('shows validation error message when name is empty and form is submitted', async () => {
      render(<FavorecidoFormModal isOpen={true} onClose={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /^salvar$/i }));

      await waitFor(() => {
        expect(screen.getByText('O nome é obrigatório')).toBeInTheDocument();
      });
    });

    it('does not call onClose when validation fails', async () => {
      const onClose = vi.fn();
      render(<FavorecidoFormModal isOpen={true} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /^salvar$/i }));

      await waitFor(() => {
        expect(screen.getByText('O nome é obrigatório')).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('cancel behavior', () => {
    it('clicking "Cancelar" calls onClose', async () => {
      const onClose = vi.fn();
      render(<FavorecidoFormModal isOpen={true} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('successful submit', () => {
    it('calls onClose after successful form submission with valid data', async () => {
      const onClose = vi.fn();
      render(<FavorecidoFormModal isOpen={true} onClose={onClose} />);

      await user.type(screen.getByPlaceholderText('Nome do favorecido'), 'Maria Santos');
      await user.type(screen.getByPlaceholderText('000.000.000-00 ou 00.000.000/0000-00'), '12345678901');
      await user.click(screen.getByRole('button', { name: /^salvar$/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('dialog dismiss', () => {
    it('calls onClose when dialog is dismissed via onOpenChange(false)', async () => {
      const onClose = vi.fn();
      render(<FavorecidoFormModal isOpen={true} onClose={onClose} />);

      await user.click(screen.getByTestId('dialog-dismiss'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('closed state', () => {
    it('does not render when isOpen is false', () => {
      render(<FavorecidoFormModal isOpen={false} onClose={vi.fn()} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
