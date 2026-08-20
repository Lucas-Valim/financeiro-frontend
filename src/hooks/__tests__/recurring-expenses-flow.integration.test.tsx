import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRecurringExpenses } from '../use-recurring-expenses';
import { useRecurringExpenseForm } from '../useRecurringExpenseForm';
import type {
  CreateRecurringExpenseOutput,
  ListRecurringExpensesOutput,
  RecurringExpenseDTO,
} from '../../types/recurring-expenses';
import type { RecurringExpenseFormData } from '../../schemas/recurring-expense-form-schema';

const mockFetchRecurringExpenses = vi.hoisted(() => vi.fn());
const mockCheckDuplicates = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('../../api/recurring-expenses-api', () => ({
  recurringExpensesApiService: {
    fetchRecurringExpenses: mockFetchRecurringExpenses,
    checkDuplicates: mockCheckDuplicates,
    create: mockCreate,
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const validFormData: RecurringExpenseFormData = {
  description: 'Aluguel do escritório',
  favorecidoId: VALID_UUID,
  categoryId: null,
  amountType: 'FIXED',
  amount: 1500,
  paymentMethod: null,
  municipality: 'São Paulo',
  dueDay: 10,
  startDate: new Date('2026-01-01'),
  endDate: null,
};

const newRecurringExpense: RecurringExpenseDTO = {
  id: 'rec-new',
  organizationId: 'org-1',
  description: 'Aluguel do escritório',
  favorecidoId: VALID_UUID,
  categoryId: null,
  amountType: 'FIXED',
  amount: 1500,
  paymentMethod: null,
  municipality: 'São Paulo',
  dueDay: 10,
  startDate: new Date('2026-01-01'),
  endDate: null,
  status: 'ACTIVE',
  terminationReason: null,
  terminatedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const emptyList: ListRecurringExpensesOutput = {
  data: [],
  pagination: { page: 1, limit: 100, total: 0 },
};

const listWithNew: ListRecurringExpensesOutput = {
  data: [newRecurringExpense],
  pagination: { page: 1, limit: 100, total: 1 },
};

const createOutput: CreateRecurringExpenseOutput = {
  recurrence: newRecurringExpense,
  generatedOccurrences: [],
};

function useRecurringFlow() {
  const list = useRecurringExpenses();
  const form = useRecurringExpenseForm();
  return { list, form };
}

describe('recurring expenses flow (create → invalidate → relist)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckDuplicates.mockResolvedValue({ duplicates: [] });
    mockCreate.mockResolvedValue(createOutput);
    // First list load is empty; after the create invalidation the refetch returns
    // the freshly created recurrence.
    mockFetchRecurringExpenses
      .mockResolvedValueOnce(emptyList)
      .mockResolvedValue(listWithNew);
  });

  it('creates a recurrence and, after invalidation, the list returns the new record', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useRecurringFlow(), { wrapper: Wrapper });

    // The list starts empty.
    await waitFor(() => {
      expect(result.current.list.isLoading).toBe(false);
    });
    expect(result.current.list.data).toHaveLength(0);

    // Submit a valid creation.
    act(() => result.current.form.form.reset(validFormData));
    await act(async () => {
      await result.current.form.onSubmit();
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);

    // After the create invalidates ['recurring-expenses'], the active list observer
    // refetches and surfaces the new record.
    await waitFor(() => {
      expect(result.current.list.data).toHaveLength(1);
    });
    expect(result.current.list.data[0].id).toBe('rec-new');
    expect(result.current.list.total).toBe(1);
  });
});
