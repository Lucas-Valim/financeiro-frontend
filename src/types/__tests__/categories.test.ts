import { describe, it, expect } from 'vitest';
import type { CategoryDTO, Pagination, CategoriesListResponse } from '../categories';

describe('Category Types', () => {
  describe('CategoryDTO', () => {
    it('should create a valid category with all fields', () => {
      const category: CategoryDTO = {
        id: 'cat-1',
        organizationId: 'org-123',
        name: 'Alimentação',
        description: 'Despesas com alimentação',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(category.id).toBe('cat-1');
      expect(category.organizationId).toBe('org-123');
      expect(category.name).toBe('Alimentação');
      expect(category.description).toBe('Despesas com alimentação');
      expect(category.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(category.updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should accept different category values', () => {
      const categories: CategoryDTO[] = [
        { 
          id: '1', 
          organizationId: 'org-123',
          name: 'Transporte', 
          description: 'Despesas com transporte',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        { 
          id: '2', 
          organizationId: 'org-123',
          name: 'Moradia', 
          description: 'Despesas com moradia',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        { 
          id: '3', 
          organizationId: 'org-123',
          name: 'Saúde', 
          description: 'Despesas com saúde',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      expect(categories).toHaveLength(3);
      expect(categories[0].name).toBe('Transporte');
      expect(categories[1].description).toBe('Despesas com moradia');
      expect(categories[2].id).toBe('3');
    });
  });

  describe('Pagination', () => {
    it('should create valid pagination', () => {
      const pagination: Pagination = {
        page: 1,
        limit: 20,
        total: 100,
      };

      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(20);
      expect(pagination.total).toBe(100);
    });
  });

  describe('CategoriesListResponse', () => {
    it('should create valid response with data and pagination', () => {
      const response: CategoriesListResponse = {
        data: [
          {
            id: 'cat-1',
            organizationId: 'org-123',
            name: 'Combustível',
            description: 'Combustível',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
        },
      };

      expect(response.data).toHaveLength(1);
      expect(response.data[0].name).toBe('Combustível');
      expect(response.pagination.total).toBe(1);
    });
  });
});
