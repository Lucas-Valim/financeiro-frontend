import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExpenseForm } from '../useExpenseForm';
import { ExpenseStatus } from '../../constants/expenses';
import type { ExpenseDTO } from '../../types/expenses';
import { toast } from 'sonner';

// Mock the ExpensesApiService class - define mocks inside the callback to avoid hoisting issues
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());

vi.mock('../../api/expenses-api', () => {
  return {
    ExpensesApiService: class MockExpensesApiService {
      create = mockCreate;
      update = mockUpdate;
      fetchExpenses = vi.fn();
      fetchExpenseById = vi.fn();
    },
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useExpenseForm', () => {
  const mockExpense: ExpenseDTO = {
    id: 'expense-1',
    organizationId: 'org-1',
    categoryId: null,
    description: 'Test expense',
    amount: 100.50,
    currency: 'BRL',
    dueDate: new Date('2024-12-31'),
    status: ExpenseStatus.OPEN,
    paymentMethod: 'Credit Card',
    paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Test Receiver',
    municipality: 'Test City',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const validFormData = {
    description: 'Valid expense',
    amount: 200.00,
    currency: 'BRL',
    dueDate: new Date('2024-12-31'),
    status: ExpenseStatus.OPEN,
    categoryId: null,
    paymentMethod: null,
    receiver: 'Valid Receiver',
    municipality: 'Valid City',
    serviceInvoice: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(mockExpense);
    mockUpdate.mockResolvedValue(mockExpense);
  });

  describe('initialization', () => {
    it('should initialize with correct default values for create mode', () => {
      const { result } = renderHook(() => useExpenseForm());

      expect(result.current.form.getValues('description')).toBe('');
      expect(result.current.form.getValues('amount')).toBeUndefined();
      expect(result.current.form.getValues('currency')).toBe('BRL');
      expect(result.current.form.getValues('status')).toBe(ExpenseStatus.OPEN);
      expect(result.current.form.getValues('categoryId')).toBeNull();
      expect(result.current.form.getValues('paymentMethod')).toBeNull();
      expect(result.current.form.getValues('receiver')).toBe('');
      expect(result.current.form.getValues('municipality')).toBe('');
      expect(result.current.form.getValues('serviceInvoice')).toBeNull();
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.expense).toBeNull();
    });

    it('should populate form with initial data for edit mode', () => {
      const { result } = renderHook(() =>
        useExpenseForm({ initialExpense: mockExpense })
      );

      expect(result.current.form.getValues('description')).toBe(mockExpense.description);
      expect(result.current.form.getValues('amount')).toBe(mockExpense.amount);
      expect(result.current.form.getValues('currency')).toBe(mockExpense.currency);
      expect(result.current.form.getValues('status')).toBe(mockExpense.status);
      expect(result.current.form.getValues('receiver')).toBe(mockExpense.receiver);
      expect(result.current.form.getValues('municipality')).toBe(mockExpense.municipality);
      expect(result.current.expense).toBe(mockExpense);
    });

    it('should handle string dates in initial expense data', () => {
      const expenseWithStringDate = {
        ...mockExpense,
        dueDate: '2024-12-31T00:00:00.000Z' as unknown as Date,
      };

      const { result } = renderHook(() =>
        useExpenseForm({ initialExpense: expenseWithStringDate as ExpenseDTO })
      );

      const dueDate = result.current.form.getValues('dueDate');
      expect(dueDate).toBeInstanceOf(Date);
    });
  });

  describe('validation', () => {
    it('should expose validation errors through formState.errors', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Trigger validation for specific fields
      await result.current.form.trigger(['description', 'receiver', 'municipality']);

      // Check the result of trigger() - RHF validates and returns result
      const isValid = await result.current.form.trigger();
      expect(isValid).toBe(false);

      // The form should have invalid fields
      expect(result.current.form.formState.isValid).toBe(false);
    });

    it('should have no validation errors with valid data', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Reset with valid data
      result.current.form.reset(validFormData);

      const isValid = await result.current.form.trigger();

      expect(isValid).toBe(true);
      expect(Object.keys(result.current.form.formState.errors)).toHaveLength(0);
    });
  });

  describe('isDirty flag', () => {
    it('should be false on initial render', () => {
      const { result } = renderHook(() => useExpenseForm());

      expect(result.current.isDirty).toBe(false);
    });

    it('should update correctly when form values change', async () => {
      const { result } = renderHook(() => useExpenseForm());

      expect(result.current.isDirty).toBe(false);

      // Change form value
      result.current.form.setValue('description', 'New description', { shouldDirty: true });

      // Wait for isDirty to update
      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });
    });

    it('should be false again after reset', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Change form value
      result.current.form.setValue('description', 'New description', { shouldDirty: true });

      // Wait for isDirty to update
      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });

      // Reset form
      result.current.resetForm();

      // Wait for isDirty to be false
      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });
    });
  });

  describe('isSubmitting flag', () => {
    it('should be false initially', () => {
      const { result } = renderHook(() => useExpenseForm());

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should be true during API call and false after completion', async () => {
      let resolveCreate: (value: ExpenseDTO) => void;
      mockCreate.mockImplementation(() => new Promise<ExpenseDTO>((resolve) => {
        resolveCreate = resolve;
      }));

      const { result } = renderHook(() => useExpenseForm());

      // Set valid form data
      result.current.form.reset(validFormData);

      // Start submission (don't await yet)
      const submitPromise = result.current.onSubmit();

      // Wait for isSubmitting to be true
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      // Resolve the promise
      resolveCreate!(mockExpense);
      await submitPromise;

      // Wait for isSubmitting to be false
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });

  describe('create mode submission', () => {
    it('should call ExpensesApiService.create() on submit', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Set valid form data
      result.current.form.reset(validFormData);

      // Submit
      await result.current.onSubmit();

      expect(mockCreate).toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should display success toast on successful creation', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Set valid form data
      result.current.form.reset(validFormData);

      // Submit
      await result.current.onSubmit();

      expect(toast.success).toHaveBeenCalledWith('Despesa criada com sucesso');
    });

    it('should call onSuccess callback after successful creation', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useExpenseForm({ onSuccess }));

      // Set valid form data
      result.current.form.reset(validFormData);

      // Submit
      await result.current.onSubmit();

      expect(onSuccess).toHaveBeenCalledWith(mockExpense);
    });

    it('should not call API when form is invalid', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Form has invalid default values - submit without setting valid data
      await result.current.onSubmit();

      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('update mode submission', () => {
    it('should call ExpensesApiService.update() on submit when expense has id', async () => {
      const { result } = renderHook(() =>
        useExpenseForm({ initialExpense: mockExpense })
      );

      // The form already has valid data from initialExpense
      // Submit
      await result.current.onSubmit();

      expect(mockUpdate).toHaveBeenCalledWith(mockExpense.id, expect.any(Object));
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should display success toast on successful update', async () => {
      const { result } = renderHook(() =>
        useExpenseForm({ initialExpense: mockExpense })
      );

      // Submit
      await result.current.onSubmit();

      expect(toast.success).toHaveBeenCalledWith('Despesa atualizada com sucesso');
    });

    it('should call onSuccess callback after successful update', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useExpenseForm({ initialExpense: mockExpense, onSuccess })
      );

      // Submit
      await result.current.onSubmit();

      expect(onSuccess).toHaveBeenCalledWith(mockExpense);
    });
  });

  describe('error handling', () => {
    it('should display error toast on API failure', async () => {
      const errorMessage = 'Network error';
      mockCreate.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useExpenseForm());

      // Set valid form data
      result.current.form.reset(validFormData);

      // Submit
      await result.current.onSubmit();

      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    it('should display default error message when error is not an Error instance', async () => {
      mockCreate.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useExpenseForm());

      // Set valid form data
      result.current.form.reset(validFormData);

      // Submit
      await result.current.onSubmit();

      expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro ao salvar a despesa');
    });

    it('should reset isSubmitting to false on error', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useExpenseForm());

      // Set valid form data
      result.current.form.reset(validFormData);

      // Submit
      await result.current.onSubmit();

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('resetForm', () => {
    it('should reset form to default values', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Change form values
      result.current.form.setValue('description', 'Changed', { shouldDirty: true });
      result.current.form.setValue('amount', 500, { shouldDirty: true });

      // Wait for changes to apply
      await waitFor(() => {
        expect(result.current.form.getValues('description')).toBe('Changed');
      });

      // Reset
      result.current.resetForm();

      expect(result.current.form.getValues('description')).toBe('');
      expect(result.current.form.getValues('amount')).toBeUndefined();
    });

    it('should reset expense state to initialExpense when provided', async () => {
      const { result } = renderHook(() =>
        useExpenseForm({ initialExpense: mockExpense })
      );

      expect(result.current.expense).toBe(mockExpense);

      // Reset
      result.current.resetForm();

      // Wait for state update - should set expense back to initialExpense
      await waitFor(() => {
        expect(result.current.expense).toBe(mockExpense);
      });
    });

    it('should clear expense state to null when no initialExpense', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Reset with no initialExpense
      result.current.resetForm();

      // Wait for state update
      await waitFor(() => {
        expect(result.current.expense).toBeNull();
      });
    });

    it('should reset isDirty to false', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Change form value
      result.current.form.setValue('description', 'Changed', { shouldDirty: true });

      // Wait for isDirty to be true
      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });

      // Reset
      result.current.resetForm();

      // Wait for isDirty to be false
      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });
    });
  });

  describe('form methods exposure', () => {
    it('should expose all react-hook-form methods through form property', () => {
      const { result } = renderHook(() => useExpenseForm());

      expect(result.current.form.register).toBeDefined();
      expect(result.current.form.handleSubmit).toBeDefined();
      expect(result.current.form.control).toBeDefined();
      expect(result.current.form.formState).toBeDefined();
      expect(result.current.form.reset).toBeDefined();
      expect(result.current.form.setValue).toBeDefined();
      expect(result.current.form.getValues).toBeDefined();
      expect(result.current.form.trigger).toBeDefined();
      expect(result.current.form.watch).toBeDefined();
    });
  });

  describe('form submission with validation errors', () => {
    it('should not submit form with validation errors', async () => {
      const { result } = renderHook(() => useExpenseForm());

      // Don't set any values - form will be invalid
      await result.current.onSubmit();

      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });
  });
});
