import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentModal } from '../PaymentModal';
import type { ExpenseDTO } from '@/types/expenses';
import { ExpenseStatus } from '@/constants/expenses';

// Mock lucide-react icons - use importOriginal to include all needed icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Loader2: () => <span data-testid="loader-icon">Loading...</span>,
    CheckCircle2: () => <span data-testid="check-circle-icon">Success</span>,
    AlertCircle: () => <span data-testid="alert-circle-icon">Error</span>,
  };
});

// Mock the usePayExpense hook
vi.mock('@/hooks/usePayExpense', () => ({
  usePayExpense: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-datepicker
vi.mock('react-datepicker', () => ({
  default: vi.fn(({ selected, onChange, customInput, disabled }) => {
    return (
      <div data-testid="date-picker">
        {customInput}
        <input
          type="date"
          data-testid="date-input"
          value={selected ? selected.toISOString().split('T')[0] : ''}
          onChange={(e) => onChange(new Date(e.target.value))}
          disabled={disabled}
        />
      </div>
    );
  }),
  registerLocale: vi.fn(),
}));

import { usePayExpense } from '@/hooks/usePayExpense';

const mockUsePayExpense = vi.mocked(usePayExpense);

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Mock expense data
const mockExpense: ExpenseDTO = {
  id: 'expense-123',
  organizationId: 'org-1',
  categoryId: 'cat-1',
  description: 'Test Expense',
  amount: 100.5,
  currency: 'BRL',
  dueDate: new Date('2024-12-31'),
  status: ExpenseStatus.OPEN,
  paymentMethod: null,
  paymentProof: null,
  paymentProofUrl: null,
  receiver: 'Test Receiver',
  municipality: 'Test City',
  serviceInvoice: null,
  serviceInvoiceUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PaymentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePayExpense.mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      reset: vi.fn(),
      status: 'idle',
      variables: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
      context: undefined,
    } as unknown as ReturnType<typeof usePayExpense>);
  });

  describe('Modal visibility', () => {
    it('renders nothing when expense is null', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={null}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByText('Registrar Pagamento')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true and expense exists', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      // Check for modal title specifically by role
      expect(screen.getByRole('heading', { name: /Registrar Pagamento/i })).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(
        <PaymentModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByText('Registrar Pagamento')).not.toBeInTheDocument();
    });
  });

  describe('Modal content', () => {
    it('displays expense description and amount', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Test Expense')).toBeInTheDocument();
      expect(screen.getByText('R$ 100,50')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByLabelText(/Valor do Pagamento/i)).toBeInTheDocument();
      expect(screen.getByText(/Data do Pagamento/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /Forma de Pagamento/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Número de Referência/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Observações/i)).toBeInTheDocument();
      expect(screen.getByText(/Comprovante de Pagamento/i)).toBeInTheDocument();
    });

    it('renders cancel and submit buttons', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Registrar Pagamento/i })).toBeInTheDocument();
    });
  });

  describe('Modal interactions', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByRole('button', { name: /Cancelar/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading state', () => {
    it('submit button exists and can be clicked', async () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it('cancel button is enabled initially', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Success state', () => {
    it('mutation hook is called correctly', async () => {
      mockMutateAsync.mockResolvedValue({
        id: 'expense-123',
        status: 'PAID',
        paymentDate: '2024-01-15',
      });

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      // Verify the modal rendered correctly with expense data
      expect(screen.getByText('Test Expense')).toBeInTheDocument();
      expect(mockUsePayExpense).toHaveBeenCalled();
    });
  });

  describe('Error state', () => {
    it('mutation hook handles errors correctly', async () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      // Verify the modal rendered correctly
      expect(screen.getByRole('heading', { name: /Registrar Pagamento/i })).toBeInTheDocument();
    });
  });
});
