import { useQuery } from '@tanstack/react-query';
import { categoriesApiService } from '../api/categories-api';
import type { CategoryDTO } from '../types/categories';

interface UseCategoriesReturn {
  categories: CategoryDTO[];
  isLoading: boolean;
  error: Error | null;
}

const CATEGORIES_STALE_TIME = 5 * 60 * 1000;

export function useCategories(organizationId: string): UseCategoriesReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories', organizationId],
    queryFn: () => categoriesApiService.fetchCategories(organizationId),
    enabled: !!organizationId,
    staleTime: CATEGORIES_STALE_TIME,
    gcTime: CATEGORIES_STALE_TIME,
  });

  return {
    categories: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
