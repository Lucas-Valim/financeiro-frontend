import { useQuery } from '@tanstack/react-query';
import { favorecidosApiService } from '../api/favorecidos-api';
import type { FavorecidoDTO } from '../types/favorecidos';

interface UseFavorecidosReturn {
  favorecidos: FavorecidoDTO[];
  isLoading: boolean;
  error: Error | null;
}

const FAVORECIDOS_STALE_TIME = 5 * 60 * 1000;

export function useFavorecidos(organizationId: string): UseFavorecidosReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['favorecidos', organizationId],
    queryFn: () => favorecidosApiService.fetchFavorecidos(organizationId),
    enabled: !!organizationId,
    staleTime: FAVORECIDOS_STALE_TIME,
    gcTime: FAVORECIDOS_STALE_TIME,
  });

  return {
    favorecidos: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
