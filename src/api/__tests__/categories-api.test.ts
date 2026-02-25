import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoriesApiService, categoriesApiService } from '../categories-api';
import { apiClient } from '../../lib/api-client';
import type { CategoryDTO, CategoriesListResponse } from '../../types/categories';

vi.mock('../../lib/api-client');

describe('CategoriesApiService', () => {
  let service: CategoriesApiService;
  const mockedApiClient = apiClient as unknown as {
    get: ReturnType<typeof vi.fn>;
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

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(categoriesApiService).toBeInstanceOf(CategoriesApiService);
    });
  });
});
