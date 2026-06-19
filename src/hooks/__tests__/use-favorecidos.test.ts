import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFavorecidos } from '../use-favorecidos';
import { favorecidosApiService } from '../../api/favorecidos-api';
import type { FavorecidoDTO } from '../../types/favorecidos';

vi.mock('../../api/favorecidos-api', () => ({
  favorecidosApiService: {
    fetchFavorecidos: vi.fn(),
  },
}));

const mockFavorecidos: FavorecidoDTO[] = [
  {
    id: 'fav-1',
    organizationId: 'org-123',
    name: 'João Silva',
    document: '12345678901',
    documentType: 'CPF',
    zipCode: null,
    street: null,
    number: null,
    city: null,
    state: null,
    phone: null,
    email: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'fav-2',
    organizationId: 'org-123',
    name: 'Empresa LTDA',
    document: '12345678000190',
    documentType: 'CNPJ',
    zipCode: null,
    street: null,
    number: null,
    city: null,
    state: null,
    phone: null,
    email: null,
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

describe('useFavorecidos', () => {
  const mockedFetchFavorecidos = vi.mocked(favorecidosApiService.fetchFavorecidos);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with organizationId', () => {
    it('should return empty array initially', () => {
      const { result } = renderHook(() => useFavorecidos('org-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.favorecidos).toEqual([]);
      expect(result.current.isLoading).toBe(true);
    });

    it('should fetch favorecidos when organizationId provided', async () => {
      mockedFetchFavorecidos.mockResolvedValue(mockFavorecidos);

      const { result } = renderHook(() => useFavorecidos('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedFetchFavorecidos).toHaveBeenCalledWith('org-123');
      expect(result.current.favorecidos).toEqual(mockFavorecidos);
    });

    it('should return favorecidos data from query', async () => {
      mockedFetchFavorecidos.mockResolvedValue(mockFavorecidos);

      const { result } = renderHook(() => useFavorecidos('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.favorecidos).toHaveLength(2);
      });

      expect(result.current.favorecidos[0].name).toBe('João Silva');
      expect(result.current.favorecidos[1].name).toBe('Empresa LTDA');
    });

    it('should return error on fetch failure', async () => {
      mockedFetchFavorecidos.mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useFavorecidos('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch');
    });

    it('should return isLoading true during fetch', async () => {
      mockedFetchFavorecidos.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockFavorecidos), 100)));

      const { result } = renderHook(() => useFavorecidos('org-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should use query key ["favorecidos", organizationId]', async () => {
      mockedFetchFavorecidos.mockResolvedValue(mockFavorecidos);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const wrapper = function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );
      };

      renderHook(() => useFavorecidos('org-123'), { wrapper });

      await waitFor(() => {
        expect(queryClient.getQueryData(['favorecidos', 'org-123'])).toBeDefined();
      });
    });
  });

  describe('without organizationId', () => {
    it('should not fetch when organizationId is empty', () => {
      const { result } = renderHook(() => useFavorecidos(''), {
        wrapper: createWrapper(),
      });

      expect(mockedFetchFavorecidos).not.toHaveBeenCalled();
      expect(result.current.favorecidos).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
