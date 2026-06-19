export type DocumentType = 'CPF' | 'CNPJ';

export interface FavorecidoDTO {
  id: string;
  organizationId: string;
  name: string;
  document: string;
  documentType: DocumentType;
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
  document: string;
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
  document?: string;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface FavorecidoFormData {
  name: string;
  document: string;
  zipCode: string;
  street: string;
  number: string;
  city: string;
  state: string;
  phone: string;
  email: string;
}
