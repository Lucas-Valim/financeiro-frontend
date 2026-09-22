import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttachServiceInvoiceModal } from '../AttachServiceInvoiceModal';
import {
  ATTACH_SERVICE_INVOICE_ERROR_MESSAGES,
  ExpenseStatus,
} from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockIsPending = vi.hoisted(() => ({ value: false }));

vi.mock('@/hooks/useAttachServiceInvoice', () => ({
  useAttachServiceInvoice: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending.value,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

const paidExpense = {
  id: 'expense-1',
  description: 'Advento aprendizagem exp',
  status: ExpenseStatus.PAID,
  serviceInvoiceUrl: null,
} as ExpenseDTO;

const invoiceFile = new File(['nota'], 'nota.pdf', { type: 'application/pdf' });

async function selectFile(file: File = invoiceFile) {
  const input = screen.getByTestId('file-input');
  await userEvent.upload(input, file);
}

describe('AttachServiceInvoiceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending.value = false;
    mockMutateAsync.mockResolvedValue(paidExpense);
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      render(
        <AttachServiceInvoiceModal isOpen={false} onClose={vi.fn()} expense={paidExpense} />
      );

      expect(screen.queryByText('Anexar Nota de Serviço')).not.toBeInTheDocument();
    });

    it('renders the title and the expense description', () => {
      render(<AttachServiceInvoiceModal isOpen onClose={vi.fn()} expense={paidExpense} />);

      expect(screen.getByText('Anexar Nota de Serviço')).toBeInTheDocument();
      expect(screen.getByText(/Advento aprendizagem exp/)).toBeInTheDocument();
    });

    it('warns that the current invoice will be replaced when one already exists', () => {
      render(
        <AttachServiceInvoiceModal
          isOpen
          onClose={vi.fn()}
          expense={{
            ...paidExpense,
            serviceInvoiceUrl: 'https://storage.test/bank-bill/antiga.pdf',
          }}
        />
      );

      expect(screen.getByText(/será substituída/)).toBeInTheDocument();
    });

    it('offers only the invoice field, never the other expense fields', () => {
      render(<AttachServiceInvoiceModal isOpen onClose={vi.fn()} expense={paidExpense} />);

      expect(screen.getByText('Nota de Serviço')).toBeInTheDocument();
      expect(screen.queryByText('Boleto')).not.toBeInTheDocument();
      expect(screen.queryByText(/Valor/)).not.toBeInTheDocument();
    });
  });

  describe('Submission', () => {
    it('refuses to submit without a file and does not call the mutation', async () => {
      const user = userEvent.setup();
      render(<AttachServiceInvoiceModal isOpen onClose={vi.fn()} expense={paidExpense} />);

      await user.click(screen.getByRole('button', { name: 'Salvar Nota' }));

      expect(mockToastError).toHaveBeenCalledWith(
        ATTACH_SERVICE_INVOICE_ERROR_MESSAGES.FILE_REQUIRED
      );
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('sends the selected file and closes on success', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<AttachServiceInvoiceModal isOpen onClose={onClose} expense={paidExpense} />);

      await selectFile();
      await user.click(screen.getByRole('button', { name: 'Salvar Nota' }));

      await waitFor(() =>
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 'expense-1',
          serviceInvoice: invoiceFile,
        })
      );
      expect(mockToastSuccess).toHaveBeenCalledWith('Nota de serviço anexada com sucesso');
      expect(onClose).toHaveBeenCalled();
    });

    // A mensagem em pt-BR vem do onError do hook; o modal fica aberto para o
    // usuário tentar de novo sem reescolher o arquivo.
    it('keeps the modal open when the request fails', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockMutateAsync.mockRejectedValue(new Error('Cannot attach'));
      render(<AttachServiceInvoiceModal isOpen onClose={onClose} expense={paidExpense} />);

      await selectFile();
      await user.click(screen.getByRole('button', { name: 'Salvar Nota' }));

      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
      expect(onClose).not.toHaveBeenCalled();
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it('disables both buttons while the upload is in flight', () => {
      mockIsPending.value = true;
      render(<AttachServiceInvoiceModal isOpen onClose={vi.fn()} expense={paidExpense} />);

      expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });
  });

  describe('Dismissal', () => {
    it('closes without submitting when Cancelar is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<AttachServiceInvoiceModal isOpen onClose={onClose} expense={paidExpense} />);

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onClose).toHaveBeenCalled();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    // O componente segue montado entre aberturas: sem a limpeza no fechamento,
    // a próxima abertura traria o arquivo anterior já selecionado.
    it('clears the chosen file when it closes, so the next open starts empty', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const { rerender } = render(
        <AttachServiceInvoiceModal isOpen onClose={onClose} expense={paidExpense} />
      );

      await selectFile();
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      rerender(
        <AttachServiceInvoiceModal isOpen={false} onClose={onClose} expense={paidExpense} />
      );
      rerender(<AttachServiceInvoiceModal isOpen onClose={onClose} expense={paidExpense} />);

      await user.click(screen.getByRole('button', { name: 'Salvar Nota' }));

      expect(mockToastError).toHaveBeenCalledWith(
        ATTACH_SERVICE_INVOICE_ERROR_MESSAGES.FILE_REQUIRED
      );
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });
});
