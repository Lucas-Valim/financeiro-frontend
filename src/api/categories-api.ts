import { apiClient } from '../lib/api-client';
import type {
  CategoryDTO,
  CategoriesListResponse,
  CreateCategoryInput,
  ListCategoriesParams,
  UpdateCategoryInput,
} from '../types/categories';

/**
 * `organizationId` goes inline in the URL on purpose: the api-client
 * interceptor only injects it for `/expenses`, `/reports` and
 * `/recurring-expenses`. Optional params are appended only when present so the
 * backend defaults (`page=1`, `limit=20`) apply untouched.
 */
function buildListQuery(organizationId: string, params: ListCategoriesParams): URLSearchParams {
  const query = new URLSearchParams({ organizationId });
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.name) query.set('name', params.name);
  return query;
}

export class CategoriesApiService {
  async fetchCategories(
    organizationId: string,
    params: ListCategoriesParams = {}
  ): Promise<CategoriesListResponse> {
    const query = buildListQuery(organizationId, params);
    return apiClient.get<CategoriesListResponse>(
      `/categories?${query}`
    ) as unknown as Promise<CategoriesListResponse>;
  }

  async create(input: CreateCategoryInput): Promise<CategoryDTO> {
    return apiClient.post('/categories', input) as unknown as Promise<CategoryDTO>;
  }

  async update(input: UpdateCategoryInput): Promise<CategoryDTO> {
    const { id, organizationId, name, description } = input;
    const params = new URLSearchParams({ organizationId });
    return apiClient.put(`/categories/${id}?${params}`, { name, description }) as unknown as Promise<CategoryDTO>;
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const params = new URLSearchParams({ organizationId });
    await apiClient.delete(`/categories/${id}?${params}`);
  }
}

export const categoriesApiService = new CategoriesApiService();
