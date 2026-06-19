import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeleteFavorecido } from '../useDeleteFavorecido';
import { ORGANIZATION_ID } from '../../constants/expenses';
import { LINKED_EXPENSES_ERROR_MESSAGE } from '../../constants/favorecidos';

const mockDelete = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock('../../api/favorecidos-api', () => ({
  FavorecidosApiService: class {
    delete = mockDelete;
  },
  favorecidosApiService: {
    delete: mockDelete,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, queryClient };
}

describe('useDeleteFavorecido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should return correct initial state', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('successful deletion', () => {
    it('should call delete API with correct id and organizationId', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      result.current.mutate({ id: 'fav-1', organizationId: ORGANIZATION_ID });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDelete).toHaveBeenCalledWith('fav-1', ORGANIZATION_ID);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it('should update state correctly on success', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      result.current.mutate({ id: 'fav-1', organizationId: ORGANIZATION_ID });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isError).toBe(false);
      });
    });

    it('should invalidate ["favorecidos", orgId] query on success', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      result.current.mutate({ id: 'fav-1', organizationId: ORGANIZATION_ID });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['favorecidos', ORGANIZATION_ID],
      });
    });
  });

  describe('failed deletion', () => {
    it('should return error when backend rejects with 409 (linked expenses)', async () => {
      mockDelete.mockRejectedValue(new Error(LINKED_EXPENSES_ERROR_MESSAGE));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      result.current.mutate({ id: 'fav-linked', organizationId: ORGANIZATION_ID });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe(LINKED_EXPENSES_ERROR_MESSAGE);
      });
    });

    it('should NOT call toast.error for linked-expenses 409 (delegated to dialog)', async () => {
      mockDelete.mockRejectedValue(new Error(LINKED_EXPENSES_ERROR_MESSAGE));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      result.current.mutate({ id: 'fav-linked', organizationId: ORGANIZATION_ID });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('should call toast.error with backend message on non-linked-expenses errors', async () => {
      mockDelete.mockRejectedValue(new Error('Internal server error'));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      result.current.mutate({ id: 'fav-1', organizationId: ORGANIZATION_ID });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith('Internal server error');
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });

    it('should call toast.error with fallback message when error has empty message', async () => {
      mockDelete.mockRejectedValue(new Error(''));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      result.current.mutate({ id: 'fav-1', organizationId: ORGANIZATION_ID });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith('Ocorreu um erro ao excluir o favorecido');
    });

    it('should NOT invalidate queries on failure', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      result.current.mutate({ id: 'fav-1', organizationId: ORGANIZATION_ID });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('isPending state', () => {
    it('should set isPending to true during API call', async () => {
      let resolveDelete: (value: void) => void;
      mockDelete.mockImplementation(() => new Promise<void>((resolve) => {
        resolveDelete = resolve;
      }));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteFavorecido(), { wrapper: Wrapper });

      result.current.mutate({ id: 'fav-1', organizationId: ORGANIZATION_ID });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolveDelete!();

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
