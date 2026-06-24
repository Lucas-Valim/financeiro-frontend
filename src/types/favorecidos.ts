export type DocumentType = 'CPF' | 'CNPJ';

export interface FavorecidoDTO {
  id: string;
  organizationId: string;
  name: string;
  document: string | null;
  documentType: DocumentType | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface FavorecidosListResponse {
  data: FavorecidoDTO[];
  pagination: Pagination;
}

export interface CreateFavorecidoInput {
  organizationId: string;
  name: string;
  document?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateFavorecidoInput {
  id: string;
  organizationId: string;
  name?: string;
  document?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
}

// FavorecidoFormData is derived from the Zod schema — see
// `@/schemas/favorecido-form-schema` (single source of truth).
