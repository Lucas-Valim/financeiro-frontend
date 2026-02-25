import { apiClient } from '../lib/api-client';
import type { CategoryDTO, CategoriesListResponse } from '../types/categories';

export class CategoriesApiService {
  async fetchCategories(organizationId: string): Promise<CategoryDTO[]> {
    const params = new URLSearchParams({ organizationId });
    const response = await apiClient.get<CategoriesListResponse>(
      `/categories?${params}`
    ) as unknown as CategoriesListResponse;
    return response.data;
  }
}

export const categoriesApiService = new CategoriesApiService();
