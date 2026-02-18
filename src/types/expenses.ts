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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new expense
 * All required fields must be provided for expense creation
 */
export interface CreateExpenseInput {
  /** Organization identifier for the expense */
  organizationId: string;
  /** Description of the expense (1-255 characters) */
  description: string;
  /** Amount value (must be positive, max 99,999,999.99) */
  amount: number;
  /** Currency code (e.g., 'BRL') */
  currency: string;
  /** Due date for payment */
  dueDate: Date;
  /** Name of the receiver/payee */
  receiver: string;
  /** Municipality name (letters and spaces only) */
  municipality: string;
  /** Optional payment method description */
  paymentMethod?: string;
}

/**
 * Input type for updating an existing expense
 * All fields are optional for partial updates
 */
export interface UpdateExpenseInput {
  /** Updated description (1-255 characters) */
  description?: string;
  /** Updated amount value (must be positive) */
  amount?: number;
  /** Updated due date */
  dueDate?: Date;
  /** Updated receiver/payee name */
  receiver?: string;
  /** Updated municipality name */
  municipality?: string;
  /** Updated payment method */
  paymentMethod?: string;
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
