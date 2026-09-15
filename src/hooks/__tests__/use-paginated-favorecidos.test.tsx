import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePaginatedFavorecidos } from '../use-paginated-favorecidos';
import { favorecidosApiService } from '../../api/favorecidos-api';
import { GRID_PAGE_LIMIT } from '../../constants/pagination';
import type { FavorecidoDTO, FavorecidosListResponse } from '../../types/favorecidos';

vi.mock('../../api/favorecidos-api', () => ({
  favorecidosApiService: {
    fetchFavorecidos: vi.fn(),
  },
}));

function buildFavorecido(id: string): FavorecidoDTO {
  return {
    id,
    organizationId: 'org-123',
    name: `Favorecido ${id}`,
    document: null,
    documentType: null,
    zipCode: null,
    street: null,
    number: null,
    city: null,
    state: null,
    phone: null,
    email: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function buildPage(page: number, size: number, total: number): FavorecidosListResponse {
  return {
    data: Array.from({ length: size }, (_, index) => buildFavorecido(`p${page}-${index}`)),
    pagination: { page, limit: GRID_PAGE_LIMIT, total },
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const EMPTY_FILTER = { name: '', document: '' };

describe('usePaginatedFavorecidos', () => {
  const mockedFetch = vi.mocked(favorecidosApiService.fetchFavorecidos);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests the first page with the grid page limit and empty filters', async () => {
    mockedFetch.mockResolvedValue(buildPage(1, 2, 2));

    const { result } = renderHook(
      () => usePaginatedFavorecidos({ organizationId: 'org-123', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetch).toHaveBeenCalledWith('org-123', {
      page: 1,
      limit: GRID_PAGE_LIMIT,
      name: '',
      document: '',
    });
    expect(result.current.favorecidos).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });

  it('appends the next page when loadMore is called and more pages exist', async () => {
    const total = GRID_PAGE_LIMIT + 7;
    mockedFetch
      .mockResolvedValueOnce(buildPage(1, GRID_PAGE_LIMIT, total))
      .mockResolvedValueOnce(buildPage(2, 7, total));

    const { result } = renderHook(
      () => usePaginatedFavorecidos({ organizationId: 'org-123', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.favorecidos).toHaveLength(total);
    });

    expect(mockedFetch).toHaveBeenLastCalledWith('org-123', {
      page: 2,
      limit: GRID_PAGE_LIMIT,
      name: '',
      document: '',
    });
    expect(result.current.hasMore).toBe(false);
  });

  it('sends the trimmed name and digits-only document after the debounce', async () => {
    mockedFetch.mockResolvedValue(buildPage(1, 1, 1));

    const { result, rerender } = renderHook(
      ({ filter }) => usePaginatedFavorecidos({ organizationId: 'org-123', filter }),
      { wrapper: createWrapper(), initialProps: { filter: EMPTY_FILTER } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ filter: { name: ' Silva ', document: '123.456' } });

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenLastCalledWith('org-123', {
        page: 1,
        limit: GRID_PAGE_LIMIT,
        name: 'Silva',
        document: '123456',
      });
    });
  });

  it('keeps the previous rows on screen while a new filter is loading', async () => {
    let resolveFiltered: (value: FavorecidosListResponse) => void = () => {};
    mockedFetch
      .mockResolvedValueOnce(buildPage(1, 3, 3))
      .mockImplementationOnce(
        () => new Promise<FavorecidosListResponse>((resolve) => { resolveFiltered = resolve; })
      );

    const { result, rerender } = renderHook(
      ({ filter }) => usePaginatedFavorecidos({ organizationId: 'org-123', filter }),
      { wrapper: createWrapper(), initialProps: { filter: EMPTY_FILTER } }
    );

    await waitFor(() => {
      expect(result.current.favorecidos).toHaveLength(3);
    });

    rerender({ filter: { name: 'Fav', document: '' } });

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(2);
    });

    expect(result.current.favorecidos).toHaveLength(3);
    expect(result.current.isLoading).toBe(false);

    act(() => {
      resolveFiltered(buildPage(1, 1, 1));
    });

    await waitFor(() => {
      expect(result.current.favorecidos).toHaveLength(1);
    });
  });

  it('refetches the current list when refetch is called', async () => {
    mockedFetch.mockResolvedValue(buildPage(1, 2, 2));

    const { result } = renderHook(
      () => usePaginatedFavorecidos({ organizationId: 'org-123', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('exposes the error when the request fails', async () => {
    mockedFetch.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(
      () => usePaginatedFavorecidos({ organizationId: 'org-123', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe('boom');
    expect(result.current.favorecidos).toEqual([]);
  });

  it('does not fetch without an organizationId', () => {
    const { result } = renderHook(
      () => usePaginatedFavorecidos({ organizationId: '', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    expect(mockedFetch).not.toHaveBeenCalled();
    expect(result.current.favorecidos).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });
});
