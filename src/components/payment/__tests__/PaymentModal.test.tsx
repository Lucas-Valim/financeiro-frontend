import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PaymentModal } from '../PaymentModal';
import type { ExpenseDTO } from '@/types/expenses';
import { ExpenseStatus, CONFIRM_AMOUNT_ERROR_MESSAGES } from '@/constants/expenses';

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Loader2: () => <span data-testid="loader-icon">Loading...</span>,
    CheckCircle2: () => <span data-testid="check-circle-icon">Success</span>,
    AlertCircle: () => <span data-testid="alert-circle-icon">Error</span>,
  };
});

vi.mock('@/hooks/usePayExpense', () => ({
  usePayExpense: vi.fn(),
}));

// The real `useConfirmExpenseAmount` runs (so its toast + transition are tested);
// only the underlying service is mocked, mirroring the hook unit tests.
const mockConfirmAmount = vi.hoisted(() => vi.fn());

vi.mock('@/api/expenses-api', () => ({
  ExpensesApiService: class MockExpensesApiService {
    confirmAmount = mockConfirmAmount;
    pay = vi.fn();
    cancel = vi.fn();
    fetchExpenses = vi.fn();
    fetchExpenseById = vi.fn();
    create = vi.fn();
    update = vi.fn();
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

const mockExpense: ExpenseDTO = {
  id: 'expense-123',
  organizationId: 'org-1',
  categoryId: 'cat-1',
  favorecidoId: null,
  description: 'Test Expense',
  amount: 100.5,
  currency: 'BRL',
  dueDate: new Date('2024-12-31'),
  status: ExpenseStatus.OPEN,
  paymentMethod: null,
  paymentProof: null,
  paymentProofUrl: null,
  paymentDate: null,
  receiver: 'Test Receiver',
  municipality: 'Test City',
  serviceInvoice: null,
  serviceInvoiceUrl: null,
  bankBillUrl: null,
  recurringExpenseId: null,
  occurrenceMonth: null,
  amountPendingConfirmation: false,
  documentPending: false,
  calendarSyncStatus: null,
  calendarEventUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPaidExpense: ExpenseDTO = {
  ...mockExpense,
  id: 'expense-paid-123',
  status: ExpenseStatus.PAID,
  paymentDate: new Date('2024-02-15T12:00:00'),
  paymentProofUrl: 'https://example.com/proof.png',
};

const mockPendingExpense: ExpenseDTO = {
  ...mockExpense,
  id: 'expense-pending-123',
  status: ExpenseStatus.OPEN,
  recurringExpenseId: 'rec-1',
  amountPendingConfirmation: true,
};

describe('PaymentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirmAmount.mockResolvedValue({
      id: mockPendingExpense.id,
      amountPendingConfirmation: false,
    });
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

      expect(screen.getByText(/Data do Pagamento/i)).toBeInTheDocument();
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

  describe('Documents tab', () => {
    const expenseWithDocs: ExpenseDTO = {
      ...mockExpense,
      serviceInvoiceUrl: 'https://example.com/nota.png',
      bankBillUrl: 'https://example.com/boleto.pdf',
    };

    it('pay mode shows Pagamento and Documentos tabs', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('tab', { name: /Pagamento/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Documentos/i })).toBeInTheDocument();
    });

    it('pay mode reveals expense documents when Documentos tab is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={expenseWithDocs}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByRole('tab', { name: /Documentos/i }));

      expect(screen.getByTestId('expense-documents-view')).toBeInTheDocument();
      expect(screen.getByText('Nota de Serviço')).toBeInTheDocument();
      expect(screen.getByText('Boleto')).toBeInTheDocument();
    });

    it('view mode shows Comprovante and Documentos tabs', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('tab', { name: /Comprovante/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Documentos/i })).toBeInTheDocument();
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

      expect(screen.getByRole('heading', { name: /Registrar Pagamento/i })).toBeInTheDocument();
    });
  });

  describe('View mode for PAID expense', () => {
    it('view mode renders for PAID expense', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('view-mode-content')).toBeInTheDocument();
    });

    it('view mode shows "Ver Comprovante" title', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('heading', { name: /Ver Comprovante/i })).toBeInTheDocument();
    });

    it('view mode shows read-only payment date', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('payment-date-value')).toBeInTheDocument();
      expect(screen.getByTestId('payment-date-value').textContent).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('view mode shows PaymentProofDisplay', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('proof-image')).toBeInTheDocument();
    });

    it('view mode has only "Fechar" button', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('close-view-button')).toBeInTheDocument();
      expect(screen.queryByTestId('submit-button')).not.toBeInTheDocument();
    });

    it('view mode does NOT show form fields', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument();
    });

    it('view mode does NOT show error state', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('lightbox opens on image click', async () => {
      const user = userEvent.setup();

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('image-container'));
      expect(screen.getByTestId('viewer-overlay')).toBeInTheDocument();
    });

    it('lightbox closes correctly', async () => {
      const user = userEvent.setup();

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('image-container'));
      expect(screen.getByTestId('viewer-overlay')).toBeInTheDocument();

      fireEvent.keyDown(screen.getByTestId('viewer-overlay'), { key: 'Escape' });
      expect(screen.queryByTestId('viewer-overlay')).not.toBeInTheDocument();
    });

    it('lightbox overlay has z-index 60 (above modal z-50)', async () => {
      const user = userEvent.setup();

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('image-container'));
      const overlay = screen.getByTestId('viewer-overlay');
      expect(overlay).toHaveClass('z-[60]');
    });

    it('lightbox close button has z-index 70 (above overlay)', async () => {
      const user = userEvent.setup();

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('image-container'));
      const closeButton = screen.getByTestId('close-button');
      expect(closeButton).toHaveClass('z-[70]');
    });

    it('lightbox close button is clickable when lightbox is open', async () => {
      const user = userEvent.setup();

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('image-container'));
      expect(screen.getByTestId('viewer-overlay')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-button'));
      expect(screen.queryByTestId('viewer-overlay')).not.toBeInTheDocument();
    });

    it('PAID expense with no proofUrl shows "Nenhum comprovante"', () => {
      const paidExpenseNoProof: ExpenseDTO = {
        ...mockPaidExpense,
        paymentProofUrl: null,
      };

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={paidExpenseNoProof}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Nenhum comprovante anexado')).toBeInTheDocument();
    });

    it('view mode "Fechar" button calls onClose', async () => {
      const user = userEvent.setup();

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('close-view-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit mode for OPEN/OVERDUE expense', () => {
    it('edit mode (OPEN) shows form fields', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('edit mode (OVERDUE) shows form fields', () => {
      const overdueExpense: ExpenseDTO = {
        ...mockExpense,
        status: ExpenseStatus.OVERDUE,
      };

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={overdueExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Registrar Pagamento/i })).toBeInTheDocument();
    });
  });

  describe('Amount confirmation blocked state', () => {
    it('renders the blocked state with reason and formatted suggested amount', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPendingExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('amount-confirmation-state')).toBeInTheDocument();
      expect(screen.getByTestId('amount-confirmation-reason')).toHaveTextContent(
        'recorrência de valor variável'
      );
      expect(screen.getByTestId('amount-confirmation-suggested')).toHaveTextContent('R$ 100,50');
      // The payment form must NOT be visible while blocked.
      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument();
    });

    it('shows the suggested amount with its origin, never as a bare number', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPendingExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Valor da ocorrência anterior')).toBeInTheDocument();
      expect(screen.getByTestId('amount-confirmation-origin')).toBeInTheDocument();
    });

    it('does NOT render the blocked state for a payable, confirmed expense', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('amount-confirmation-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('does NOT render the blocked state for a PAID expense', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPaidExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('amount-confirmation-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('view-mode-content')).toBeInTheDocument();
    });

    it('does NOT render the blocked state for a CANCELLED, confirmed expense', () => {
      const cancelledExpense: ExpenseDTO = {
        ...mockExpense,
        status: ExpenseStatus.CANCELLED,
        amountPendingConfirmation: false,
      };

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={cancelledExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('amount-confirmation-state')).not.toBeInTheDocument();
    });
  });

  describe('Amount confirmation flow (integration)', () => {
    it('transitions to the payment form on confirm without closing the modal', async () => {
      const user = userEvent.setup();

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPendingExpense}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('amount-confirmation-state')).toBeInTheDocument();

      await user.click(screen.getByTestId('confirm-amount-button'));

      // Same modal, now the payment form — no close, no reopen.
      await waitFor(() => {
        expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('amount-confirmation-state')).not.toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockConfirmAmount).toHaveBeenCalledWith(mockPendingExpense.id);
    });

    it('shows the translated toast and does not get stuck when confirm returns 409', async () => {
      const user = userEvent.setup();
      mockConfirmAmount.mockRejectedValue(
        new Error('Expense amount is already confirmed')
      );

      render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPendingExpense}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('confirm-amount-button'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          CONFIRM_AMOUNT_ERROR_MESSAGES.ALREADY_CONFIRMED
        );
      });

      // Already confirmed elsewhere: the correct state is the payment form.
      await waitFor(() => {
        expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('amount-confirmation-state')).not.toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  // O modal é renderizado por linha do grid, e a prop `expense` vem de
  // `useInfiniteQuery(['expenses'])`. Toda invalidação devolve uma referência
  // nova para a mesma despesa, então o reset não pode reagir à referência — sob
  // pena de apagar um pagamento em preenchimento.
  describe('Form persistence across expense refetches', () => {
    const TYPED_DATE = '2024-06-15';
    const defaultDate = () => new Date().toISOString().split('T')[0];

    it('keeps the filled form when the expenses list refetches while open', () => {
      const { rerender } = render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.change(screen.getByTestId('date-input'), {
        target: { value: TYPED_DATE },
      });
      expect(screen.getByTestId('date-input')).toHaveValue(TYPED_DATE);

      // Um refetch de `['expenses']` entrega a MESMA despesa numa referência nova.
      rerender(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={{ ...mockExpense }}
        />
      );

      expect(screen.getByTestId('date-input')).toHaveValue(TYPED_DATE);
    });

    it('keeps the filled form when the refetch lands after confirming the amount', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockPendingExpense}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('confirm-amount-button'));
      await waitFor(() => {
        expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('date-input'), {
        target: { value: TYPED_DATE },
      });
      expect(screen.getByTestId('date-input')).toHaveValue(TYPED_DATE);

      // A invalidação disparada pela confirmação chega agora, com a despesa já
      // confirmada — e o usuário está no meio do preenchimento.
      rerender(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={{ ...mockPendingExpense, amountPendingConfirmation: false }}
        />
      );

      expect(screen.getByTestId('date-input')).toHaveValue(TYPED_DATE);
      expect(screen.queryByTestId('amount-confirmation-state')).not.toBeInTheDocument();
    });

    it('still resets the form when the modal is closed and reopened', () => {
      const { rerender } = render(
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          expense={mockExpense}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.change(screen.getByTestId('date-input'), {
        target: { value: TYPED_DATE },
      });
      expect(screen.getByTestId('date-input')).toHaveValue(TYPED_DATE);

      const renderWith = (isOpen: boolean) =>
        rerender(
          <PaymentModal
            isOpen={isOpen}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
            expense={mockExpense}
          />
        );

      renderWith(false);
      renderWith(true);

      expect(screen.getByTestId('date-input')).toHaveValue(defaultDate());
    });
  });
});
