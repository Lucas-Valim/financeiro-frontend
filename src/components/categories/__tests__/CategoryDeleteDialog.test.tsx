import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { CategoryDeleteDialog } from '../CategoryDeleteDialog';
import type { CategoryDTO } from '@/types/categories';
import { ORGANIZATION_ID } from '@/constants/expenses';
import { LINKED_EXPENSES_ERROR_MESSAGE } from '@/constants/categories';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockDelete = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock('@/api/categories-api', () => ({
  CategoriesApiService: class {
    delete = mockDelete;
  },
  categoriesApiService: {
    delete: mockDelete,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}));

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

const mockCategory: CategoryDTO = {
  id: 'cat-1',
  organizationId: ORGANIZATION_ID,
  name: 'Alimentação',
  description: 'Despesas com alimentação',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// ── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function renderDialog(props: Parameters<typeof CategoryDeleteDialog>[0]) {
  return render(<CategoryDeleteDialog {...props} />, { wrapper: createWrapper() });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CategoryDeleteDialog', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockResolvedValue(undefined);
  });

  describe('default confirmation state', () => {
    it('renders confirmation question and Excluir/Cancelar buttons', () => {
      renderDialog({ isOpen: true, onClose: vi.fn(), category: mockCategory });

      expect(
        screen.getByText('Tem certeza que deseja excluir esta categoria?')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /excluir/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('does not show Fechar button in default state', () => {
      renderDialog({ isOpen: true, onClose: vi.fn(), category: mockCategory });

      expect(screen.queryByRole('button', { name: /fechar/i })).not.toBeInTheDocument();
    });

    it('"Cancelar" button calls onClose without calling the delete API', async () => {
      const onClose = vi.fn();
      renderDialog({ isOpen: true, onClose, category: mockCategory });

      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe('blocked state — 409 linked expenses error', () => {
    it('shows blocked error message and only Fechar button after 409 error', async () => {
      mockDelete.mockRejectedValue(new Error(LINKED_EXPENSES_ERROR_MESSAGE));

      renderDialog({ isOpen: true, onClose: vi.fn(), category: mockCategory });

      await user.click(screen.getByRole('button', { name: /excluir/i }));

      await waitFor(() => {
        expect(screen.getByText(LINKED_EXPENSES_ERROR_MESSAGE)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /fechar/i })).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
    });

    it('"Fechar" button calls onClose after blocked state', async () => {
      mockDelete.mockRejectedValue(new Error(LINKED_EXPENSES_ERROR_MESSAGE));
      const onClose = vi.fn();
      renderDialog({ isOpen: true, onClose, category: mockCategory });

      await user.click(screen.getByRole('button', { name: /excluir/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /fechar/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /fechar/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('does not call onClose from the delete attempt when API returns 409', async () => {
      mockDelete.mockRejectedValue(new Error(LINKED_EXPENSES_ERROR_MESSAGE));
      const onClose = vi.fn();
      renderDialog({ isOpen: true, onClose, category: mockCategory });

      await user.click(screen.getByRole('button', { name: /excluir/i }));
      await waitFor(() => {
        expect(screen.getByText(LINKED_EXPENSES_ERROR_MESSAGE)).toBeInTheDocument();
      });

      // onClose should NOT have been called by the failed delete
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('successful deletion', () => {
    it('calls delete API with correct id and organizationId', async () => {
      renderDialog({ isOpen: true, onClose: vi.fn(), category: mockCategory });

      await user.click(screen.getByRole('button', { name: /excluir/i }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(mockCategory.id, ORGANIZATION_ID);
      });
    });

    it('calls onClose after successful delete', async () => {
      const onClose = vi.fn();
      renderDialog({ isOpen: true, onClose, category: mockCategory });

      await user.click(screen.getByRole('button', { name: /excluir/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('dialog dismiss (backdrop / escape)', () => {
    it('calls onClose when dialog is dismissed via onOpenChange(false)', async () => {
      const onClose = vi.fn();
      renderDialog({ isOpen: true, onClose, category: mockCategory });

      await user.click(screen.getByTestId('dialog-dismiss'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onClose when dismissed while delete is pending', async () => {
      let resolveDelete: ((value: void) => void) | undefined;
      mockDelete.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveDelete = resolve;
          })
      );

      const onClose = vi.fn();
      renderDialog({ isOpen: true, onClose, category: mockCategory });

      await user.click(screen.getByRole('button', { name: /excluir/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /excluindo/i })).toBeDisabled();
      });

      await user.click(screen.getByTestId('dialog-dismiss'));

      expect(onClose).not.toHaveBeenCalled();

      resolveDelete?.();
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('closed state', () => {
    it('does not render when isOpen is false', () => {
      renderDialog({ isOpen: false, onClose: vi.fn(), category: mockCategory });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('integration: CategoryDeleteDialog confirmation triggers useDeleteCategory', () => {
    it('clicking Excluir triggers useDeleteCategory mutation with the correct category id', async () => {
      renderDialog({ isOpen: true, onClose: vi.fn(), category: mockCategory });

      await user.click(screen.getByRole('button', { name: /excluir/i }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(mockCategory.id, ORGANIZATION_ID);
      });
    });
  });
});
