import { useQuery } from '@tanstack/react-query';
import { favorecidosApiService } from '../api/favorecidos-api';
import { SELECT_OPTIONS_LIMIT } from '../constants/pagination';
import type { FavorecidoDTO } from '../types/favorecidos';

interface UseFavorecidosReturn {
  favorecidos: FavorecidoDTO[];
  total: number;
  /** The organization has more favorecidos than one request can bring. */
  isTruncated: boolean;
  isLoading: boolean;
  error: Error | null;
}

const FAVORECIDOS_STALE_TIME = 5 * 60 * 1000;

/**
 * Whole list of favorecidos for selects and lookups. Asks for the backend
 * maximum explicitly: without `limit` the API answers only the 20 most recent
 * and the older ones silently vanish from every dropdown.
 */
export function useFavorecidos(organizationId: string): UseFavorecidosReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['favorecidos', organizationId],
    queryFn: () =>
      favorecidosApiService.fetchFavorecidos(organizationId, { limit: SELECT_OPTIONS_LIMIT }),
    enabled: !!organizationId,
    staleTime: FAVORECIDOS_STALE_TIME,
    gcTime: FAVORECIDOS_STALE_TIME,
  });

  const favorecidos = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  return {
    favorecidos,
    total,
    isTruncated: favorecidos.length < total,
    isLoading,
    error: error as Error | null,
  };
}
