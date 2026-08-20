import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecurringExpensesApiService } from '../recurring-expenses-api';

const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockPut = vi.hoisted(() => vi.fn());

vi.mock('../../lib/api-client', () => ({
  apiClient: { get: mockGet, post: mockPost, put: mockPut },
  injectOrganizationId: (config: unknown) => config,
}));

const ORG = 'fca3c088-ba34-43a2-9b32-b2b1a1246915';

/** Backend-shaped recurrence: dates arrive as ISO strings, as JSON delivers them. */
function rawRecurrence(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rec-1',
    organizationId: ORG,
    description: 'Aluguel',
    favorecidoId: 'fav-1',
    categoryId: null,
    amountType: 'VARIABLE',
    amount: 1000,
    paymentMethod: 'Boleto',
    municipality: 'São Paulo',
    dueDay: 15,
    startDate: '2026-08-19T00:00:00.000Z',
    endDate: null,
    status: 'ACTIVE',
    terminationReason: null,
    terminatedAt: null,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-02T11:00:00.000Z',
    ...overrides,
  };
}

function rawGeneratedOccurrence(overrides: Record<string, unknown> = {}) {
  return {
    id: 'occ-1',
    recurringExpenseId: 'rec-1',
    description: 'Aluguel',
    amount: 1000,
    dueDate: '2026-09-15T00:00:00.000Z',
    occurrenceMonth: '2026-09-01T00:00:00.000Z',
    status: 'OPEN',
    amountPendingConfirmation: true,
    ...overrides,
  };
}

function rawTerminationExpense(overrides: Record<string, unknown> = {}) {
  return {
    id: 'occ-1',
    description: 'Aluguel',
    amount: 1000,
    dueDate: '2026-10-15T00:00:00.000Z',
    occurrenceMonth: null,
    status: 'OPEN',
    ...overrides,
  };
}

