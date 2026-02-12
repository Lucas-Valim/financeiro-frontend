import { useCallback, useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ExpensesApiService } from '../api/expenses-api';
import type { ExpenseDTO, ExpenseFilter } from '../types/expenses';
import { EXPENSE_PAGE_LIMIT } from '../constants/expenses';

interface UseExpensesParams {
  filters?: ExpenseFilter;
}

interface UseExpensesReturn {
  data: ExpenseDTO[];
  isLoading: boolean;
  error: unknown;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: unknown[]) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: unknown[]) {
    const later = () => {
      timeout = null;
      func(...(args as Parameters<T>));
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

const expensesApiService = new ExpensesApiService();

export function useExpenses({ filters = {} }: UseExpensesParams = {}): UseExpensesReturn {
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const debouncedSetFilters = debounce((newFilters: unknown) => {
      setDebouncedFilters(newFilters as ExpenseFilter);
    }, 300);

    debouncedSetFilters(filters);

    return () => {
      const cleanup = debounce(() => {}, 0);
      cleanup();
    };
  }, [filters]);

  const query = useInfiniteQuery({
    queryKey: ['expenses', debouncedFilters],
    queryFn: async ({ pageParam }) => {
      const result = await expensesApiService.fetchExpenses(debouncedFilters, {
        page: pageParam as number,
        limit: EXPENSE_PAGE_LIMIT
      });
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.pagination.total / EXPENSE_PAGE_LIMIT);
      const currentPage = lastPage.pagination.page;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    }
  });

  const { data: pages, isLoading, error, hasNextPage, fetchNextPage, refetch } = query;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, isLoading, fetchNextPage]);

  const reset = useCallback(() => {
    setDebouncedFilters(filters);
    refetch();
  }, [filters, refetch]);

  const flattenedData = pages?.pages.flatMap((page) => page.data) ?? [];

  return {
    data: flattenedData,
    isLoading,
    error,
    hasMore: hasNextPage ?? false,
    loadMore,
    reset
  };
}
