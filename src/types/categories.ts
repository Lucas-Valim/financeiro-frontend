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
