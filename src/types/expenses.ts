import type { ExpenseStatus } from '../constants/expenses';

/**
 * Data Transfer Object representing an expense entity from the API
 */
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
  paymentDate: Date | null;
  receiver: string;
  municipality: string;
  serviceInvoice: string | null;
  serviceInvoiceUrl: string | null;
  bankBillUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new expense
 * All required fields must be provided for expense creation
 */
export interface CreateExpenseInput {
  organizationId: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
  receiver: string;
  municipality: string;
  paymentMethod?: string;
  categoryId?: string | null;
  serviceInvoice?: File | null;
  bankBill?: File | null;
}

/**
 * Input type for updating an existing expense
 * All fields are optional for partial updates
 */
export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  dueDate?: Date;
  receiver?: string;
  municipality?: string;
  paymentMethod?: string;
  categoryId?: string | null;
  serviceInvoice?: File | null;
  bankBill?: File | null;
}

export interface ExpenseFilter {
  status?: ExpenseStatus;
  receiver?: string;
  municipality?: string;
  dueDateStart?: Date;
  dueDateEnd?: Date;
  categoryId?: string;
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
  bankBillUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
