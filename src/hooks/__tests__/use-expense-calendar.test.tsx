import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useExpenseCalendar } from '../use-expense-calendar';
import { ExpenseStatus } from '../../constants/expenses';
import type { ExpenseDTO } from '../../types/expenses';

const mockFetchExpenses = vi.hoisted(() => vi.fn());

vi.mock('../../api/expenses-api', () => ({
  ExpensesApiService: class MockExpensesApiService {
    fetchExpenses = mockFetchExpenses;
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useExpenseCalendar', () => {
  const mockExpenses: ExpenseDTO[] = [
    {
      id: 'exp-1',
      organizationId: 'org-1',
      categoryId: 'cat-1',
      description: 'Expense 1',
      amount: 100,
      currency: 'BRL',
      dueDate: new Date('2024-01-15'),
      status: ExpenseStatus.OPEN,
      paymentMethod: null,
      paymentProof: null,
      paymentProofUrl: null,
      paymentDate: null,
      receiver: 'Receiver A',
      municipality: 'City A',
      serviceInvoice: null,
      serviceInvoiceUrl: null,
      bankBillUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'exp-2',
      organizationId: 'org-1',
      categoryId: 'cat-2',
      description: 'Expense 2',
      amount: 200,
      currency: 'BRL',
      dueDate: new Date('2024-01-20'),
      status: ExpenseStatus.PAID,
      paymentMethod: 'PIX',
      paymentProof: null,
      paymentProofUrl: null,
      paymentDate: new Date('2024-01-20'),
      receiver: 'Receiver B',
      municipality: 'City B',
      serviceInvoice: null,
      serviceInvoiceUrl: null,
      bankBillUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 'exp-3',
      organizationId: 'org-1',
      categoryId: null,
      description: 'Expense 3',
      amount: 150,
      currency: 'BRL',
      dueDate: new Date('2024-01-25'),
      status: ExpenseStatus.OVERDUE,
      paymentMethod: null,
      paymentProof: null,
      paymentProofUrl: null,
      paymentDate: null,
      receiver: 'Receiver A',
      municipality: 'City A',
      serviceInvoice: null,
      serviceInvoiceUrl: null,
      bankBillUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-25'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchExpenses.mockResolvedValue({
      data: mockExpenses,
      pagination: { page: 1, limit: 100, total: mockExpenses.length },
    });
  });

  describe('month view', () => {
    it('should calculate correct date range for month view', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: {},
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchExpenses).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDateStart: expect.any(Date),
          dueDateEnd: expect.any(Date),
        }),
        expect.any(Object)
      );
    });

    it('should fetch expenses for month view', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: {},
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.expenses).toEqual(mockExpenses);
    });
  });

  describe('week view', () => {
    it('should calculate correct date range for week view', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'week',
            filters: {},
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchExpenses).toHaveBeenCalled();
    });
  });

  describe('day view', () => {
    it('should calculate correct date range for day view', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'day',
            filters: {},
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchExpenses).toHaveBeenCalled();
    });
  });

  describe('filters', () => {
    it('should apply status filter', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: { status: ExpenseStatus.OPEN },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchExpenses).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ExpenseStatus.OPEN,
        }),
        expect.any(Object)
      );
    });

    it('should apply receiver filter', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: { receiver: 'Receiver A' },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchExpenses).toHaveBeenCalledWith(
        expect.objectContaining({
          receiver: 'Receiver A',
        }),
        expect.any(Object)
      );
    });

    it('should apply categoryId filter', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: { categoryId: 'cat-1' },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchExpenses).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-1',
        }),
        expect.any(Object)
      );
    });

    it('should apply all filters combined', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: {
              status: ExpenseStatus.OPEN,
              receiver: 'Receiver A',
              categoryId: 'cat-1',
            },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchExpenses).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ExpenseStatus.OPEN,
          receiver: 'Receiver A',
          categoryId: 'cat-1',
        }),
        expect.any(Object)
      );
    });
  });

  describe('receivers extraction', () => {
    it('should extract unique receivers from expenses', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: {},
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.receivers).toContain('Receiver A');
      expect(result.current.receivers).toContain('Receiver B');
    });

    it('should sort receivers alphabetically', async () => {
      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: {},
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.receivers).toEqual(['Receiver A', 'Receiver B']);
    });

    it('should return empty receivers array when no expenses', async () => {
      mockFetchExpenses.mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 100, total: 0 },
      });

      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: {},
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.receivers).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      mockFetchExpenses.mockRejectedValue(new Error('Network error'));

      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: {},
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('loading state', () => {
    it('should return loading state correctly', async () => {
      mockFetchExpenses.mockImplementation(() => new Promise(() => {}));

      const currentDate = new Date('2024-01-15');

      const { result } = renderHook(
        () =>
          useExpenseCalendar({
            currentDate,
            view: 'month',
            filters: {},
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.expenses).toEqual([]);
    });
  });
});
