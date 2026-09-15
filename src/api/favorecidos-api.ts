import { apiClient } from '../lib/api-client';
import type {
  FavorecidoDTO,
  FavorecidosListResponse,
  CreateFavorecidoInput,
  ListFavorecidosParams,
  UpdateFavorecidoInput,
} from '../types/favorecidos';

/**
 * `organizationId` goes inline in the URL on purpose: the api-client
 * interceptor only injects it for `/expenses`, `/reports` and
 * `/recurring-expenses`. Optional params are appended only when present so the
 * backend defaults (`page=1`, `limit=20`) apply untouched.
 */
function buildListQuery(organizationId: string, params: ListFavorecidosParams): URLSearchParams {
  const query = new URLSearchParams({ organizationId });
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.name) query.set('name', params.name);
  if (params.document) query.set('document', params.document);
  return query;
}

export class FavorecidosApiService {
  async fetchFavorecidos(
    organizationId: string,
    params: ListFavorecidosParams = {}
  ): Promise<FavorecidosListResponse> {
    const query = buildListQuery(organizationId, params);
    return apiClient.get<FavorecidosListResponse>(
      `/favorecidos?${query}`
    ) as unknown as Promise<FavorecidosListResponse>;
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
