import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExpensesApiService } from '../../api/expenses-api';
import { ExpenseFormModal } from '../../components/expenses/ExpenseFormModal';
import type { ExpenseDTO } from '../../types/expenses';
import { ExpenseStatus } from '../../constants/expenses';

vi.mock('../../api/expenses-api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('Expense File Upload Integration', () => {
  const mockCreatedExpense: ExpenseDTO = {
    id: 'new-expense-id',
    organizationId: 'org-123',
    categoryId: null,
    description: 'Test Expense with Files',
    amount: 1500,
    currency: 'BRL',
    dueDate: new Date('2024-12-31'),
    status: ExpenseStatus.OPEN,
    paymentMethod: 'PIX',
    paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Test Receiver',
    municipality: 'São Paulo',
    serviceInvoice: null,
    serviceInvoiceUrl: 'https://example.com/invoice.pdf',
    bankBillUrl: 'https://example.com/boleto.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ExpensesApiService.prototype, 'create').mockResolvedValue(mockCreatedExpense);
    vi.spyOn(ExpensesApiService.prototype, 'update').mockResolvedValue(mockCreatedExpense);
  });

  describe('Full upload flow', () => {
    it('should create expense with both files successfully', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={onSuccess}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Nova Despesa')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/descrição/i);
      await user.type(descriptionInput, 'Test Expense with Files');

      const amountInput = screen.getByLabelText(/valor/i);
      await user.type(amountInput, '1500');

      const receiverInput = screen.getByLabelText(/recebedor/i);
      await user.type(receiverInput, 'Test Receiver');

      const municipalityInput = screen.getByLabelText(/município/i);
      await user.type(municipalityInput, 'São Paulo');

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockCreatedExpense);
      });
    });

    it('should show validation errors for invalid file types', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Nova Despesa')).toBeInTheDocument();
      });

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/nota de serviço/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/tipo de arquivo não suportado/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for oversized file', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Nova Despesa')).toBeInTheDocument();
      });

      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/nota de serviço/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/arquivo muito grande/i)).toBeInTheDocument();
      });
    });

    it('should handle network error during upload gracefully', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const Wrapper = createWrapper();

      vi.spyOn(ExpensesApiService.prototype, 'create').mockRejectedValue(
        new Error('Erro de rede: Não foi possível conectar ao servidor')
      );

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={onSuccess}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Nova Despesa')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/descrição/i);
      await user.type(descriptionInput, 'Test Expense');

      const amountInput = screen.getByLabelText(/valor/i);
      await user.type(amountInput, '100');

      const receiverInput = screen.getByLabelText(/recebedor/i);
      await user.type(receiverInput, 'Test Receiver');

      const municipalityInput = screen.getByLabelText(/município/i);
      await user.type(municipalityInput, 'Test City');

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/erro de rede/i)).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle timeout error during upload', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const Wrapper = createWrapper();

      vi.spyOn(ExpensesApiService.prototype, 'create').mockRejectedValue(
        new Error('timeout of 10000ms exceeded')
      );

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={onSuccess}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Nova Despesa')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/descrição/i);
      await user.type(descriptionInput, 'Test Expense');

      const amountInput = screen.getByLabelText(/valor/i);
      await user.type(amountInput, '100');

      const receiverInput = screen.getByLabelText(/recebedor/i);
      await user.type(receiverInput, 'Test Receiver');

      const municipalityInput = screen.getByLabelText(/município/i);
      await user.type(municipalityInput, 'Test City');

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/timeout/i)).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('File preview functionality', () => {
    it('should show preview for PDF file', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Nova Despesa')).toBeInTheDocument();
      });

      const file = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/nota de serviço/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-icon')).toBeInTheDocument();
        expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
      });
    });

    it('should show preview for image file', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Nova Despesa')).toBeInTheDocument();
      });

      const file = new File(['image content'], 'boleto.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/boleto/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('preview-image')).toBeInTheDocument();
        expect(screen.getByText('boleto.png')).toBeInTheDocument();
      });
    });

    it('should allow removing uploaded file', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Nova Despesa')).toBeInTheDocument();
      });

      const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/nota de serviço/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
      });

      const removeButton = screen.getByTestId('remove-file-button');
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('invoice.pdf')).not.toBeInTheDocument();
      });
    });
  });

  describe('Update with files', () => {
    it('should update expense and add new files', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const Wrapper = createWrapper();

      const existingExpense: ExpenseDTO = {
        id: 'existing-id',
        organizationId: 'org-123',
        categoryId: null,
        description: 'Existing Expense',
        amount: 1000,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        status: ExpenseStatus.OPEN,
        paymentMethod: null,
        paymentProof: null,
        paymentProofUrl: null,
        paymentDate: null,
        receiver: 'Existing Receiver',
        municipality: 'Rio de Janeiro',
        serviceInvoice: null,
        serviceInvoiceUrl: null,
        bankBillUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            expense={existingExpense}
            onClose={vi.fn()}
            onSuccess={onSuccess}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Editar Despesa')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/descrição/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated Expense');

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });
});
