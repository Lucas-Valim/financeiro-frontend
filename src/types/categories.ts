export interface CategoryDTO {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface CategoriesListResponse {
  data: CategoryDTO[];
  pagination: Pagination;
}

export interface CreateCategoryInput {
  organizationId: string;
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  id: string;
  organizationId: string;
  name?: string;
  description?: string | null;
}

export interface CategoryFormData {
  name: string;
  description: string;
}
