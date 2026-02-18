import { apiClient } from '../lib/api-client';
import type { ExpenseDTO, ExpenseFilter, ListExpensesOutput, CreateExpenseInput, UpdateExpenseInput } from '../types/expenses';
import type { PaymentRequest, PaymentResponse } from '../schemas/payment-schema';
import { ORGANIZATION_ID } from '../constants/expenses';

export class ExpensesApiService {
  async fetchExpenses(filters: ExpenseFilter = {}, pagination: { page: number; limit: number }): Promise<ListExpensesOutput> {
    const params = new URLSearchParams();
    
    // TODO: Get organizationId dynamically from auth context in the future
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
    return apiClient.post<ExpenseDTO>('/expenses', data) as unknown as Promise<ExpenseDTO>;
  }

  async update(id: string, data: UpdateExpenseInput): Promise<ExpenseDTO> {
    return apiClient.put<ExpenseDTO>(`/expenses/${id}`, data) as unknown as Promise<ExpenseDTO>;
  }

  async pay(data: PaymentRequest): Promise<PaymentResponse> {
    const formData = new FormData();
    formData.append('id', data.id);
    formData.append('paymentDate', data.paymentDate);
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
