import { apiClient } from '../lib/api-client';
import type { ExpenseDTO, ExpenseFilter, ListExpensesOutput, CreateExpenseInput, UpdateExpenseInput } from '../types/expenses';
import type { PaymentRequest, PaymentResponse } from '../schemas/payment-schema';
import { ORGANIZATION_ID } from '../constants/expenses';

export class ExpensesApiService {
  /**
   * Checks if the expense data contains any file uploads
   * @param data - Create or update input data
   * @returns true if serviceInvoice or bankBill are File instances
   */
  private hasFiles(data: CreateExpenseInput | UpdateExpenseInput): boolean {
    return (data.serviceInvoice instanceof File) || (data.bankBill instanceof File);
  }

  /**
   * Validates expense data before submission
   * @param data - Create or update input data
   * @throws Error if validation fails
   */
  private validateExpenseData(data: CreateExpenseInput | UpdateExpenseInput): void {
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (data.description && data.description.length > 255) {
      throw new Error('Description must be less than 255 characters');
    }
    if (data.dueDate && !(data.dueDate instanceof Date)) {
      throw new Error('Due date must be a valid Date object');
    }
  }

  /**
   * Converts create expense data to FormData for multipart/form-data requests
   * Handles both text fields and file uploads
   * @param data - Create expense input data
   * @returns FormData object with all fields
   */
  private buildFormDataForCreate(data: CreateExpenseInput): FormData {
    const formData = new FormData();

    formData.append('organizationId', data.organizationId);
    formData.append('description', data.description);
    formData.append('amount', String(data.amount));
    formData.append('currency', data.currency);
    formData.append('dueDate', data.dueDate.toISOString());
    formData.append('receiver', data.receiver);
    formData.append('municipality', data.municipality);

    if (data.paymentMethod) {
      formData.append('paymentMethod', data.paymentMethod);
    }
    if (data.serviceInvoice instanceof File) {
      formData.append('serviceInvoice', data.serviceInvoice);
    }
    if (data.bankBill instanceof File) {
      formData.append('bankBill', data.bankBill);
    }

    return formData;
  }

  /**
   * Converts update expense data to FormData for multipart/form-data requests
   * Handles both text fields and file uploads
   * @param data - Update expense input data
   * @returns FormData object with all fields
   */
  private buildFormDataForUpdate(data: UpdateExpenseInput): FormData {
    const formData = new FormData();

    if (data.description) formData.append('description', data.description);
    if (data.amount !== undefined) formData.append('amount', String(data.amount));
    if (data.dueDate) formData.append('dueDate', data.dueDate.toISOString());
    if (data.receiver) formData.append('receiver', data.receiver);
    if (data.municipality) formData.append('municipality', data.municipality);
    if (data.paymentMethod) formData.append('paymentMethod', data.paymentMethod);
    if (data.serviceInvoice instanceof File) {
      formData.append('serviceInvoice', data.serviceInvoice);
    }
    if (data.bankBill instanceof File) {
      formData.append('bankBill', data.bankBill);
    }

    return formData;
  }

  async fetchExpenses(filters: ExpenseFilter = {}, pagination: { page: number; limit: number }): Promise<ListExpensesOutput> {
    // TODO(@lucasborges): Get organizationId dynamically from auth context - Priority: HIGH - Owner: @lucasborges
    const params = new URLSearchParams();

    params.append('organizationId', ORGANIZATION_ID);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, String(value));
        }
      }
    });

    params.append('page', String(pagination.page));
    params.append('limit', String(pagination.limit));

    return apiClient.get<ListExpensesOutput>('/expenses', { params }) as unknown as Promise<ListExpensesOutput>;
  }

  async fetchExpenseById(id: string): Promise<ExpenseDTO> {
    return apiClient.get<ExpenseDTO>(`/expenses/${id}`) as unknown as Promise<ExpenseDTO>;
  }

  async create(data: CreateExpenseInput): Promise<ExpenseDTO> {
    this.validateExpenseData(data);
    
    if (this.hasFiles(data)) {
      const formData = this.buildFormDataForCreate(data);
      return apiClient.post('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as Promise<ExpenseDTO>;
    }
    
    return apiClient.post('/expenses', data) as Promise<ExpenseDTO>;
  }

  async update(id: string, data: UpdateExpenseInput): Promise<ExpenseDTO> {
    this.validateExpenseData(data);
    
    if (this.hasFiles(data)) {
      const formData = this.buildFormDataForUpdate(data);
      return apiClient.put(`/expenses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as Promise<ExpenseDTO>;
    }
    
    return apiClient.put(`/expenses/${id}`, data) as Promise<ExpenseDTO>;
  }

  async pay(data: PaymentRequest): Promise<PaymentResponse> {
    const formData = new FormData();
    formData.append('id', data.id);
    formData.append('paymentDate', String(data.paymentDate));
    if (data.paymentProof) {
      formData.append('paymentProof', data.paymentProof);
    }

    return apiClient.post<PaymentResponse>(`/expenses/${data.id}/pay`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }) as unknown as Promise<PaymentResponse>;
  }
}
