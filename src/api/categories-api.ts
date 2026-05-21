import { apiClient } from '../lib/api-client';
import type { CategoryDTO, CategoriesListResponse, CreateCategoryInput, UpdateCategoryInput } from '../types/categories';

export class CategoriesApiService {
  async fetchCategories(organizationId: string): Promise<CategoryDTO[]> {
    const params = new URLSearchParams({ organizationId });
    const response = await apiClient.get<CategoriesListResponse>(
      `/categories?${params}`
    ) as unknown as CategoriesListResponse;
    return response.data;
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
