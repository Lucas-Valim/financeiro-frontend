import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExpensesApiService } from '../../api/expenses-api';
import { ExpenseFormModal } from '../../components/expenses/ExpenseFormModal';
import type { ExpenseDTO } from '../../types/expenses';
import { ExpenseStatus } from '../../constants/expenses';

vi.mock('../../api/expenses-api');

const navigateToDocumentsTab = async (user: UserEvent) => {
  const documentsTab = screen.getByRole('tab', { name: /documentos/i });
  await user.click(documentsTab);
};

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
    receiver: 'google',
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

  describe('Tab navigation', () => {
    it('should have Documents tab accessible', async () => {
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

      const documentsTab = screen.getByRole('tab', { name: /documentos/i });
      expect(documentsTab).toBeInTheDocument();
      
      await user.click(documentsTab);
      
      const serviceInvoiceLabel = screen.getByText(/nota de serviço/i);
      expect(serviceInvoiceLabel).toBeInTheDocument();
      
      const boletoLabel = screen.getByText(/boleto/i);
      expect(boletoLabel).toBeInTheDocument();
    });

    it('should switch between Data and Documents tabs', async () => {
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

      const dataTab = screen.getByRole('tab', { name: /dados/i });
      const documentsTab = screen.getByRole('tab', { name: /documentos/i });

      await user.click(documentsTab);
      expect(screen.getByText(/nota de serviço/i)).toBeInTheDocument();

      await user.click(dataTab);
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    });
  });

  describe('Existing file URLs in edit mode', () => {
    it('should show existing service invoice preview when editing expense', async () => {
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
        receiver: 'google',
        municipality: 'Rio de Janeiro',
        serviceInvoice: null,
        serviceInvoiceUrl: 'https://example.com/existing-invoice.pdf',
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
            onSuccess={vi.fn()}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Editar Despesa')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await navigateToDocumentsTab(user);

      const pdfIcon = screen.getByTestId('pdf-icon');
      expect(pdfIcon).toBeInTheDocument();
      
      const fileNames = screen.getAllByTestId('file-name');
      expect(fileNames[0]).toHaveTextContent('Nota de Serviço');
    });

    it('should show existing bank bill preview when editing expense', async () => {
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
        receiver: 'google',
        municipality: 'Rio de Janeiro',
        serviceInvoice: null,
        serviceInvoiceUrl: null,
        bankBillUrl: 'https://example.com/existing-boleto.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            expense={existingExpense}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Editar Despesa')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await navigateToDocumentsTab(user);

      const previewImage = screen.getByAltText('Boleto');
      expect(previewImage).toHaveAttribute('src', 'https://example.com/existing-boleto.png');
    });

    it('should show both existing file previews when editing expense', async () => {
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
        receiver: 'google',
        municipality: 'Rio de Janeiro',
        serviceInvoice: null,
        serviceInvoiceUrl: 'https://example.com/invoice.pdf',
        bankBillUrl: 'https://example.com/boleto.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <Wrapper>
          <ExpenseFormModal
            isOpen={true}
            expense={existingExpense}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Editar Despesa')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await navigateToDocumentsTab(user);

      const pdfIcon = screen.getByTestId('pdf-icon');
      expect(pdfIcon).toBeInTheDocument();

      const previewImage = screen.getByAltText('Boleto');
      expect(previewImage).toHaveAttribute('src', 'https://example.com/boleto.png');

      const fileNames = screen.getAllByTestId('file-name');
      expect(fileNames).toHaveLength(2);
    });
  });

  describe('Update expense', () => {
    it('should allow updating expense description without changing files', async () => {
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
        receiver: 'google',
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

      const submitButton = screen.getByRole('button', { name: /salvar alterações/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('File upload drop zones', () => {
    it('should render file drop zones in Documents tab', async () => {
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

      await navigateToDocumentsTab(user);

      const dropZones = screen.getAllByTestId('file-drop-zone');
      expect(dropZones).toHaveLength(2);

      const fileInputs = screen.getAllByTestId('file-input');
      expect(fileInputs).toHaveLength(2);
    });

    it('should have correct accepted file types for service invoice', async () => {
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

      await navigateToDocumentsTab(user);

      const fileInputs = screen.getAllByTestId('file-input');
      
      expect(fileInputs[0]).toHaveAttribute('accept', 'application/pdf,image/png,image/jpeg,image/jpg');
      expect(fileInputs[1]).toHaveAttribute('accept', 'application/pdf,image/png,image/jpeg,image/jpg');
    });
  });
});
