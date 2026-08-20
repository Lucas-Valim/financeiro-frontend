import type { ExpenseStatus } from '../constants/expenses';
import type { Pagination } from './expenses';

export type RecurrenceAmountType = 'FIXED' | 'VARIABLE';
export type RecurringExpenseStatus = 'ACTIVE' | 'ENDED';

/**
 * A recurring expense series as returned by the API.
 *
 * Deliberately has NO `receiver`: unlike `ExpenseDTO`, the backend does not join
 * the favorecido name here (the DAO does a plain `findAll`). The name is resolved
 * on the client from `useFavorecidos(organizationId)`. Adding `receiver` would
 * create a field that never arrives populated.
 *
 * `deletedAt` also comes on the wire (soft delete) but is intentionally omitted:
 * no screen consumes it.
 */
export interface RecurringExpenseDTO {
  id: string;
  organizationId: string;
  description: string;
  favorecidoId: string; // só o id — a API NÃO devolve o nome
  categoryId: string | null;
  amountType: RecurrenceAmountType;
  amount: number; // definitivo em FIXED; sugestão inicial em VARIABLE
  paymentMethod: string | null;
  municipality: string;
  dueDay: number; // 1–31 — número, nunca convertido para Date
  startDate: Date;
  endDate: Date | null;
  status: RecurringExpenseStatus;
  terminationReason: string | null;
  terminatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A materialized occurrence returned alongside a freshly created recurrence, so
 * the modal can show the result before closing. It is NOT an `ExpenseDTO`: the
 * backend projects a reduced type without `receiver`, `municipality`, `currency`,
 * `favorecidoId`, `documentPending` or the document URLs.
 */
export interface GeneratedOccurrenceDTO {
  id: string;
  recurringExpenseId: string;
  description: string;
  amount: number;
  dueDate: Date;
  occurrenceMonth: Date;
  status: ExpenseStatus;
  amountPendingConfirmation: boolean;
}

/**
 * An occurrence a termination would cancel, shown in the preview before the user
 * confirms. Also a reduced type — not an `ExpenseDTO`.
 */
export interface TerminationExpenseDTO {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  occurrenceMonth: Date | null;
  status: ExpenseStatus;
}

/**
 * Termination preview. The list field is named `cancellableExpenses`, exactly as
 * the backend returns it — reading the wrong name would yield `undefined` and the
 * screen would report that nothing will be cancelled right before cancelling.
 */
export interface TerminationPreview {
  effectiveDate: Date;
  cancellableExpenses: TerminationExpenseDTO[];
}

/**
 * Create body. `organizationId` is NOT included: the backend reads it from the
 * query string, where the `injectOrganizationId` interceptor puts it.
 */
export interface CreateRecurringExpenseInput {
  favorecidoId: string;
  categoryId?: string | null;
  description: string;
  amountType: RecurrenceAmountType;
  amount: number;
  paymentMethod?: string | null;
  municipality: string;
  dueDay: number;
  startDate: Date;
  endDate?: Date | null;
}

/**
 * Update body. `amountType` and `startDate` are intentionally absent: they are
 * immutable after creation and the backend Zod discards them silently.
 */
export interface UpdateRecurringExpenseInput {
  favorecidoId?: string;
  categoryId?: string | null;
  description?: string;
  amount?: number;
  paymentMethod?: string | null;
  municipality?: string;
  dueDay?: number;
  endDate?: Date | null;
}

/** Query params for the non-blocking duplicate warning (`/duplicate-check`). */
export interface DuplicateCheckParams {
  favorecidoId: string;
  amount: number;
  dueDay: number;
}

export interface DuplicateCheckOutput {
  duplicates: RecurringExpenseDTO[];
}

/** Body for `POST /recurring-expenses/:id/termination`. */
export interface TerminateInput {
  effectiveDate: Date;
  reason?: string | null;
}

export interface ListRecurringExpensesOutput {
  data: RecurringExpenseDTO[];
  pagination: Pagination;
}

export interface CreateRecurringExpenseOutput {
  recurrence: RecurringExpenseDTO;
  generatedOccurrences: GeneratedOccurrenceDTO[];
}

export interface TerminationResult {
  recurrence: RecurringExpenseDTO;
  cancelledExpenseIds: string[];
}
