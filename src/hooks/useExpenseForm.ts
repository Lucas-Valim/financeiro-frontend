import { useCallback, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  expenseFormSchema,
  type ExpenseFormData,
  defaultExpenseFormValues,
} from '../schemas/expense-form-schema';
import { ExpensesApiService } from '../api/expenses-api';
import type { ExpenseDTO, CreateExpenseInput } from '../types/expenses';

interface UseExpenseFormParams {
  initialExpense?: ExpenseDTO | null;
  onSuccess?: (expense: ExpenseDTO) => void;
}

interface UseExpenseFormReturn {
  form: UseFormReturn<ExpenseFormData>;
  isDirty: boolean;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  resetForm: () => void;
  expense: ExpenseDTO | null;
}

const expensesApiService = new ExpensesApiService();

export function useExpenseForm({
  initialExpense = null,
  onSuccess,
}: UseExpenseFormParams = {}): UseExpenseFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expense, setExpense] = useState<ExpenseDTO | null>(initialExpense);

  const getInitialValues = useCallback((): Partial<ExpenseFormData> => {
    if (initialExpense) {
      return {
        description: initialExpense.description,
        amount: initialExpense.amount,
        currency: initialExpense.currency,
        dueDate: initialExpense.dueDate instanceof Date
          ? initialExpense.dueDate
          : new Date(initialExpense.dueDate),
        status: initialExpense.status,
        categoryId: initialExpense.categoryId,
        paymentMethod: initialExpense.paymentMethod,
        receiver: initialExpense.receiver,
        municipality: initialExpense.municipality,
        serviceInvoice: null,
        bankBill: null,
      };
    }
    return defaultExpenseFormValues;
  }, [initialExpense]);

  const form = useForm<ExpenseFormData>({
    // @ts-expect-error - Zod v4 resolver type inference issue with react-hook-form
    resolver: zodResolver(expenseFormSchema),
    defaultValues: getInitialValues() as ExpenseFormData,
    mode: 'onChange',
  });

  const { formState, reset } = form;
  const isDirty = formState.isDirty;

  const onSubmit = useCallback(async () => {
    const formData = form.getValues();

    // Validate the form before submission
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result: ExpenseDTO;

      const submitData: CreateExpenseInput = {
        organizationId: 'fca3c088-ba34-43a2-9b32-b2b1a1246915', // This will be set by the API service
        description: formData.description,
        amount: formData.amount,
        currency: formData.currency,
        dueDate: formData.dueDate,
        receiver: formData.receiver,
        municipality: formData.municipality,
        paymentMethod: formData.paymentMethod ?? undefined,
      };

      if (expense?.id) {
        // Update existing expense
        result = await expensesApiService.update(expense.id, submitData);
        toast.success('Despesa atualizada com sucesso');
      } else {
        // Create new expense
        result = await expensesApiService.create(submitData);
        toast.success('Despesa criada com sucesso');
      }

      setExpense(result);
      reset(formData);
      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Ocorreu um erro ao salvar a despesa';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, expense?.id, reset, onSuccess]);

  const resetForm = useCallback(() => {
    reset(getInitialValues() as ExpenseFormData);
    setExpense(initialExpense);
  }, [reset, getInitialValues, initialExpense]);

  return {
    form: form as unknown as UseFormReturn<ExpenseFormData>,
    isDirty,
    isSubmitting,
    onSubmit,
    resetForm,
    expense,
  };
}