describe('RecurringExpensesApiService', () => {
  let service: RecurringExpensesApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecurringExpensesApiService();
  });

  describe('fetchRecurringExpenses', () => {
    it('sends limit: 100 explicitly as a plain-object param', async () => {
      mockGet.mockResolvedValue({
        data: [rawRecurrence()],
        pagination: { page: 1, limit: 100, total: 1 },
      });

      await service.fetchRecurringExpenses();

      expect(mockGet).toHaveBeenCalledWith('/recurring-expenses', {
        params: { limit: '100' },
      });
      const params = mockGet.mock.calls[0][1].params;
      expect(params).not.toBeInstanceOf(URLSearchParams);
      expect(params).toEqual({ limit: '100' });
    });

    it('honours an explicit limit override', async () => {
      mockGet.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 50, total: 0 },
      });

      await service.fetchRecurringExpenses(50);

      expect(mockGet).toHaveBeenCalledWith('/recurring-expenses', {
        params: { limit: '50' },
      });
    });

    it('converts startDate, createdAt and updatedAt to Date instances', async () => {
      mockGet.mockResolvedValue({
        data: [rawRecurrence()],
        pagination: { page: 1, limit: 100, total: 1 },
      });

      const result = await service.fetchRecurringExpenses();
      const [recurrence] = result.data;

      expect(recurrence.startDate).toBeInstanceOf(Date);
      expect(recurrence.startDate.getTime()).toBe(new Date('2026-08-19T00:00:00.000Z').getTime());
      expect(recurrence.createdAt).toBeInstanceOf(Date);
      expect(recurrence.updatedAt).toBeInstanceOf(Date);
    });

    it('keeps endDate null without turning it into Invalid Date', async () => {
      mockGet.mockResolvedValue({
        data: [rawRecurrence({ endDate: null })],
        pagination: { page: 1, limit: 100, total: 1 },
      });

      const result = await service.fetchRecurringExpenses();

      expect(result.data[0].endDate).toBeNull();
    });

    it('converts a present endDate to Date', async () => {
      mockGet.mockResolvedValue({
        data: [rawRecurrence({ endDate: '2027-08-19T00:00:00.000Z' })],
        pagination: { page: 1, limit: 100, total: 1 },
      });

      const result = await service.fetchRecurringExpenses();

      expect(result.data[0].endDate).toBeInstanceOf(Date);
      expect(result.data[0].endDate?.getTime()).toBe(
        new Date('2027-08-19T00:00:00.000Z').getTime()
      );
    });

    it('leaves dueDay as the number, never converting it', async () => {
      mockGet.mockResolvedValue({
        data: [rawRecurrence({ dueDay: 15 })],
        pagination: { page: 1, limit: 100, total: 1 },
      });

      const result = await service.fetchRecurringExpenses();

      expect(result.data[0].dueDay).toBe(15);
      expect(typeof result.data[0].dueDay).toBe('number');
    });

    it('converts terminatedAt when present and preserves it null otherwise', async () => {
      mockGet.mockResolvedValue({
        data: [
          rawRecurrence({ terminatedAt: '2026-12-01T00:00:00.000Z' }),
          rawRecurrence({ id: 'rec-2', terminatedAt: null }),
        ],
        pagination: { page: 1, limit: 100, total: 2 },
      });

      const result = await service.fetchRecurringExpenses();

      expect(result.data[0].terminatedAt).toBeInstanceOf(Date);
      expect(result.data[1].terminatedAt).toBeNull();
    });
  });

  describe('fetchById', () => {
    it('maps the recurrence dates', async () => {
      mockGet.mockResolvedValue(rawRecurrence());

      const result = await service.fetchById('rec-1');

      expect(mockGet).toHaveBeenCalledWith('/recurring-expenses/rec-1');
      expect(result.startDate).toBeInstanceOf(Date);
    });
  });

  describe('checkDuplicates', () => {
    it('sends favorecidoId, amount and dueDay as plain-object params', async () => {
      mockGet.mockResolvedValue({ duplicates: [rawRecurrence()] });

      const result = await service.checkDuplicates({
        favorecidoId: 'fav-1',
        amount: 1000,
        dueDay: 15,
      });

      expect(mockGet).toHaveBeenCalledWith('/recurring-expenses/duplicate-check', {
        params: { favorecidoId: 'fav-1', amount: '1000', dueDay: '15' },
      });
      expect(mockGet.mock.calls[0][1].params).not.toBeInstanceOf(URLSearchParams);
      expect(result.duplicates[0].startDate).toBeInstanceOf(Date);
    });
  });

  describe('create', () => {
    it('posts the input body and returns recurrence + occurrences with dates as Date', async () => {
      mockPost.mockResolvedValue({
        recurrence: rawRecurrence(),
        generatedOccurrences: [rawGeneratedOccurrence()],
      });

      const result = await service.create({
        favorecidoId: 'fav-1',
        description: 'Aluguel',
        amountType: 'VARIABLE',
        amount: 1000,
        municipality: 'São Paulo',
        dueDay: 15,
        startDate: new Date('2026-08-19T00:00:00.000Z'),
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/recurring-expenses',
        expect.objectContaining({ description: 'Aluguel' })
      );
      expect(result.recurrence.startDate).toBeInstanceOf(Date);
      expect(result.recurrence.createdAt).toBeInstanceOf(Date);
      const [occurrence] = result.generatedOccurrences;
      expect(occurrence.dueDate).toBeInstanceOf(Date);
      expect(occurrence.occurrenceMonth).toBeInstanceOf(Date);
      expect(occurrence.occurrenceMonth.getTime()).toBe(
        new Date('2026-09-01T00:00:00.000Z').getTime()
      );
    });
  });

  describe('update', () => {
    it('puts the input body and maps the returned recurrence', async () => {
      mockPut.mockResolvedValue(rawRecurrence({ description: 'Aluguel novo' }));

      const result = await service.update('rec-1', { description: 'Aluguel novo' });

      expect(mockPut).toHaveBeenCalledWith('/recurring-expenses/rec-1', {
        description: 'Aluguel novo',
      });
      expect(result.description).toBe('Aluguel novo');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('fetchTerminationPreview', () => {
    it('reads cancellableExpenses and returns the mapped list', async () => {
      mockGet.mockResolvedValue({
        effectiveDate: '2026-10-01T00:00:00.000Z',
        cancellableExpenses: [
          rawTerminationExpense(),
          rawTerminationExpense({ id: 'occ-2', occurrenceMonth: '2026-11-01T00:00:00.000Z' }),
        ],
      });

      const effectiveDate = new Date('2026-10-01T00:00:00.000Z');
      const result = await service.fetchTerminationPreview('rec-1', effectiveDate);

      expect(mockGet).toHaveBeenCalledWith(
        '/recurring-expenses/rec-1/termination-preview',
        { params: { effectiveDate: effectiveDate.toISOString() } }
      );
      expect(result.cancellableExpenses).toHaveLength(2);
      expect(result.effectiveDate).toBeInstanceOf(Date);
      expect(result.cancellableExpenses[0].dueDate).toBeInstanceOf(Date);
      expect(result.cancellableExpenses[0].occurrenceMonth).toBeNull();
      expect(result.cancellableExpenses[1].occurrenceMonth).toBeInstanceOf(Date);
    });
  });

  describe('terminate', () => {
    it('posts the termination body and maps the returned recurrence', async () => {
      mockPost.mockResolvedValue({
        recurrence: rawRecurrence({ status: 'ENDED' }),
        cancelledExpenseIds: ['occ-1', 'occ-2'],
      });

      const result = await service.terminate('rec-1', {
        effectiveDate: new Date('2026-10-01T00:00:00.000Z'),
        reason: 'Contrato encerrado',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/recurring-expenses/rec-1/termination',
        expect.objectContaining({ reason: 'Contrato encerrado' })
      );
      expect(result.recurrence.terminatedAt).toBeNull();
      expect(result.recurrence.startDate).toBeInstanceOf(Date);
      expect(result.cancelledExpenseIds).toEqual(['occ-1', 'occ-2']);
    });
  });
});
