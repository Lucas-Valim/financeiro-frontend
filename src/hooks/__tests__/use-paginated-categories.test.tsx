import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePaginatedCategories } from '../use-paginated-categories';
import { categoriesApiService } from '../../api/categories-api';
import { GRID_PAGE_LIMIT } from '../../constants/pagination';
import type { CategoriesListResponse, CategoryDTO } from '../../types/categories';

vi.mock('../../api/categories-api', () => ({
  categoriesApiService: {
    fetchCategories: vi.fn(),
  },
}));

function buildCategory(id: string): CategoryDTO {
  return {
    id,
    organizationId: 'org-123',
    name: `Categoria ${id}`,
    description: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function buildPage(page: number, size: number, total: number): CategoriesListResponse {
  return {
    data: Array.from({ length: size }, (_, index) => buildCategory(`p${page}-${index}`)),
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

const EMPTY_FILTER = { name: '' };

describe('usePaginatedCategories', () => {
  const mockedFetch = vi.mocked(categoriesApiService.fetchCategories);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests the first page with the grid page limit and no name filter', async () => {
    mockedFetch.mockResolvedValue(buildPage(1, 3, 3));

    const { result } = renderHook(
      () => usePaginatedCategories({ organizationId: 'org-123', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetch).toHaveBeenCalledWith('org-123', {
      page: 1,
      limit: GRID_PAGE_LIMIT,
      name: '',
    });
    expect(result.current.categories).toHaveLength(3);
    expect(result.current.total).toBe(3);
  });

  it('reports no more pages when the total fits in one page', async () => {
    mockedFetch.mockResolvedValue(buildPage(1, 3, 3));

    const { result } = renderHook(
      () => usePaginatedCategories({ organizationId: 'org-123', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);
  });

  it('appends the next page when loadMore is called and more pages exist', async () => {
    const total = GRID_PAGE_LIMIT + 1;
    mockedFetch
      .mockResolvedValueOnce(buildPage(1, GRID_PAGE_LIMIT, total))
      .mockResolvedValueOnce(buildPage(2, 1, total));

    const { result } = renderHook(
      () => usePaginatedCategories({ organizationId: 'org-123', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(total);
    });

    expect(mockedFetch).toHaveBeenLastCalledWith('org-123', {
      page: 2,
      limit: GRID_PAGE_LIMIT,
      name: '',
    });
    expect(result.current.hasMore).toBe(false);
    expect(result.current.total).toBe(total);
  });

  it('sends the trimmed name filter to the API after the debounce', async () => {
    mockedFetch.mockResolvedValue(buildPage(1, 1, 1));

    const { result, rerender } = renderHook(
      ({ filter }) => usePaginatedCategories({ organizationId: 'org-123', filter }),
      { wrapper: createWrapper(), initialProps: { filter: EMPTY_FILTER } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ filter: { name: '  Alim ' } });

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenLastCalledWith('org-123', {
        page: 1,
        limit: GRID_PAGE_LIMIT,
        name: 'Alim',
      });
    });
  });

  it('keeps the previous rows on screen while a new filter is loading', async () => {
    let resolveFiltered: (value: CategoriesListResponse) => void = () => {};
    mockedFetch
      .mockResolvedValueOnce(buildPage(1, 3, 3))
      .mockImplementationOnce(
        () => new Promise<CategoriesListResponse>((resolve) => { resolveFiltered = resolve; })
      );

    const { result, rerender } = renderHook(
      ({ filter }) => usePaginatedCategories({ organizationId: 'org-123', filter }),
      { wrapper: createWrapper(), initialProps: { filter: EMPTY_FILTER } }
    );

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(3);
    });

    rerender({ filter: { name: 'Cat' } });

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(2);
    });

    expect(result.current.categories).toHaveLength(3);
    expect(result.current.isLoading).toBe(false);

    act(() => {
      resolveFiltered(buildPage(1, 1, 1));
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });
  });

  it('refetches the current list when refetch is called', async () => {
    mockedFetch.mockResolvedValue(buildPage(1, 2, 2));

    const { result } = renderHook(
      () => usePaginatedCategories({ organizationId: 'org-123', filter: EMPTY_FILTER }),
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
      () => usePaginatedCategories({ organizationId: 'org-123', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe('boom');
    expect(result.current.categories).toEqual([]);
  });

  it('does not fetch without an organizationId', () => {
    const { result } = renderHook(
      () => usePaginatedCategories({ organizationId: '', filter: EMPTY_FILTER }),
      { wrapper: createWrapper() }
    );

    expect(mockedFetch).not.toHaveBeenCalled();
    expect(result.current.categories).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });
});
