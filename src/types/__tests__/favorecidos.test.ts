import { describe, it, expect } from 'vitest';
import type { FavorecidoDTO, Pagination, FavorecidosListResponse, CreateFavorecidoInput, UpdateFavorecidoInput } from '../favorecidos';

describe('Favorecido Types', () => {
  describe('FavorecidoDTO', () => {
    it('should create a valid favorecido with all fields including derived documentType', () => {
      const favorecido: FavorecidoDTO = {
        id: 'fav-1',
        organizationId: 'org-123',
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

      expect(favorecido.id).toBe('fav-1');
      expect(favorecido.organizationId).toBe('org-123');
      expect(favorecido.name).toBe('João Silva');
      expect(favorecido.document).toBe('12345678901');
      expect(favorecido.documentType).toBe('CPF');
      expect(favorecido.zipCode).toBe('01001000');
      expect(favorecido.street).toBe('Rua Teste');
      expect(favorecido.number).toBe('123');
      expect(favorecido.city).toBe('São Paulo');
      expect(favorecido.state).toBe('SP');
      expect(favorecido.phone).toBe('11999999999');
      expect(favorecido.email).toBe('joao@test.com');
      expect(favorecido.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(favorecido.updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should accept CNPJ documentType', () => {
      const favorecido: FavorecidoDTO = {
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
      };

      expect(favorecido.documentType).toBe('CNPJ');
      expect(favorecido.zipCode).toBeNull();
      expect(favorecido.street).toBeNull();
    });

    it('should support nullable optional fields', () => {
      const favorecido: FavorecidoDTO = {
        id: 'fav-3',
        organizationId: 'org-123',
        name: 'Maria Souza',
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

      expect(favorecido.zipCode).toBeNull();
      expect(favorecido.phone).toBeNull();
      expect(favorecido.email).toBeNull();
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

  describe('FavorecidosListResponse', () => {
    it('should create valid response with data and pagination', () => {
      const response: FavorecidosListResponse = {
        data: [
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
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
        },
      };

      expect(response.data).toHaveLength(1);
      expect(response.data[0].name).toBe('João Silva');
      expect(response.pagination.total).toBe(1);
    });
  });

  describe('CreateFavorecidoInput', () => {
    it('should match backend contract with required fields', () => {
      const input: CreateFavorecidoInput = {
        organizationId: 'org-123',
        name: 'João Silva',
        document: '12345678901',
      };

      expect(input.organizationId).toBe('org-123');
      expect(input.name).toBe('João Silva');
      expect(input.document).toBe('12345678901');
    });

    it('should accept optional fields', () => {
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

      expect(input.zipCode).toBe('01001000');
      expect(input.state).toBe('SP');
    });
  });

  describe('UpdateFavorecidoInput', () => {
    it('should require id and organizationId', () => {
      const input: UpdateFavorecidoInput = {
        id: 'fav-1',
        organizationId: 'org-123',
        name: 'João Silva Updated',
      };

      expect(input.id).toBe('fav-1');
      expect(input.organizationId).toBe('org-123');
      expect(input.name).toBe('João Silva Updated');
    });
  });
});
