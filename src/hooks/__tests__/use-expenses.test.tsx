import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExpenses } from '../use-expenses';
import { ExpensesApiService } from '../../api/expenses-api';
import { ExpenseStatus } from '../../constants/expenses';
import type { ExpenseDTO, ListExpensesOutput, ExpenseFilter } from '../../types/expenses';

vi.mock('../../api/expenses-api');
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@tanstack/react-query');
  return {
    ...actual,
    useInfiniteQuery: vi.fn(),
  };
});

const { useInfiniteQuery } = await import('@tanstack/react-query');

describe('useExpenses', () => {
  const mockExpensesApiService = new ExpensesApiService();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockExpense: ExpenseDTO = {
    id: '1',
    organizationId: 'fca3c088-ba34-43a2-9b32-b2b1a1246915',
    categoryId: null,
    description: 'Test expense',
    amount: 100,
    currency: 'BRL',
    dueDate: new Date('2024-01-01'),
    status: ExpenseStatus.OPEN,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    receiver: 'Test Receiver',
    municipality: 'Test City',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPage1Response: ListExpensesOutput = {
    data: [mockExpense],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
    },
  };

  const mockPage1FullResponse: ListExpensesOutput = {
    data: Array.from({ length: 10 }, (_, i) => ({
      ...mockExpense,
      id: String(i + 1),
    })),
    pagination: {
      page: 1,
      limit: 10,
      total: 25,
    },
  };

  const mockPage2Response: ListExpensesOutput = {
    data: Array.from({ length: 10 }, (_, i) => ({
      ...mockExpense,
      id: String(i + 11),
    })),
    pagination: {
      page: 2,
      limit: 10,
      total: 25,
    },
  };

  const mockPage3PartialResponse: ListExpensesOutput = {
    data: Array.from({ length: 5 }, (_, i) => ({
      ...mockExpense,
      id: String(i + 21),
    })),
    pagination: {
      page: 3,
      limit: 10,
      total: 25,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        hasNextPage: true,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'fetching',
        status: 'pending',
        isError: false,
        isSuccess: false,
        isPaused: false,
      });

      const { result } = renderHook(() => useExpenses({}), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('loadMore', () => {
    it('should call fetchNextPage when hasNextPage is true', () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: {
          pages: [mockPage1FullResponse],
          pageParams: [1],
        },
        isLoading: false,
        error: null,
        hasNextPage: true,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'idle',
        status: 'success',
        isError: false,
        isSuccess: true,
        isPaused: false,
      });

      const { result } = renderHook(() => useExpenses({}), { wrapper });

      result.current.loadMore();

      expect(fetchNextPageMock).toHaveBeenCalled();
    });

    it('should not call fetchNextPage when already fetching', () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: {
          pages: [mockPage1FullResponse],
          pageParams: [1],
        },
        isLoading: true,
        error: null,
        hasNextPage: true,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: true,
        isFetchingNextPage: false,
        fetchStatus: 'fetching',
        status: 'pending',
        isError: false,
        isSuccess: false,
        isPaused: false,
      });

      const { result } = renderHook(() => useExpenses({}), { wrapper });

      result.current.loadMore();

      expect(fetchNextPageMock).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should clear data and refetch from page 1', async () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({
        data: {
          pages: [mockPage1Response],
          pageParams: [1],
        },
      });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: {
          pages: [mockPage1FullResponse, mockPage2Response],
          pageParams: [1, 2],
        },
        isLoading: false,
        error: null,
        hasNextPage: true,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'idle',
        status: 'success',
        isError: false,
        isSuccess: true,
        isPaused: false,
      });

      const { result } = renderHook(() => useExpenses({}), { wrapper });

      result.current.reset();

      await waitFor(() => {
        expect(refetchMock).toHaveBeenCalled();
      });
    });
  });

  describe('debounce', () => {
    it('should use debounced filters for query', async () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        hasNextPage: true,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'fetching',
        status: 'pending',
        isError: false,
        isSuccess: false,
        isPaused: false,
      });

      renderHook(
        ({ filters }) => useExpenses({ filters }),
        {
          wrapper,
          initialProps: { filters: {} as ExpenseFilter },
        }
      );

      const queryConfig = vi.mocked(useInfiniteQuery).mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['expenses', {}]);
    });
  });

  describe('data flattening', () => {
    it('should flatten pages array into single array', () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: {
          pages: [mockPage1FullResponse, mockPage2Response, mockPage3PartialResponse],
          pageParams: [1, 2, 3],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'idle',
        status: 'success',
        isError: false,
        isSuccess: true,
        isPaused: false,
      });

      const { result } = renderHook(() => useExpenses({}), { wrapper });

      expect(result.current.data).toHaveLength(25);
      expect(result.current.data[0].id).toBe('1');
      expect(result.current.data[10].id).toBe('11');
      expect(result.current.data[20].id).toBe('21');
    });
  });

  describe('hasMore calculation', () => {
    it('should be false when last page returns fewer items than page size', () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: {
          pages: [mockPage1FullResponse, mockPage2Response, mockPage3PartialResponse],
          pageParams: [1, 2, 3],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'idle',
        status: 'success',
        isError: false,
        isSuccess: true,
        isPaused: false,
      });

      const { result } = renderHook(() => useExpenses({}), { wrapper });

      expect(result.current.hasMore).toBe(false);
    });

    it('should be true when there are more pages available', () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: {
          pages: [mockPage1FullResponse, mockPage2Response],
          pageParams: [1, 2],
        },
        isLoading: false,
        error: null,
        hasNextPage: true,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'idle',
        status: 'success',
        isError: false,
        isSuccess: true,
        isPaused: false,
      });

      const { result } = renderHook(() => useExpenses({}), { wrapper });

      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should populate error state on query failure', () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });
      const mockError = new Error('Network error');

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        hasNextPage: false,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'idle',
        status: 'error',
        isError: true,
        isSuccess: false,
        isPaused: false,
      });

      const { result } = renderHook(() => useExpenses({}), { wrapper });

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('ExpensesApiService integration', () => {
    it('should integrate with ExpensesApiService.fetchExpenses correctly', () => {
      vi.mocked(mockExpensesApiService.fetchExpenses).mockResolvedValue(
        mockPage1Response
      );

      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        hasNextPage: true,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'fetching',
        status: 'pending',
        isError: false,
        isSuccess: false,
        isPaused: false,
      });

      renderHook(() => useExpenses({}), { wrapper });

      expect(useInfiniteQuery).toHaveBeenCalled();
      const queryConfig = vi.mocked(useInfiniteQuery).mock.calls[0][0];
      expect(queryConfig.queryKey).toContain('expenses');
    });
  });

  describe('query key', () => {
    it('should include filters in query key', () => {
      const fetchNextPageMock = vi.fn();
      const refetchMock = vi.fn().mockResolvedValue({ data: undefined });

      // @ts-expect-error - Mocking useInfiniteQuery return type with partial properties
    vi.mocked(useInfiniteQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        hasNextPage: true,
        fetchNextPage: fetchNextPageMock,
        refetch: refetchMock,
        isFetching: false,
        isFetchingNextPage: false,
        fetchStatus: 'fetching',
        status: 'pending',
        isError: false,
        isSuccess: false,
        isPaused: false,
      });

      const filters = { status: ExpenseStatus.OPEN };
      renderHook(
        () => useExpenses({ filters }),
        { wrapper }
      );

      const queryConfig = vi.mocked(useInfiniteQuery).mock.calls[0][0];
      expect(queryConfig.queryKey).toContain('expenses');
      expect(queryConfig.queryKey).toContain(filters);
    });
  });
});
