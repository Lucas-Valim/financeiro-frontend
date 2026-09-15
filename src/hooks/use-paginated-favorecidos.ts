import { useCallback } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { favorecidosApiService } from '../api/favorecidos-api';
import { GRID_PAGE_LIMIT } from '../constants/pagination';
import type { FavorecidoDTO, FavorecidosListResponse } from '../types/favorecidos';
import { useDebouncedValue } from './useDebouncedValue';

export interface FavorecidosGridFilter {
  name: string;
  /** Raw user input; non-digits are stripped before reaching the API. */
  document: string;
}

interface UsePaginatedFavorecidosParams {
  organizationId: string;
  filter: FavorecidosGridFilter;
}

interface UsePaginatedFavorecidosReturn {
  favorecidos: FavorecidoDTO[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

const NON_DIGITS = /\D/g;

function nextPageOf(lastPage: FavorecidosListResponse): number | undefined {
  const { page, total } = lastPage.pagination;
  const totalPages = Math.ceil(total / GRID_PAGE_LIMIT);
  return page < totalPages ? page + 1 : undefined;
}

/**
 * Server-paginated list for the favorecidos grid: name and document filters
 * are sent to the API (debounced, since the filter modal applies them as the
 * user types) and pages are appended for the `DataGrid` infinite scroll.
 *
 * The query key keeps the `['favorecidos', organizationId]` prefix so the
 * existing create/update/delete invalidations refresh this list too.
 * `keepPreviousData` holds the rows on screen while a new filter loads, so
 * typing in the filter refines the grid instead of flashing the spinner.
 */
export function usePaginatedFavorecidos({
  organizationId,
  filter,
}: UsePaginatedFavorecidosParams): UsePaginatedFavorecidosReturn {
  const name = useDebouncedValue(filter.name.trim());
  const document = useDebouncedValue(filter.document.replace(NON_DIGITS, ''));

  const query = useInfiniteQuery({
    queryKey: ['favorecidos', organizationId, 'grid', { name, document }],
    queryFn: ({ pageParam }) =>
      favorecidosApiService.fetchFavorecidos(organizationId, {
        page: pageParam,
        limit: GRID_PAGE_LIMIT,
        name,
        document,
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
    favorecidos: data?.pages.flatMap((page) => page.data) ?? [],
    total: data?.pages[0]?.pagination.total ?? 0,
    isLoading,
    error: error as Error | null,
    hasMore: hasNextPage ?? false,
    loadMore,
    refetch,
  };
}
