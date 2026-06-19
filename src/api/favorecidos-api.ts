import { apiClient } from '../lib/api-client';
import type { FavorecidoDTO, FavorecidosListResponse, CreateFavorecidoInput, UpdateFavorecidoInput } from '../types/favorecidos';

export class FavorecidosApiService {
  async fetchFavorecidos(organizationId: string): Promise<FavorecidoDTO[]> {
    const params = new URLSearchParams({ organizationId });
    const response = await apiClient.get<FavorecidosListResponse>(
      `/favorecidos?${params}`
    ) as unknown as FavorecidosListResponse;
    return response.data;
  }

  async create(input: CreateFavorecidoInput): Promise<FavorecidoDTO> {
    return apiClient.post('/favorecidos', input) as unknown as Promise<FavorecidoDTO>;
  }

  async update(input: UpdateFavorecidoInput): Promise<FavorecidoDTO> {
    const { id, organizationId, ...body } = input;
    const params = new URLSearchParams({ organizationId });
    return apiClient.put(`/favorecidos/${id}?${params}`, body) as unknown as Promise<FavorecidoDTO>;
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const params = new URLSearchParams({ organizationId });
    await apiClient.delete(`/favorecidos/${id}?${params}`);
  }
}

export const favorecidosApiService = new FavorecidosApiService();
