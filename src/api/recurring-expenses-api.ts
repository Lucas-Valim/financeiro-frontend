import { apiClient } from '../lib/api-client';
import type {
  CreateRecurringExpenseInput,
  CreateRecurringExpenseOutput,
  DuplicateCheckOutput,
  DuplicateCheckParams,
  GeneratedOccurrenceDTO,
  ListRecurringExpensesOutput,
  RecurringExpenseDTO,
  TerminateInput,
  TerminationExpenseDTO,
  TerminationPreview,
  TerminationResult,
  UpdateRecurringExpenseInput,
} from '../types/recurring-expenses';

const RECURRING_EXPENSES_PATH = '/recurring-expenses';

/**
 * The backend defaults `limit` to 20 and caps it at 100. We send 100 explicitly
 * so the list is not truncated silently, with the footer count contradicting the
 * screen. The hook compares `data.length` with `pagination.total` to warn on cut.
 */
const DEFAULT_LIST_LIMIT = 100;

/* --------------------------------------------------------- date normalization */
// Border normalization (ADR-007): every date field is converted to `Date` here,
// before reaching any hook or component. `null` stays `null`; `dueDay`, being a
// number, is never touched. Each response shape has its own mapper — the two
// embedded occurrence types are NOT `ExpenseDTO`, so the expense mapper cannot be
// reused for them.

function mapRecurringExpenseDates(dto: RecurringExpenseDTO): RecurringExpenseDTO {
  return {
    ...dto,
    startDate: new Date(dto.startDate),
    endDate: dto.endDate ? new Date(dto.endDate) : null,
    terminatedAt: dto.terminatedAt ? new Date(dto.terminatedAt) : null,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

function mapGeneratedOccurrenceDates(dto: GeneratedOccurrenceDTO): GeneratedOccurrenceDTO {
  return {
    ...dto,
    dueDate: new Date(dto.dueDate),
    occurrenceMonth: new Date(dto.occurrenceMonth),
  };
}

function mapTerminationExpenseDates(dto: TerminationExpenseDTO): TerminationExpenseDTO {
  return {
    ...dto,
    dueDate: new Date(dto.dueDate),
    occurrenceMonth: dto.occurrenceMonth ? new Date(dto.occurrenceMonth) : null,
  };
}

/* ---------------------------------------------------------------- query params */
/**
 * Builds query params as a plain object (the `reports-api` model), NOT a
 * `URLSearchParams`. This is required: `injectOrganizationId` writes
 * `config.params.organizationId`, which axios discards when `config.params` is a
 * `URLSearchParams`. A plain object lets the interceptor inject the org scope.
 */
function buildListParams(limit: number): Record<string, string> {
  return { limit: String(limit) };
}

function buildDuplicateParams(params: DuplicateCheckParams): Record<string, string> {
  return {
    favorecidoId: params.favorecidoId,
    amount: String(params.amount),
    dueDay: String(params.dueDay),
  };
}

export class RecurringExpensesApiService {
  async fetchRecurringExpenses(
    limit: number = DEFAULT_LIST_LIMIT
  ): Promise<ListRecurringExpensesOutput> {
    const response = (await apiClient.get<ListRecurringExpensesOutput>(RECURRING_EXPENSES_PATH, {
      params: buildListParams(limit),
    })) as unknown as ListRecurringExpensesOutput;

    return {
      data: response.data.map(mapRecurringExpenseDates),
      pagination: response.pagination,
    };
  }

  async fetchById(id: string): Promise<RecurringExpenseDTO> {
    const response = (await apiClient.get<RecurringExpenseDTO>(
      `${RECURRING_EXPENSES_PATH}/${id}`
    )) as unknown as RecurringExpenseDTO;

    return mapRecurringExpenseDates(response);
  }

  async checkDuplicates(params: DuplicateCheckParams): Promise<DuplicateCheckOutput> {
    const response = (await apiClient.get<DuplicateCheckOutput>(
      `${RECURRING_EXPENSES_PATH}/duplicate-check`,
      { params: buildDuplicateParams(params) }
    )) as unknown as DuplicateCheckOutput;

    return { duplicates: response.duplicates.map(mapRecurringExpenseDates) };
  }

  async create(input: CreateRecurringExpenseInput): Promise<CreateRecurringExpenseOutput> {
    const response = (await apiClient.post<CreateRecurringExpenseOutput>(
      RECURRING_EXPENSES_PATH,
      input
    )) as unknown as CreateRecurringExpenseOutput;

    return {
      recurrence: mapRecurringExpenseDates(response.recurrence),
      generatedOccurrences: response.generatedOccurrences.map(mapGeneratedOccurrenceDates),
    };
  }

  async update(id: string, input: UpdateRecurringExpenseInput): Promise<RecurringExpenseDTO> {
    const response = (await apiClient.put<RecurringExpenseDTO>(
      `${RECURRING_EXPENSES_PATH}/${id}`,
      input
    )) as unknown as RecurringExpenseDTO;

    return mapRecurringExpenseDates(response);
  }

  async fetchTerminationPreview(id: string, effectiveDate: Date): Promise<TerminationPreview> {
    const response = (await apiClient.get<TerminationPreview>(
      `${RECURRING_EXPENSES_PATH}/${id}/termination-preview`,
      { params: { effectiveDate: effectiveDate.toISOString() } }
    )) as unknown as TerminationPreview;

    return {
      effectiveDate: new Date(response.effectiveDate),
      cancellableExpenses: response.cancellableExpenses.map(mapTerminationExpenseDates),
    };
  }

  async terminate(id: string, input: TerminateInput): Promise<TerminationResult> {
    const response = (await apiClient.post<TerminationResult>(
      `${RECURRING_EXPENSES_PATH}/${id}/termination`,
      input
    )) as unknown as TerminationResult;

    return {
      recurrence: mapRecurringExpenseDates(response.recurrence),
      cancelledExpenseIds: response.cancelledExpenseIds,
    };
  }
}

export const recurringExpensesApiService = new RecurringExpensesApiService();
