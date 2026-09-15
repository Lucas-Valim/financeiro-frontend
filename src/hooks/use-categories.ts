import { useQuery } from '@tanstack/react-query';
import { categoriesApiService } from '../api/categories-api';
import { SELECT_OPTIONS_LIMIT } from '../constants/pagination';
import type { CategoryDTO } from '../types/categories';

interface UseCategoriesReturn {
  categories: CategoryDTO[];
  total: number;
  /** The organization has more categories than one request can bring. */
  isTruncated: boolean;
  isLoading: boolean;
  error: Error | null;
}

// 5-min stale time: invalidations from this tab refetch immediately, but
// changes from other tabs may not appear for up to 5 min. Acceptable for this feature.
const CATEGORIES_STALE_TIME = 5 * 60 * 1000;

/**
 * Whole list of categories for selects and lookups. Asks for the backend
 * maximum explicitly: without `limit` the API answers only the 20 most recent
 * and the older ones silently vanish from every dropdown.
 */
export function useCategories(organizationId: string): UseCategoriesReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories', organizationId],
    queryFn: () =>
      categoriesApiService.fetchCategories(organizationId, { limit: SELECT_OPTIONS_LIMIT }),
    enabled: !!organizationId,
    staleTime: CATEGORIES_STALE_TIME,
    gcTime: CATEGORIES_STALE_TIME,
  });

  const categories = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  return {
    categories,
    total,
    isTruncated: categories.length < total,
    isLoading,
    error: error as Error | null,
  };
}
