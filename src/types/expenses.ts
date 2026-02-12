import type { ExpenseStatus } from '../constants/expenses';

export interface ExpenseDTO {
  id: string;
  organizationId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: ExpenseStatus;
  paymentMethod: string | null;
  paymentProof: string | null;
  paymentProofUrl: string | null;
  receiver: string;
  municipality: string;
  serviceInvoice: string | null;
  serviceInvoiceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFilter {
  status?: ExpenseStatus;
  receiver?: string;
  municipality?: string;
  dueDateStart?: Date;
  dueDateEnd?: Date;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface ListExpensesOutput {
  data: ExpenseDTO[];
  pagination: Pagination;
}

export interface GetExpenseOutput {
  id: string;
  organizationId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: ExpenseStatus;
  paymentMethod: string | null;
  paymentProof: string | null;
  paymentProofUrl: string | null;
  receiver: string;
  municipality: string;
  serviceInvoice: string | null;
  serviceInvoiceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
