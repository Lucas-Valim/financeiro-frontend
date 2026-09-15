import { useCallback } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { categoriesApiService } from '../api/categories-api';
import { GRID_PAGE_LIMIT } from '../constants/pagination';
import type { CategoriesListResponse, CategoryDTO } from '../types/categories';
import { useDebouncedValue } from './useDebouncedValue';

export interface CategoriesGridFilter {
  name: string;
}

interface UsePaginatedCategoriesParams {
  organizationId: string;
  filter: CategoriesGridFilter;
}

interface UsePaginatedCategoriesReturn {
  categories: CategoryDTO[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

function nextPageOf(lastPage: CategoriesListResponse): number | undefined {
  const { page, total } = lastPage.pagination;
  const totalPages = Math.ceil(total / GRID_PAGE_LIMIT);
  return page < totalPages ? page + 1 : undefined;
}

/**
 * Server-paginated list for the categorias grid: the name filter is sent to
 * the API (debounced, since the filter modal applies it as the user types) and
 * pages are appended for the `DataGrid` infinite scroll.
 *
 * The query key keeps the `['categories', organizationId]` prefix so the
 * existing create/update/delete invalidations refresh this list too.
 * `keepPreviousData` holds the rows on screen while a new filter loads, so
 * typing in the filter refines the grid instead of flashing the spinner.
 */
export function usePaginatedCategories({
  organizationId,
  filter,
}: UsePaginatedCategoriesParams): UsePaginatedCategoriesReturn {
  const name = useDebouncedValue(filter.name.trim());

  const query = useInfiniteQuery({
    queryKey: ['categories', organizationId, 'grid', { name }],
    queryFn: ({ pageParam }) =>
      categoriesApiService.fetchCategories(organizationId, {
        page: pageParam,
        limit: GRID_PAGE_LIMIT,
        name,
      }),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
  });

  const { data, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = query;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    categories: data?.pages.flatMap((page) => page.data) ?? [],
    total: data?.pages[0]?.pagination.total ?? 0,
    isLoading,
    error: error as Error | null,
    hasMore: hasNextPage ?? false,
    loadMore,
    refetch,
  };
}
