import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useRecurringExpenseForm } from '../useRecurringExpenseForm';
import type {
  CreateRecurringExpenseOutput,
  RecurringExpenseDTO,
} from '../../types/recurring-expenses';
import type { RecurringExpenseFormData } from '../../schemas/recurring-expense-form-schema';

const mockCheckDuplicates = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());

vi.mock('../../api/recurring-expenses-api', () => ({
  recurringExpensesApiService: {
    checkDuplicates: mockCheckDuplicates,
    create: mockCreate,
    update: mockUpdate,
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
  amountType: 'VARIABLE',
  amount: 1500,
  paymentMethod: null,
  municipality: 'São Paulo',
  dueDay: 10,
  startDate: new Date('2026-01-01'),
  endDate: null,
};

function buildRecurringExpense(
  overrides: Partial<RecurringExpenseDTO> = {}
): RecurringExpenseDTO {
  return {
    id: 'rec-1',
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
    ...overrides,
  };
}

const createOutput: CreateRecurringExpenseOutput = {
  recurrence: buildRecurringExpense(),
  generatedOccurrences: [
    {
      id: 'occ-1',
      recurringExpenseId: 'rec-1',
      description: 'Aluguel do escritório',
      amount: 1500,
      dueDate: new Date('2026-01-10'),
      occurrenceMonth: new Date('2026-01-01'),
      status: 'OPEN' as never,
      amountPendingConfirmation: true,
    },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, queryClient };
}

describe('useRecurringExpenseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckDuplicates.mockResolvedValue({ duplicates: [] });
    mockCreate.mockResolvedValue(createOutput);
    mockUpdate.mockResolvedValue(buildRecurringExpense({ amount: 2000 }));
  });

  describe('mode detection', () => {
    it('is in create mode with no initial recurrence', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useRecurringExpenseForm(), { wrapper: Wrapper });

      expect(result.current.isEditMode).toBe(false);
    });

    it('is in edit mode with an initial recurrence', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useRecurringExpenseForm({ initialRecurringExpense: buildRecurringExpense() }),
        { wrapper: Wrapper }
      );

      expect(result.current.isEditMode).toBe(true);
    });
  });

  describe('create path — duplicate check', () => {
    it('calls duplicate-check before the POST', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useRecurringExpenseForm(), { wrapper: Wrapper });

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockCheckDuplicates).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCheckDuplicates.mock.invocationCallOrder[0]).toBeLessThan(
        mockCreate.mock.invocationCallOrder[0]
      );
    });

    it('does not fire the POST while duplicates await confirmation', async () => {
      mockCheckDuplicates.mockResolvedValue({ duplicates: [buildRecurringExpense()] });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useRecurringExpenseForm(), { wrapper: Wrapper });

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockCheckDuplicates).toHaveBeenCalledTimes(1);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(result.current.isDuplicateDialogOpen).toBe(true);
      expect(result.current.duplicates).toHaveLength(1);
    });

    it('proceeds with the original POST once the duplicate is confirmed', async () => {
      mockCheckDuplicates.mockResolvedValue({ duplicates: [buildRecurringExpense()] });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useRecurringExpenseForm(), { wrapper: Wrapper });

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockCreate).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.confirmDuplicate();
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          favorecidoId: VALID_UUID,
          amount: 1500,
          dueDay: 10,
        })
      );
      expect(result.current.isDuplicateDialogOpen).toBe(false);
    });
  });

  describe('duplicate-check resilience', () => {
    it('proceeds with the create when duplicate-check fails (never blocks)', async () => {
      mockCheckDuplicates.mockRejectedValue(new Error('Network error'));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useRecurringExpenseForm(), { wrapper: Wrapper });

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      // A failed duplicate-check is swallowed; the POST goes through as if there
      // were no matches, and no warning dialog is shown.
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result.current.isDuplicateDialogOpen).toBe(false);
    });
  });

  describe('duplicate dialog dismissal', () => {
    it('cancelDuplicate closes the warning and clears duplicates without creating', async () => {
      mockCheckDuplicates.mockResolvedValue({ duplicates: [buildRecurringExpense()] });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useRecurringExpenseForm(), { wrapper: Wrapper });

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(result.current.isDuplicateDialogOpen).toBe(true);

      act(() => result.current.cancelDuplicate());

      expect(result.current.isDuplicateDialogOpen).toBe(false);
      expect(result.current.duplicates).toHaveLength(0);
      expect(mockCreate).not.toHaveBeenCalled();
      // The form stays filled so the user can adjust and resubmit.
      expect(result.current.form.getValues('description')).toBe('Aluguel do escritório');
    });
  });

  describe('resetForm', () => {
    it('restores the initial recurrence and clears generated occurrences', async () => {
      const { Wrapper } = createWrapper();
      const initial = buildRecurringExpense();
      const { result } = renderHook(
        () => useRecurringExpenseForm({ initialRecurringExpense: initial }),
        { wrapper: Wrapper }
      );

      act(() => result.current.form.setValue('description', 'Alterado', { shouldDirty: true }));

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });

      act(() => result.current.resetForm());

      expect(result.current.form.getValues('description')).toBe(initial.description);
      expect(result.current.recurringExpense).toBe(initial);
      expect(result.current.generatedOccurrences).toHaveLength(0);
    });
  });

  describe('edit path', () => {
    it('does NOT call duplicate-check', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useRecurringExpenseForm({ initialRecurringExpense: buildRecurringExpense() }),
        { wrapper: Wrapper }
      );

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockCheckDuplicates).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it('never sends amountType nor startDate in the update payload', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useRecurringExpenseForm({ initialRecurringExpense: buildRecurringExpense() }),
        { wrapper: Wrapper }
      );

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      const updatePayload = mockUpdate.mock.calls[0][1];
      expect(updatePayload).not.toHaveProperty('amountType');
      expect(updatePayload).not.toHaveProperty('startDate');
    });
  });

  describe('cache invalidation', () => {
    it('invalidates recurring-expenses and the three expense roots on create', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRecurringExpenseForm(), { wrapper: Wrapper });

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recurring-expenses'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses-summary'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expense-report-summary'] });
      expect(invalidateSpy).toHaveBeenCalledTimes(4);
    });

    it('invalidates only recurring-expenses on edit', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useRecurringExpenseForm({ initialRecurringExpense: buildRecurringExpense() }),
        { wrapper: Wrapper }
      );

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recurring-expenses'] });
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('generated occurrences', () => {
    it('exposes the occurrences returned by create', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useRecurringExpenseForm(), { wrapper: Wrapper });

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      await waitFor(() => {
        expect(result.current.generatedOccurrences).toHaveLength(1);
      });
      expect(result.current.generatedOccurrences[0].id).toBe('occ-1');
    });
  });

  describe('error handling', () => {
    it('shows the backend 409 message for an ended recurrence untranslated', async () => {
      mockUpdate.mockRejectedValue(new Error('Recorrência já está encerrada'));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(
        () => useRecurringExpenseForm({ initialRecurringExpense: buildRecurringExpense() }),
        { wrapper: Wrapper }
      );

      act(() => result.current.form.reset(validFormData));

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith('Recorrência já está encerrada');
    });

    it('does not call the POST when the form is invalid', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useRecurringExpenseForm(), { wrapper: Wrapper });

      // Default values are invalid (empty description, no amount, etc.)
      await act(async () => {
        await result.current.onSubmit();
      });

      expect(mockCheckDuplicates).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
