import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAttachServiceInvoice } from '../useAttachServiceInvoice';
import {
  ATTACH_SERVICE_INVOICE_ERROR_MESSAGES,
  ExpenseStatus,
} from '../../constants/expenses';
import type { ExpenseDTO } from '../../types/expenses';

const mockAttachServiceInvoice = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock('../../api/expenses-api', () => ({
  ExpensesApiService: class {
    attachServiceInvoice = mockAttachServiceInvoice;
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}));

const invoiceFile = new File(['nota'], 'nota.pdf', { type: 'application/pdf' });

const updatedExpense = {
  id: 'expense-1',
  status: ExpenseStatus.PAID,
  serviceInvoiceUrl: 'https://storage.test/bank-bill/nota.pdf',
} as ExpenseDTO;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, queryClient };
}

describe('useAttachServiceInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAttachServiceInvoice.mockResolvedValue(updatedExpense);
  });

  describe('success', () => {
    it('should call the api with the expense id and the file', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useAttachServiceInvoice(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ id: 'expense-1', serviceInvoice: invoiceFile });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockAttachServiceInvoice).toHaveBeenCalledWith({
        id: 'expense-1',
        serviceInvoice: invoiceFile,
      });
      expect(result.current.data?.serviceInvoiceUrl).toBe(
        'https://storage.test/bank-bill/nota.pdf'
      );
    });

    it('should invalidate the expenses query so the list and the calendar refetch', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useAttachServiceInvoice(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ id: 'expense-1', serviceInvoice: invoiceFile });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] });
    });

    // Anexar a nota não muda valor nem situação: revalidar os cards e o
    // relatório seria tráfego à toa.
    it('should not invalidate the summary or the report totals', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useAttachServiceInvoice(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ id: 'expense-1', serviceInvoice: invoiceFile });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: ['expenses-summary'],
      });
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: ['expense-report-summary'],
      });
    });
  });

  describe('failure', () => {
    it('should show the translated message when the expense is cancelled', async () => {
      mockAttachServiceInvoice.mockRejectedValue(
        new Error('Cannot attach service invoice to expense with status CANCELLED')
      );
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useAttachServiceInvoice(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ id: 'expense-1', serviceInvoice: invoiceFile });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(mockToastError).toHaveBeenCalledWith(
        ATTACH_SERVICE_INVOICE_ERROR_MESSAGES.NOT_ATTACHABLE
      );
    });

    it('should show the generic message for an unknown failure', async () => {
      mockAttachServiceInvoice.mockRejectedValue(new Error('Network down'));
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useAttachServiceInvoice(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ id: 'expense-1', serviceInvoice: invoiceFile });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(mockToastError).toHaveBeenCalledWith(
        ATTACH_SERVICE_INVOICE_ERROR_MESSAGES.DEFAULT
      );
    });

    it('should not invalidate any query when the request fails', async () => {
      mockAttachServiceInvoice.mockRejectedValue(new Error('Network down'));
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useAttachServiceInvoice(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ id: 'expense-1', serviceInvoice: invoiceFile });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });
});
