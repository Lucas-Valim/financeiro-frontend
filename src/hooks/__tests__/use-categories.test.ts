import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCategories } from '../use-categories';
import { categoriesApiService } from '../../api/categories-api';
import { SELECT_OPTIONS_LIMIT } from '../../constants/pagination';
import type { CategoriesListResponse, CategoryDTO } from '../../types/categories';

vi.mock('../../api/categories-api', () => ({
  categoriesApiService: {
    fetchCategories: vi.fn(),
  },
}));

const mockCategories: CategoryDTO[] = [
  {
    id: 'cat-1',
    organizationId: 'org-123',
    name: 'Combustível',
    description: 'Combustível',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-2',
    organizationId: 'org-123',
    name: 'Alimentação',
    description: 'Alimentação',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

function buildResponse(total: number): CategoriesListResponse {
  return {
    data: mockCategories,
    pagination: { page: 1, limit: SELECT_OPTIONS_LIMIT, total },
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe('useCategories', () => {
  const mockedFetchCategories = vi.mocked(categoriesApiService.fetchCategories);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with organizationId', () => {
    it('should return empty array initially', () => {
      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.categories).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.isTruncated).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });

    it('should request the whole list with the select options limit', async () => {
      mockedFetchCategories.mockResolvedValue(buildResponse(2));

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedFetchCategories).toHaveBeenCalledWith('org-123', {
        limit: SELECT_OPTIONS_LIMIT,
      });
      expect(result.current.categories).toEqual(mockCategories);
    });

    it('should expose the server total and no truncation when everything came', async () => {
      mockedFetchCategories.mockResolvedValue(buildResponse(2));

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2);
      });

      expect(result.current.total).toBe(2);
      expect(result.current.isTruncated).toBe(false);
    });

    it('should flag truncation when the server total exceeds the received items', async () => {
      mockedFetchCategories.mockResolvedValue(buildResponse(150));

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2);
      });

      expect(result.current.total).toBe(150);
      expect(result.current.isTruncated).toBe(true);
    });

    it('should return error on fetch failure', async () => {
      mockedFetchCategories.mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch');
    });

    it('should return isLoading true during fetch', async () => {
      mockedFetchCategories.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(buildResponse(2)), 100))
      );

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should return empty array when the response has no data', async () => {
      mockedFetchCategories.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: SELECT_OPTIONS_LIMIT, total: 0 },
      });

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.categories).toEqual([]);
      expect(result.current.isTruncated).toBe(false);
    });
  });

  describe('without organizationId', () => {
    it('should not fetch when organizationId is empty', () => {
      const { result } = renderHook(() => useCategories(''), {
        wrapper: createWrapper(),
      });

      expect(mockedFetchCategories).not.toHaveBeenCalled();
      expect(result.current.categories).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return empty array when organizationId is empty', () => {
      const { result } = renderHook(() => useCategories(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.categories).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
