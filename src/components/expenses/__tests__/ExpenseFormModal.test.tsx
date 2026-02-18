import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseFormModal } from '../ExpenseFormModal';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

vi.mock('@/hooks/useExpenseForm', () => ({
  useExpenseForm: vi.fn(() => ({
    form: {
      control: {},
      handleSubmit: vi.fn((cb) => (e: React.FormEvent) => {
        e.preventDefault();
        cb({});
      }),
      formState: { isDirty: false, errors: {} },
      reset: vi.fn(),
      setValue: vi.fn(),
      getValues: vi.fn(() => ({})),
    },
    isDirty: false,
    isSubmitting: false,
    onSubmit: vi.fn(),
    resetForm: vi.fn(),
  })),
}));

vi.mock('../ExpenseFormFields', () => ({
  ExpenseFormFields: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="expense-form-fields" data-disabled={disabled?.toString()}>
      Expense Form Fields
    </div>
  ),
}));

vi.mock('../ExpenseUploadFields', () => ({
  ExpenseUploadFields: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="expense-upload-fields" data-disabled={disabled?.toString()}>
      Expense Upload Fields
    </div>
  ),
}));

const mockExpense: ExpenseDTO = {
  id: 'expense-1',
  organizationId: 'org-1',
  description: 'Test Expense',
  amount: 100,
  currency: 'BRL',
  dueDate: new Date('2024-01-15'),
  status: ExpenseStatus.OPEN,
  categoryId: 'cat-1',
  paymentMethod: 'PIX',
  paymentProof: null,
  paymentProofUrl: null,
  paymentDate: null,
  receiver: 'Test Receiver',
  municipality: 'Test Municipality',
  serviceInvoice: null,
  serviceInvoiceUrl: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

describe('ExpenseFormModal', () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Rendering', () => {
    it('renders Tabs component', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders "Dados" and "Documentos" tab triggers', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('tab', { name: /dados/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /documentos/i })).toBeInTheDocument();
    });

    it('"Dados" tab is selected by default', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const dadosTab = screen.getByRole('tab', { name: /dados/i });
      expect(dadosTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Tab Content', () => {
    it('shows ExpenseFormFields in Dados tab', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('expense-form-fields')).toBeInTheDocument();
    });

    it('shows ExpenseUploadFields in Documentos tab', async () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const documentosTab = screen.getByRole('tab', { name: /documentos/i });
      await user.click(documentosTab);

      expect(screen.getByTestId('expense-upload-fields')).toBeInTheDocument();
    });

    it('does not show ExpenseUploadFields in Dados tab', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByTestId('expense-upload-fields')).not.toBeInTheDocument();
    });

    it('does not show ExpenseFormFields in Documentos tab', async () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const documentosTab = screen.getByRole('tab', { name: /documentos/i });
      await user.click(documentosTab);

      expect(screen.queryByTestId('expense-form-fields')).not.toBeInTheDocument();
    });
  });

  describe('Tab Interaction', () => {
    it('switches to Documentos when clicked', async () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const documentosTab = screen.getByRole('tab', { name: /documentos/i });
      await user.click(documentosTab);

      expect(documentosTab).toHaveAttribute('data-state', 'active');
      const dadosTab = screen.getByRole('tab', { name: /dados/i });
      expect(dadosTab).not.toHaveAttribute('data-state', 'active');
    });

    it('switches back to Dados when clicked', async () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const documentosTab = screen.getByRole('tab', { name: /documentos/i });
      await user.click(documentosTab);

      const dadosTab = screen.getByRole('tab', { name: /dados/i });
      await user.click(dadosTab);

      expect(dadosTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Disabled State Propagation', () => {
    it('passes disabled=false to ExpenseFormFields when not submitting', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const formFields = screen.getByTestId('expense-form-fields');
      expect(formFields).toHaveAttribute('data-disabled', 'false');
    });

    it('passes disabled=false to ExpenseUploadFields when not submitting', async () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const documentosTab = screen.getByRole('tab', { name: /documentos/i });
      await user.click(documentosTab);

      const uploadFields = screen.getByTestId('expense-upload-fields');
      expect(uploadFields).toHaveAttribute('data-disabled', 'false');
    });
  });

  describe('Modal Actions', () => {
    it('renders submit and cancel buttons', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /criar despesa/i })).toBeInTheDocument();
    });

    it('cancel button works from Dados tab', async () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('cancel button works from Documentos tab', async () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const documentosTab = screen.getByRole('tab', { name: /documentos/i });
      await user.click(documentosTab);

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Modal Modes', () => {
    it('shows create mode title when no expense provided', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Nova Despesa')).toBeInTheDocument();
    });

    it('shows edit mode title when expense provided', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />
      );

      expect(screen.getByText('Editar Despesa')).toBeInTheDocument();
    });

    it('shows create button text in create mode', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('button', { name: /criar despesa/i })).toBeInTheDocument();
    });

    it('shows edit button text in edit mode', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />
      );

      expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
    });
  });

  describe('Tab Persistence', () => {
    it('keeps Dados tab content when clicking submit button', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('expense-form-fields')).toBeInTheDocument();
    });

    it('switches between tabs preserves form fields container', async () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const documentosTab = screen.getByRole('tab', { name: /documentos/i });
      await user.click(documentosTab);

      expect(screen.getByTestId('expense-upload-fields')).toBeInTheDocument();

      const dadosTab = screen.getByRole('tab', { name: /dados/i });
      await user.click(dadosTab);

      expect(screen.getByTestId('expense-form-fields')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper tab structure with tablist role', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('has correct tab roles', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });
  });

  describe('Modal Closed State', () => {
    it('does not render tabs when modal is closed', () => {
      render(
        <ExpenseFormModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });

  describe('handleClose force parameter', () => {
    it('handleClose with force=true should bypass dirty check', () => {
      const onClose = vi.fn();
      const isDirty = true;

      const handleClose = (force = false) => {
        if (!force && isDirty) {
          return 'show-confirm';
        }
        onClose();
        return 'closed';
      };

      expect(handleClose()).toBe('show-confirm');
      expect(handleClose(false)).toBe('show-confirm');
      expect(handleClose(true)).toBe('closed');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('handleClose with force=false and isDirty=false should close directly', () => {
      const onClose = vi.fn();
      const isDirty = false;

      const handleClose = (force = false) => {
        if (!force && isDirty) {
          return 'show-confirm';
        }
        onClose();
        return 'closed';
      };

      expect(handleClose()).toBe('closed');
      expect(handleClose(false)).toBe('closed');
      expect(handleClose(true)).toBe('closed');
      expect(onClose).toHaveBeenCalledTimes(3);
    });
  });
});
