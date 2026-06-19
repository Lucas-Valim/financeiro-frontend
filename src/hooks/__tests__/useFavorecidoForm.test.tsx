import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFavorecidoForm } from '../useFavorecidoForm';
import { toast } from 'sonner';
import type { FavorecidoDTO } from '../../types/favorecidos';
import { ORGANIZATION_ID } from '../../constants/expenses';

const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockFetchFavorecidos = vi.hoisted(() => vi.fn());

vi.mock('../../api/favorecidos-api', () => ({
  FavorecidosApiService: class {
    fetchFavorecidos = mockFetchFavorecidos;
    create = mockCreate;
    update = mockUpdate;
    delete = mockDelete;
  },
  favorecidosApiService: {
    fetchFavorecidos: mockFetchFavorecidos,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockFavorecido: FavorecidoDTO = {
  id: 'fav-1',
  organizationId: ORGANIZATION_ID,
  name: 'João Silva',
  document: '12345678901',
  documentType: 'CPF',
  zipCode: '01001000',
  street: 'Rua Teste',
  number: '123',
  city: 'São Paulo',
  state: 'SP',
  phone: '11999999999',
  email: 'joao@test.com',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockCreatedFavorecido: FavorecidoDTO = {
  id: 'fav-new',
  organizationId: ORGANIZATION_ID,
  name: 'Novo Favorecido',
  document: '98765432100',
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
};

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

describe('useFavorecidoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(mockCreatedFavorecido);
    mockUpdate.mockResolvedValue(mockFavorecido);
  });

  describe('create mode (no favorecido prop)', () => {
    it('should initialize with empty defaults', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      expect(result.current.form.getValues('name')).toBe('');
      expect(result.current.form.getValues('document')).toBe('');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should call create API with correct args and show success toast', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Novo Favorecido', { shouldDirty: true });
        result.current.form.setValue('document', '98765432100', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockCreate).toHaveBeenCalledWith({
        organizationId: ORGANIZATION_ID,
        name: 'Novo Favorecido',
        document: '98765432100',
        zipCode: null,
        street: null,
        number: null,
        city: null,
        state: null,
        phone: null,
        email: null,
      });
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Favorecido criado com sucesso');
    });

    it('should call onSuccess callback after successful create', async () => {
      const onSuccess = vi.fn();
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID, onSuccess }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Novo Favorecido', { shouldDirty: true });
        result.current.form.setValue('document', '98765432100', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should invalidate queries after successful create', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Novo', { shouldDirty: true });
        result.current.form.setValue('document', '98765432100', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['favorecidos', ORGANIZATION_ID],
      });
    });
  });

  describe('edit mode (favorecido prop provided)', () => {
    it('should populate form with existing favorecido values', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID, favorecido: mockFavorecido }),
        { wrapper: Wrapper }
      );

      expect(result.current.form.getValues('name')).toBe(mockFavorecido.name);
      expect(result.current.form.getValues('document')).toBe(mockFavorecido.document);
      expect(result.current.form.getValues('zipCode')).toBe(mockFavorecido.zipCode);
      expect(result.current.form.getValues('city')).toBe(mockFavorecido.city);
    });

    it('should call update API with correct id and args and show success toast', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID, favorecido: mockFavorecido }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'João Silva Updated', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        id: mockFavorecido.id,
        organizationId: ORGANIZATION_ID,
        name: 'João Silva Updated',
        document: mockFavorecido.document,
        zipCode: mockFavorecido.zipCode,
        street: mockFavorecido.street,
        number: mockFavorecido.number,
        city: mockFavorecido.city,
        state: mockFavorecido.state,
        phone: mockFavorecido.phone,
        email: mockFavorecido.email,
      });
      expect(mockCreate).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Favorecido atualizado com sucesso');
    });
  });

  describe('validation', () => {
    it('should NOT call API when name is empty (Zod validation failure)', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('error handling - duplicate document (409)', () => {
    it('should surface inline error on document field when duplicate document error', async () => {
      mockCreate.mockRejectedValue(new Error('Documento já cadastrado nesta organização'));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Test', { shouldDirty: true });
        result.current.form.setValue('document', '12345678901', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      await waitFor(() => {
        const docError = result.current.form.getFieldState('document').error;
        expect(docError?.message).toBe('Documento já cadastrado nesta organização');
      });
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('error handling - invalid document (400)', () => {
    it('should surface inline error on document field when invalid document error', async () => {
      mockCreate.mockRejectedValue(new Error('Documento inválido'));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Test', { shouldDirty: true });
        result.current.form.setValue('document', '12345678901', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      await waitFor(() => {
        const docError = result.current.form.getFieldState('document').error;
        expect(docError?.message).toBe('Documento inválido');
      });
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('error handling - generic errors', () => {
    it('should fire toast.error with backend error message on generic API failure', async () => {
      mockCreate.mockRejectedValue(new Error('Internal server error'));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Test', { shouldDirty: true });
        result.current.form.setValue('document', '12345678901', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith('Internal server error');
    });

    it('should fire toast.error with fallback message when error is not an Error instance', async () => {
      mockCreate.mockRejectedValue('Unknown error');

      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Test', { shouldDirty: true });
        result.current.form.setValue('document', '12345678901', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro ao salvar o favorecido');
    });

    it('should reset isSubmitting to false after API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Test', { shouldDirty: true });
        result.current.form.setValue('document', '12345678901', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('isDirty flag', () => {
    it('should be false initially', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      expect(result.current.isDirty).toBe(false);
    });

    it('should be true after a field value changes from default', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      act(() => {
        result.current.form.setValue('name', 'Changed', { shouldDirty: true });
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });
    });

    it('should be false after resetForm', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      act(() => {
        result.current.form.setValue('name', 'Changed', { shouldDirty: true });
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });

      act(() => {
        result.current.resetForm();
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });
    });
  });

  describe('cache invalidation', () => {
    it('should call queryClient.invalidateQueries with correct key after successful update', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useFavorecidoForm({ organizationId: ORGANIZATION_ID, favorecido: mockFavorecido }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['favorecidos', ORGANIZATION_ID],
      });
    });
  });
});
