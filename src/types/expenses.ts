import type { ExpenseStatus } from '../constants/expenses';

/**
 * Resultado da sincronização de uma despesa com o Google Agenda, como campo
 * primitivo do DTO — não é `enum` (o projeto reserva `enum` para `ExpenseStatus`;
 * os demais marcadores também chegam como primitivos). Os três marcadores chegam
 * do backend; `null` no DTO significa "ainda não entrou na integração".
 */
export type CalendarSyncStatus = 'SYNCED' | 'FAILED' | 'UNAUTHORIZED';

/**
 * Data Transfer Object representing an expense entity from the API
 */
export interface ExpenseDTO {
  id: string;
  organizationId: string;
  categoryId: string | null;
  favorecidoId: string | null;
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
  recurringExpenseId: string | null; // origem; null em despesa manual
  occurrenceMonth: Date | null; // competência da ocorrência
  amountPendingConfirmation: boolean; // bloqueia o pagamento
  documentPending: boolean; // derivado pela API, nunca recalculado
  /**
   * Resultado da sincronização com o Google Agenda. `null` significa que a
   * despesa AINDA NÃO entrou na integração — não é falha. É esse contrato que
   * impede o marcador de piscar na despesa recém-criada, antes de a
   * sincronização acontecer. A falha se lê por `hasCalendarSyncFailure`, nunca
   * por não-nulo.
   */
  calendarSyncStatus: CalendarSyncStatus | null;
  /** Link do evento no Google; `null` enquanto não houver evento. */
  calendarEventUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new expense
 * All required fields must be provided for expense creation
 */
export interface CreateExpenseInput {
  organizationId: string;
  favorecidoId: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
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
  favorecidoId?: string;
  description?: string;
  amount?: number;
  dueDate?: Date;
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
  paymentMethod?: string;
  categoryId?: string;
  dueDateStart?: Date;
  dueDateEnd?: Date;
}

export interface ExpenseStatusSummaryItem {
  count: number;
  total: number; // soma completa — inclui o estimado
  estimatedCount: number; // usado na sublinha do card: "N de M estimadas"
  estimatedTotal: number;
}

export type ExpenseStatusSummary = Record<
  ExpenseStatus,
  ExpenseStatusSummaryItem
>;

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface ListExpensesOutput {
  data: ExpenseDTO[];
  pagination: Pagination;
}

/**
 * Quase-duplicata de `ExpenseDTO` (contrato do `GET /expenses/:id`). Ela
 * deliberadamente NÃO recebeu os quatro campos novos da recorrência
 * (`recurringExpenseId`, `occurrenceMonth`, `amountPendingConfirmation`,
 * `documentPending`): nenhum consumidor deste tipo os lê, então a divergência é
 * intencional e fica registrada aqui para não ser "corrigida" por engano.
 */
export interface GetExpenseOutput {
  id: string;
  organizationId: string;
  categoryId: string | null;
  favorecidoId: string | null;
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

/**
 * Resposta de `POST /expenses/:id/confirm-amount`. NÃO é um `ExpenseDTO`
 * completo: o backend projeta um tipo reduzido, sem `favorecidoId`,
 * `bankBillUrl`, `recurringExpenseId`, `occurrenceMonth`, `documentPending` nem
 * `paymentDate`. Por isso a confirmação nunca é escrita no cache com
 * `setQueryData` (apagaria os campos que os marcadores leem) — a atualização das
 * telas vem sempre da invalidação (ADR-006). O `amountPendingConfirmation` volta
 * `false` após a confirmação.
 */
export interface ConfirmExpenseAmountOutput {
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
  amountPendingConfirmation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resposta de `POST /expenses/:id/calendar-sync` (reenvio manual). O
 * `calendarSyncStatus` é o RESULTADO da tentativa lido do corpo, e NÃO o código
 * HTTP: uma falha também responde `200`, porque o recurso lido é o estado da
 * sincronização, e ele foi lido (ADR-002). O interceptor do `apiClient`
 * colapsaria um código de erro em texto genérico, apagando a diferença entre
 * "tente de novo" e "acione o suporte" — por isso o resultado vem como dado.
 *
 * NÃO é um `ExpenseDTO`: é uma projeção reduzida, sem os campos que os outros
 * marcadores leem, então nunca deve ser escrita no cache com `setQueryData`. A
 * atualização das telas vem sempre da invalidação de `['expenses']`.
 */
export interface ResyncCalendarOutput {
  calendarSyncStatus: CalendarSyncStatus;
  calendarEventUrl: string | null;
  calendarSyncedAt: string;
}
