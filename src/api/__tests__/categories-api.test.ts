import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoriesApiService, categoriesApiService } from '../categories-api';
import { apiClient } from '../../lib/api-client';
import type { CategoryDTO, CategoriesListResponse, CreateCategoryInput, UpdateCategoryInput } from '../../types/categories';

vi.mock('../../lib/api-client');

describe('CategoriesApiService', () => {
  let service: CategoriesApiService;
  const mockedApiClient = apiClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoriesApiService();
  });

  describe('fetchCategories', () => {
    const organizationId = 'org-123';
    const mockCategories: CategoryDTO[] = [
      { 
        id: 'cat-1', 
        organizationId: 'org-123',
        name: 'Alimentação', 
        description: 'Despesas com alimentação',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      { 
        id: 'cat-2', 
        organizationId: 'org-123',
        name: 'Transporte', 
        description: 'Despesas com transporte',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      { 
        id: 'cat-3', 
        organizationId: 'org-123',
        name: 'Moradia', 
        description: 'Despesas com moradia',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockPaginatedResponse: CategoriesListResponse = {
      data: mockCategories,
      pagination: { page: 1, limit: 20, total: 3 },
    };

    it('should fetch categories with organizationId query param', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      await service.fetchCategories(organizationId);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/categories?organizationId=org-123');
    });

    it('should extract data from paginated response', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      const result = await service.fetchCategories(organizationId);

      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(3);
    });

    it('should handle empty categories array', async () => {
      const emptyResponse: CategoriesListResponse = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0 },
      };
      mockedApiClient.get.mockResolvedValue(emptyResponse);

      const result = await service.fetchCategories(organizationId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle API errors appropriately', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Internal server error'));

      await expect(service.fetchCategories(organizationId)).rejects.toThrow('Internal server error');
    });

    it('should handle network errors', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(service.fetchCategories(organizationId)).rejects.toThrow('Network error');
    });

    it('should use apiClient internally', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      await service.fetchCategories(organizationId);

      expect(mockedApiClient.get).toHaveBeenCalled();
    });

    it('should enforce TypeScript types correctly', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      const result = await service.fetchCategories(organizationId);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((category) => {
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
        expect(typeof category.description).toBe('string');
        expect(typeof category.organizationId).toBe('string');
        expect(typeof category.createdAt).toBe('string');
        expect(typeof category.updatedAt).toBe('string');
      });
    });

    it('should return categories with correct structure', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      const result = await service.fetchCategories(organizationId);

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('organizationId');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('updatedAt');
    });

    it('should include different organizationId in URL', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      await service.fetchCategories('different-org-id');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/categories?organizationId=different-org-id');
    });
  });

  describe('create', () => {
    const mockCategory: CategoryDTO = {
      id: 'cat-new',
      organizationId: 'org-123',
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should call POST /categories with organizationId in request body', async () => {
      mockedApiClient.post.mockResolvedValue(mockCategory);

      const input: CreateCategoryInput = {
        organizationId: 'org-123',
        name: 'Nova Categoria',
        description: 'Descrição da categoria',
      };

      await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/categories', input);
    });

    it('should return CategoryDTO on success', async () => {
      mockedApiClient.post.mockResolvedValue(mockCategory);

      const input: CreateCategoryInput = {
        organizationId: 'org-123',
        name: 'Nova Categoria',
      };

      const result = await service.create(input);

      expect(result).toEqual(mockCategory);
      expect(result.id).toBe('cat-new');
      expect(result.name).toBe('Nova Categoria');
    });

    it('should pass organizationId in body, not as query param', async () => {
      mockedApiClient.post.mockResolvedValue(mockCategory);

      const input: CreateCategoryInput = {
        organizationId: 'org-123',
        name: 'Test',
      };

      await service.create(input);

      const [url, body] = mockedApiClient.post.mock.calls[0];
      expect(url).toBe('/categories');
      expect(body).toMatchObject({ organizationId: 'org-123' });
      expect(url).not.toContain('organizationId');
    });

    it('should reject with backend error message when server returns 409 (duplicate name)', async () => {
      mockedApiClient.post.mockRejectedValue(
        new Error('Category name already exists in this organization')
      );

      const input: CreateCategoryInput = {
        organizationId: 'org-123',
        name: 'Categoria Duplicada',
      };

      await expect(service.create(input)).rejects.toThrow(
        'Category name already exists in this organization'
      );
    });

    it('should support optional description', async () => {
      mockedApiClient.post.mockResolvedValue(mockCategory);

      const input: CreateCategoryInput = {
        organizationId: 'org-123',
        name: 'Sem Descrição',
      };

      await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/categories', input);
    });
  });

  describe('update', () => {
    const mockUpdatedCategory: CategoryDTO = {
      id: 'cat-1',
      organizationId: 'org-123',
      name: 'Categoria Atualizada',
      description: 'Nova descrição',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    };

    it('should call PUT /categories/:id with organizationId as query param', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedCategory);

      const input: UpdateCategoryInput = {
        id: 'cat-1',
        organizationId: 'org-123',
        name: 'Categoria Atualizada',
      };

      await service.update(input);

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/categories/cat-1?organizationId=org-123',
        expect.objectContaining({ name: 'Categoria Atualizada' })
      );
    });

    it('should return updated CategoryDTO on success', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedCategory);

      const input: UpdateCategoryInput = {
        id: 'cat-1',
        organizationId: 'org-123',
        name: 'Categoria Atualizada',
      };

      const result = await service.update(input);

      expect(result).toEqual(mockUpdatedCategory);
      expect(result.name).toBe('Categoria Atualizada');
    });

    it('should NOT include id or organizationId in the request body', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedCategory);

      const input: UpdateCategoryInput = {
        id: 'cat-1',
        organizationId: 'org-123',
        name: 'Test',
        description: 'Desc',
      };

      await service.update(input);

      const body = mockedApiClient.put.mock.calls[0][1];
      expect(body).not.toHaveProperty('id');
      expect(body).not.toHaveProperty('organizationId');
      expect(body).toHaveProperty('name', 'Test');
      expect(body).toHaveProperty('description', 'Desc');
    });

    it('should support partial updates with only name', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedCategory);

      const input: UpdateCategoryInput = {
        id: 'cat-1',
        organizationId: 'org-123',
        name: 'Apenas Nome',
      };

      await service.update(input);

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/categories/cat-1?organizationId=org-123',
        { name: 'Apenas Nome', description: undefined }
      );
    });

    it('should reject with error when API call fails', async () => {
      mockedApiClient.put.mockRejectedValue(new Error('Resource not found'));

      const input: UpdateCategoryInput = {
        id: 'nonexistent',
        organizationId: 'org-123',
        name: 'Test',
      };

      await expect(service.update(input)).rejects.toThrow('Resource not found');
    });
  });

  describe('delete', () => {
    it('should call DELETE /categories/:id with organizationId as query param', async () => {
      mockedApiClient.delete.mockResolvedValue(undefined);

      await service.delete('cat-1', 'org-123');

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        '/categories/cat-1?organizationId=org-123'
      );
    });

    it('should resolve void on success', async () => {
      mockedApiClient.delete.mockResolvedValue(undefined);

      const result = await service.delete('cat-1', 'org-123');

      expect(result).toBeUndefined();
    });

    it('should reject with backend error message when server returns 409 (linked expenses)', async () => {
      mockedApiClient.delete.mockRejectedValue(
        new Error('Não é possível excluir esta categoria pois existem despesas vinculadas a ela')
      );

      await expect(service.delete('cat-linked', 'org-123')).rejects.toThrow(
        'Não é possível excluir esta categoria pois existem despesas vinculadas a ela'
      );
    });

    it('should reject with error on general API failure', async () => {
      mockedApiClient.delete.mockRejectedValue(new Error('Internal server error'));

      await expect(service.delete('cat-1', 'org-123')).rejects.toThrow('Internal server error');
    });

    it('should include the correct category id in the URL', async () => {
      mockedApiClient.delete.mockResolvedValue(undefined);

      await service.delete('specific-cat-id', 'org-456');

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        '/categories/specific-cat-id?organizationId=org-456'
      );
    });
  });

  describe('fetchCategories behavior after extension', () => {
    const mockPaginatedResponse: CategoriesListResponse = {
      data: [
        {
          id: 'cat-1',
          organizationId: 'org-123',
          name: 'Alimentação',
          description: 'Despesas com alimentação',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, limit: 20, total: 1 },
    };

    it('should remain unchanged and still return CategoryDTO[]', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      const result = await service.fetchCategories('org-123');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/categories?organizationId=org-123');
      expect(result).toEqual(mockPaginatedResponse.data);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(categoriesApiService).toBeInstanceOf(CategoriesApiService);
    });
  });
});
