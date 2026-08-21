import { apiClient } from '../lib/api-client';
import type { ExpenseDTO, ExpenseFilter, ExpenseStatusSummary, ListExpensesOutput, CreateExpenseInput, UpdateExpenseInput, ConfirmExpenseAmountOutput, ResyncCalendarOutput } from '../types/expenses';
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
    formData.append('favorecidoId', data.favorecidoId);
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
    if (data.favorecidoId) formData.append('favorecidoId', data.favorecidoId);
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

  async fetchExpensesSummary(filters: ExpenseFilter = {}): Promise<ExpenseStatusSummary> {
    const params = new URLSearchParams();

    params.append('organizationId', ORGANIZATION_ID);

    Object.entries(filters).forEach(([key, value]) => {
      // The summary always returns all four status buckets, so the status
      // filter must not be forwarded (it would zero out the other buckets).
      if (key === 'status') {
        return;
      }
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, String(value));
        }
      }
    });

    return apiClient.get<ExpenseStatusSummary>('/expenses/summary', { params }) as unknown as Promise<ExpenseStatusSummary>;
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

  /**
   * Cancela uma despesa (backend: DELETE /expenses/:id) e devolve o DTO
   * atualizado com status CANCELLED. O `organizationId` é injetado pelo
   * interceptor do api-client para o namespace `/expenses`, por isso a URL
   * não monta a query string manualmente.
   */
  async cancel(id: string): Promise<ExpenseDTO> {
    return apiClient.delete(`/expenses/${id}`) as unknown as Promise<ExpenseDTO>;
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

  /**
   * Confirma o valor de uma despesa gerada por recorrência de valor variável
   * (backend: POST /expenses/:id/confirm-amount). Não há corpo — a confirmação
   * apenas trava o valor herdado da ocorrência anterior. O `organizationId` é
   * injetado pelo interceptor do api-client para o namespace `/expenses`, como
   * em `cancel`, por isso a query string não é montada manualmente.
   */
  async confirmAmount(id: string): Promise<ConfirmExpenseAmountOutput> {
    return apiClient.post(
      `/expenses/${id}/confirm-amount`
    ) as unknown as Promise<ConfirmExpenseAmountOutput>;
  }

  /**
   * Reenvia manualmente uma despesa para o Google Agenda
   * (backend: POST /expenses/:id/calendar-sync). Não há corpo — o backend relê o
   * estado da sincronização e o devolve no `ResyncCalendarOutput`. O
   * `organizationId` é injetado pelo interceptor do api-client para o namespace
   * `/expenses`, como em `confirmAmount`, por isso a query string não é montada
   * manualmente (montá-la com `URLSearchParams` faria o interceptor descartar o
   * `organizationId` em silêncio — ver ADR-002).
   *
   * A resposta é `200` mesmo quando a tentativa falha: o `calendarSyncStatus` do
   * corpo carrega o resultado, não o código HTTP.
   */
  async resyncCalendar(id: string): Promise<ResyncCalendarOutput> {
    return apiClient.post(
      `/expenses/${id}/calendar-sync`
    ) as unknown as Promise<ResyncCalendarOutput>;
  }
}
