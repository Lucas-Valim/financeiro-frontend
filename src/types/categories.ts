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

/** Query params accepted by `GET /categories` besides `organizationId`. */
export interface ListCategoriesParams {
  page?: number;
  limit?: number;
  /** Case-insensitive substring match on the name (backend `iLike`). */
  name?: string;
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
