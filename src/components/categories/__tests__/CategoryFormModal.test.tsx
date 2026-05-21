import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormReturn } from 'react-hook-form';
import type { ReactNode } from 'react';
import { CategoryFormModal } from '../CategoryFormModal';
import type { CategoryDTO } from '@/types/categories';
import {
  categoryFormSchema,
  defaultCategoryFormValues,
  type CategoryFormData,
} from '@/schemas/category-form-schema';

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

vi.mock('@/hooks/useCategoryForm', () => ({
  useCategoryForm: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Hook mock control ───────────────────────────────────────────────────────

import { useCategoryForm } from '@/hooks/useCategoryForm';

// Module-level flag lets individual tests override isSubmitting without re-declaring the mock.
let testIsSubmitting = false;

function setupHookMock() {
  vi.mocked(useCategoryForm).mockImplementation(({ category: cat, onSuccess }) => {
    // Called inside React render context — hooks are valid here.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm<CategoryFormData>({
      // @ts-expect-error — Zod v4 resolver type compatibility
      resolver: zodResolver(categoryFormSchema),
      defaultValues: cat
        ? { name: cat.name, description: cat.description ?? '' }
        : defaultCategoryFormValues,
      mode: 'onChange',
    });

    // Stable references prevent useEffect(deps) infinite loops in the component.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const onSubmit = useCallback(async () => {
      const isValid = await form.trigger();
      if (isValid) {
        onSuccess?.();
      }
    // form and onSuccess are stable references within a render cycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const resetForm = useCallback(() => {
      form.reset(
        cat ? { name: cat.name, description: cat.description ?? '' } : defaultCategoryFormValues
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
      form: form as unknown as UseFormReturn<CategoryFormData>,
      isDirty: false,
      isSubmitting: testIsSubmitting,
      onSubmit,
      resetForm,
    };
  });
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORGANIZATION_ID = 'fca3c088-ba34-43a2-9b32-b2b1a1246915';

const mockCategory: CategoryDTO = {
  id: 'cat-1',
  organizationId: ORGANIZATION_ID,
  name: 'Alimentação',
  description: 'Despesas com alimentação',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CategoryFormModal', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    testIsSubmitting = false;
    setupHookMock();
  });

  describe('create mode (no category prop)', () => {
    it('renders with empty name field when category prop is null', () => {
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText('Nova Categoria')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nome da categoria')).toHaveValue('');
    });

    it('renders empty description field in create mode', () => {
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByPlaceholderText('Descrição (opcional)')).toHaveValue('');
    });

    it('renders "Salvar" and "Cancelar" buttons', () => {
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole('button', { name: /^salvar$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  describe('edit mode (category prop provided)', () => {
    it('renders with pre-filled name when category prop is provided', () => {
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} category={mockCategory} />);

      expect(screen.getByText('Editar Categoria')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockCategory.name)).toBeInTheDocument();
    });

    it('renders with pre-filled description when category prop is provided', () => {
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} category={mockCategory} />);

      expect(screen.getByDisplayValue(mockCategory.description)).toBeInTheDocument();
    });
  });

  describe('"Salvar" button disabled state', () => {
    it('is disabled and shows "Salvando..." when isSubmitting is true', () => {
      testIsSubmitting = true;
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} />);

      const salvarButton = screen.getByRole('button', { name: /salvando\.\.\./i });
      expect(salvarButton).toBeDisabled();
    });

    it('"Cancelar" button is also disabled when isSubmitting is true', () => {
      testIsSubmitting = true;
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
    });

    it('is enabled and shows "Salvar" when not submitting', () => {
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} />);

      const salvarButton = screen.getByRole('button', { name: /^salvar$/i });
      expect(salvarButton).not.toBeDisabled();
    });
  });

  describe('inline validation', () => {
    it('shows validation error message when name is empty and form is submitted', async () => {
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /^salvar$/i }));

      await waitFor(() => {
        expect(screen.getByText('O nome é obrigatório')).toBeInTheDocument();
      });
    });

    it('does not call onClose when validation fails', async () => {
      const onClose = vi.fn();
      render(<CategoryFormModal isOpen={true} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /^salvar$/i }));

      await waitFor(() => {
        expect(screen.getByText('O nome é obrigatório')).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('clears validation error when valid name is typed', async () => {
      render(<CategoryFormModal isOpen={true} onClose={vi.fn()} />);

      // Trigger error
      await user.click(screen.getByRole('button', { name: /^salvar$/i }));
      await waitFor(() => {
        expect(screen.getByText('O nome é obrigatório')).toBeInTheDocument();
      });

      // Fix error
      await user.type(screen.getByPlaceholderText('Nome da categoria'), 'Valid name');
      await waitFor(() => {
        expect(screen.queryByText('O nome é obrigatório')).not.toBeInTheDocument();
      });
    });
  });

  describe('cancel behavior', () => {
    it('clicking "Cancelar" calls onClose', async () => {
      const onClose = vi.fn();
      render(<CategoryFormModal isOpen={true} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('successful submit', () => {
    it('calls onClose after successful form submission with valid name', async () => {
      const onClose = vi.fn();
      render(<CategoryFormModal isOpen={true} onClose={onClose} />);

      await user.type(screen.getByPlaceholderText('Nome da categoria'), 'Nova Categoria');
      await user.click(screen.getByRole('button', { name: /^salvar$/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('dialog dismiss (backdrop / escape)', () => {
    it('calls onClose when dialog is dismissed via onOpenChange(false)', async () => {
      const onClose = vi.fn();
      render(<CategoryFormModal isOpen={true} onClose={onClose} />);

      await user.click(screen.getByTestId('dialog-dismiss'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('closed state', () => {
    it('does not render when isOpen is false', () => {
      render(<CategoryFormModal isOpen={false} onClose={vi.fn()} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('integration: CategoryFormModal open/close and form submission', () => {
    it('opening in create mode and submitting valid data closes the modal', async () => {
      const onClose = vi.fn();
      const { rerender } = render(<CategoryFormModal isOpen={true} onClose={onClose} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.type(screen.getByPlaceholderText('Nome da categoria'), 'Test Category');
      await user.click(screen.getByRole('button', { name: /^salvar$/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });

      // Simulate parent closing the modal after onClose
      rerender(<CategoryFormModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
