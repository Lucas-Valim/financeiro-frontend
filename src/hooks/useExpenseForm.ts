import { useCallback, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  expenseFormSchema,
  type ExpenseFormData,
  defaultExpenseFormValues,
} from '../schemas/expense-form-schema';
import { ExpensesApiService } from '../api/expenses-api';
import { ORGANIZATION_ID } from '../constants/expenses';
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
  existingServiceInvoiceUrl: string | null;
  existingBankBillUrl: string | null;
  handleClearServiceInvoice: () => void;
  handleClearBankBill: () => void;
}

const expensesApiService = new ExpensesApiService();

export function useExpenseForm({
  initialExpense = null,
  onSuccess,
}: UseExpenseFormParams = {}): UseExpenseFormReturn {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expense, setExpense] = useState<ExpenseDTO | null>(initialExpense);

  // Track existing file URLs separately from new file uploads
  const [existingServiceInvoiceUrl, setExistingServiceInvoiceUrl] = useState<string | null>(
    initialExpense?.serviceInvoiceUrl ?? null
  );
  const [existingBankBillUrl, setExistingBankBillUrl] = useState<string | null>(
    initialExpense?.bankBillUrl ?? null
  );

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
        favorecidoId: initialExpense.favorecidoId ?? '',
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
        organizationId: ORGANIZATION_ID,
        description: formData.description,
        amount: formData.amount,
        currency: formData.currency,
        dueDate: formData.dueDate,
        favorecidoId: formData.favorecidoId,
        municipality: formData.municipality,
        paymentMethod: formData.paymentMethod ?? undefined,
        categoryId: formData.categoryId ?? null,
        serviceInvoice: formData.serviceInvoice ?? null,
        bankBill: formData.bankBill ?? null,
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

      // As três invalidações são necessárias: `['expenses']` casa por prefixo
      // com a lista (`['expenses', filters]`) e com o calendário
      // (`['expenses', 'calendar', ...]`), mas os cards de status leem
      // `['expenses-summary', ...]` e os totais do relatório leem
      // `['expense-report-summary', ...]` — outras raízes. Editar o valor é uma
      // das duas vias de confirmação (PRD §4/ADR-006): sem elas a sublinha de
      // estimado dos cards e os totais do relatório ficariam velhos logo após a
      // confirmação implícita.
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report-summary'] });

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
  }, [form, expense?.id, reset, onSuccess, queryClient]);

  const resetForm = useCallback(() => {
    reset(getInitialValues() as ExpenseFormData);
    setExpense(initialExpense);
    setExistingServiceInvoiceUrl(initialExpense?.serviceInvoiceUrl ?? null);
    setExistingBankBillUrl(initialExpense?.bankBillUrl ?? null);
  }, [reset, getInitialValues, initialExpense]);

  // Handlers to clear existing URLs
  const handleClearServiceInvoice = useCallback(() => {
    setExistingServiceInvoiceUrl(null);
  }, []);

  const handleClearBankBill = useCallback(() => {
    setExistingBankBillUrl(null);
  }, []);

  return {
    form: form as unknown as UseFormReturn<ExpenseFormData>,
    isDirty,
    isSubmitting,
    onSubmit,
    resetForm,
    expense,
    existingServiceInvoiceUrl,
    existingBankBillUrl,
    handleClearServiceInvoice,
    handleClearBankBill,
  };
}
