import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCategoryForm } from '../useCategoryForm';
import { toast } from 'sonner';
import type { CategoryDTO } from '../../types/categories';
import { ORGANIZATION_ID } from '../../constants/expenses';

const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockFetchCategories = vi.hoisted(() => vi.fn());

vi.mock('../../api/categories-api', () => ({
  CategoriesApiService: class {
    fetchCategories = mockFetchCategories;
    create = mockCreate;
    update = mockUpdate;
    delete = mockDelete;
  },
  categoriesApiService: {
    fetchCategories: mockFetchCategories,
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

const mockCategory: CategoryDTO = {
  id: 'cat-1',
  organizationId: ORGANIZATION_ID,
  name: 'Alimentação',
  description: 'Despesas com alimentação',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockCreatedCategory: CategoryDTO = {
  id: 'cat-new',
  organizationId: ORGANIZATION_ID,
  name: 'Nova Categoria',
  description: '',
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

describe('useCategoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(mockCreatedCategory);
    mockUpdate.mockResolvedValue(mockCategory);
  });

  describe('create mode (no category prop)', () => {
    it('should initialize with empty defaults', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      expect(result.current.form.getValues('name')).toBe('');
      expect(result.current.form.getValues('description')).toBe('');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should call categoriesApiService.create with correct args when no category prop', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Nova Categoria', { shouldDirty: true });
        result.current.form.setValue('description', 'Descrição', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockCreate).toHaveBeenCalledWith({
        organizationId: ORGANIZATION_ID,
        name: 'Nova Categoria',
        description: 'Descrição',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should fire toast.success after successful create', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Nova Categoria', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(toast.success).toHaveBeenCalledWith('Categoria criada com sucesso');
    });

    it('should call onSuccess callback after successful create', async () => {
      const onSuccess = vi.fn();
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID, onSuccess }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Nova Categoria', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('edit mode (category prop provided)', () => {
    it('should populate form with existing category values', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID, category: mockCategory }),
        { wrapper: Wrapper }
      );

      expect(result.current.form.getValues('name')).toBe(mockCategory.name);
      expect(result.current.form.getValues('description')).toBe(mockCategory.description);
    });

    it('should call categoriesApiService.update with correct id and args when category prop provided', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID, category: mockCategory }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Alimentação Atualizada', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        id: mockCategory.id,
        organizationId: ORGANIZATION_ID,
        name: 'Alimentação Atualizada',
        description: mockCategory.description,
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should fire toast.success after successful update', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID, category: mockCategory }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(toast.success).toHaveBeenCalledWith('Categoria atualizada com sucesso');
    });
  });

  describe('validation', () => {
    it('should NOT call API when name is empty (Zod validation failure)', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should expose field-level errors after failed validation', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      await waitFor(() => {
        expect(result.current.form.formState.isValid).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should fire toast.error with backend error message on API failure', async () => {
      const errorMessage = 'Category name already exists in this organization';
      mockCreate.mockRejectedValue(new Error(errorMessage));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Duplicated', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    it('should fire toast.error with fallback message when error is not an Error instance', async () => {
      mockCreate.mockRejectedValue('Unknown error');

      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Test', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro ao salvar a categoria');
    });

    it('should reset isSubmitting to false after API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Test', { shouldDirty: true });
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
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      expect(result.current.isDirty).toBe(false);
    });

    it('should be true after a field value changes from default', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
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
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
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
    it('should call queryClient.invalidateQueries with correct key after successful create', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Nova Categoria', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['categories', ORGANIZATION_ID],
      });
    });
  });

  describe('integration: create mutation followed by query refetch', () => {
    it('should invalidate categories query so a refetch returns updated list', async () => {
      const { Wrapper, queryClient } = createWrapper();

      queryClient.setQueryData(['categories', ORGANIZATION_ID], [mockCategory]);

      mockCreate.mockResolvedValue(mockCreatedCategory);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useCategoryForm({ organizationId: ORGANIZATION_ID }),
        { wrapper: Wrapper }
      );

      await act(async () => {
        result.current.form.setValue('name', 'Nova Categoria', { shouldDirty: true });
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['categories', ORGANIZATION_ID],
      });
    });
  });
});
