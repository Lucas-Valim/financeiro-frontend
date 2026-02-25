import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCategories } from '../use-categories';
import { categoriesApiService } from '../../api/categories-api';
import type { CategoryDTO } from '../../types/categories';

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
      expect(result.current.isLoading).toBe(true);
    });

    it('should fetch categories when organizationId provided', async () => {
      mockedFetchCategories.mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedFetchCategories).toHaveBeenCalledWith('org-123');
      expect(result.current.categories).toEqual(mockCategories);
    });

    it('should return categories from successful fetch', async () => {
      mockedFetchCategories.mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2);
      });

      expect(result.current.categories[0].name).toBe('Combustível');
      expect(result.current.categories[1].name).toBe('Alimentação');
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
      mockedFetchCategories.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockCategories), 100)));

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should return empty array when data is undefined', async () => {
      mockedFetchCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useCategories('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.categories).toEqual([]);
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
