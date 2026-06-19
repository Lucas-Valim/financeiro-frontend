import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FavorecidosApiService, favorecidosApiService } from '../favorecidos-api';
import { apiClient } from '../../lib/api-client';
import type { FavorecidoDTO, FavorecidosListResponse, CreateFavorecidoInput, UpdateFavorecidoInput } from '../../types/favorecidos';

vi.mock('../../lib/api-client');

describe('FavorecidosApiService', () => {
  let service: FavorecidosApiService;
  const mockedApiClient = apiClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FavorecidosApiService();
  });

  describe('fetchFavorecidos', () => {
    const organizationId = 'org-123';
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

    const mockPaginatedResponse: FavorecidosListResponse = {
      data: mockFavorecidos,
      pagination: { page: 1, limit: 20, total: 2 },
    };

    it('should fetch favorecidos with organizationId query param', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      await service.fetchFavorecidos(organizationId);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/favorecidos?organizationId=org-123');
    });

    it('should extract data from paginated response', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      const result = await service.fetchFavorecidos(organizationId);

      expect(result).toEqual(mockFavorecidos);
      expect(result).toHaveLength(2);
    });

    it('should handle empty favorecidos array', async () => {
      const emptyResponse: FavorecidosListResponse = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0 },
      };
      mockedApiClient.get.mockResolvedValue(emptyResponse);

      const result = await service.fetchFavorecidos(organizationId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle API errors appropriately', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Internal server error'));

      await expect(service.fetchFavorecidos(organizationId)).rejects.toThrow('Internal server error');
    });

    it('should use apiClient internally', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      await service.fetchFavorecidos(organizationId);

      expect(mockedApiClient.get).toHaveBeenCalled();
    });

    it('should enforce TypeScript types correctly', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      const result = await service.fetchFavorecidos(organizationId);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((favorecido) => {
        expect(typeof favorecido.id).toBe('string');
        expect(typeof favorecido.name).toBe('string');
        expect(typeof favorecido.document).toBe('string');
        expect(typeof favorecido.documentType).toBe('string');
        expect(typeof favorecido.organizationId).toBe('string');
        expect(typeof favorecido.createdAt).toBe('string');
        expect(typeof favorecido.updatedAt).toBe('string');
      });
    });

    it('should include different organizationId in URL', async () => {
      mockedApiClient.get.mockResolvedValue(mockPaginatedResponse);

      await service.fetchFavorecidos('different-org-id');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/favorecidos?organizationId=different-org-id');
    });
  });

  describe('create', () => {
    const mockFavorecido: FavorecidoDTO = {
      id: 'fav-new',
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
    };

    it('should call POST /favorecidos with input body', async () => {
      mockedApiClient.post.mockResolvedValue(mockFavorecido);

      const input: CreateFavorecidoInput = {
        organizationId: 'org-123',
        name: 'João Silva',
        document: '12345678901',
      };

      await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/favorecidos', input);
    });

    it('should return FavorecidoDTO on success', async () => {
      mockedApiClient.post.mockResolvedValue(mockFavorecido);

      const input: CreateFavorecidoInput = {
        organizationId: 'org-123',
        name: 'João Silva',
        document: '12345678901',
      };

      const result = await service.create(input);

      expect(result).toEqual(mockFavorecido);
      expect(result.id).toBe('fav-new');
      expect(result.name).toBe('João Silva');
    });

    it('should pass organizationId in body, not as query param', async () => {
      mockedApiClient.post.mockResolvedValue(mockFavorecido);

      const input: CreateFavorecidoInput = {
        organizationId: 'org-123',
        name: 'Test',
        document: '12345678901',
      };

      await service.create(input);

      const [url, body] = mockedApiClient.post.mock.calls[0];
      expect(url).toBe('/favorecidos');
      expect(body).toMatchObject({ organizationId: 'org-123' });
      expect(url).not.toContain('organizationId');
    });

    it('should reject with backend error message when server returns 409 (duplicate document)', async () => {
      mockedApiClient.post.mockRejectedValue(
        new Error('Documento já cadastrado nesta organização')
      );

      const input: CreateFavorecidoInput = {
        organizationId: 'org-123',
        name: 'Duplicado',
        document: '12345678901',
      };

      await expect(service.create(input)).rejects.toThrow(
        'Documento já cadastrado nesta organização'
      );
    });

    it('should support optional address and contact fields', async () => {
      mockedApiClient.post.mockResolvedValue(mockFavorecido);

      const input: CreateFavorecidoInput = {
        organizationId: 'org-123',
        name: 'João Silva',
        document: '12345678901',
        zipCode: '01001000',
        street: 'Rua Teste',
        number: '123',
        city: 'São Paulo',
        state: 'SP',
        phone: '11999999999',
        email: 'joao@test.com',
      };

      await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/favorecidos', input);
    });
  });

  describe('update', () => {
    const mockUpdatedFavorecido: FavorecidoDTO = {
      id: 'fav-1',
      organizationId: 'org-123',
      name: 'João Silva Updated',
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
      updatedAt: '2024-01-02T00:00:00.000Z',
    };

    it('should call PUT /favorecidos/:id with organizationId as query param', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedFavorecido);

      const input: UpdateFavorecidoInput = {
        id: 'fav-1',
        organizationId: 'org-123',
        name: 'João Silva Updated',
      };

      await service.update(input);

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/favorecidos/fav-1?organizationId=org-123',
        expect.objectContaining({ name: 'João Silva Updated' })
      );
    });

    it('should return updated FavorecidoDTO on success', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedFavorecido);

      const input: UpdateFavorecidoInput = {
        id: 'fav-1',
        organizationId: 'org-123',
        name: 'João Silva Updated',
      };

      const result = await service.update(input);

      expect(result).toEqual(mockUpdatedFavorecido);
      expect(result.name).toBe('João Silva Updated');
    });

    it('should NOT include id or organizationId in the request body', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedFavorecido);

      const input: UpdateFavorecidoInput = {
        id: 'fav-1',
        organizationId: 'org-123',
        name: 'Test',
        document: '12345678901',
      };

      await service.update(input);

      const body = mockedApiClient.put.mock.calls[0][1];
      expect(body).not.toHaveProperty('id');
      expect(body).not.toHaveProperty('organizationId');
      expect(body).toHaveProperty('name', 'Test');
      expect(body).toHaveProperty('document', '12345678901');
    });

    it('should reject with error when API call fails', async () => {
      mockedApiClient.put.mockRejectedValue(new Error('Resource not found'));

      const input: UpdateFavorecidoInput = {
        id: 'nonexistent',
        organizationId: 'org-123',
        name: 'Test',
      };

      await expect(service.update(input)).rejects.toThrow('Resource not found');
    });
  });

  describe('delete', () => {
    it('should call DELETE /favorecidos/:id with organizationId as query param', async () => {
      mockedApiClient.delete.mockResolvedValue(undefined);

      await service.delete('fav-1', 'org-123');

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        '/favorecidos/fav-1?organizationId=org-123'
      );
    });

    it('should resolve void on success', async () => {
      mockedApiClient.delete.mockResolvedValue(undefined);

      const result = await service.delete('fav-1', 'org-123');

      expect(result).toBeUndefined();
    });

    it('should reject with backend error message when server returns 409 (linked expenses)', async () => {
      mockedApiClient.delete.mockRejectedValue(
        new Error('Não é possível excluir este favorecido pois existem despesas vinculadas a ele')
      );

      await expect(service.delete('fav-linked', 'org-123')).rejects.toThrow(
        'Não é possível excluir este favorecido pois existem despesas vinculadas a ele'
      );
    });

    it('should reject with error on general API failure', async () => {
      mockedApiClient.delete.mockRejectedValue(new Error('Internal server error'));

      await expect(service.delete('fav-1', 'org-123')).rejects.toThrow('Internal server error');
    });

    it('should include the correct favorecido id in the URL', async () => {
      mockedApiClient.delete.mockResolvedValue(undefined);

      await service.delete('specific-fav-id', 'org-456');

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        '/favorecidos/specific-fav-id?organizationId=org-456'
      );
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(favorecidosApiService).toBeInstanceOf(FavorecidosApiService);
    });
  });
});
