import { useCallback, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  recurringExpenseFormSchema,
  defaultRecurringExpenseFormValues,
  toCreateInput,
  toUpdateInput,
  type RecurringExpenseFormData,
} from '../schemas/recurring-expense-form-schema';
import { recurringExpensesApiService } from '../api/recurring-expenses-api';
import type {
  RecurringExpenseDTO,
  GeneratedOccurrenceDTO,
} from '../types/recurring-expenses';

interface UseRecurringExpenseFormParams {
  initialRecurringExpense?: RecurringExpenseDTO | null;
  onSuccess?: (recurringExpense: RecurringExpenseDTO) => void;
}

interface UseRecurringExpenseFormReturn {
  form: UseFormReturn<RecurringExpenseFormData>;
  isDirty: boolean;
  isSubmitting: boolean;
  isEditMode: boolean;
  onSubmit: () => Promise<void>;
  resetForm: () => void;
  recurringExpense: RecurringExpenseDTO | null;
  /** Ocorrências materializadas na criação, exibidas antes de fechar o modal. */
  generatedOccurrences: GeneratedOccurrenceDTO[];
  /** Recorrências parecidas devolvidas pelo `duplicate-check` (só na criação). */
  duplicates: RecurringExpenseDTO[];
  isDuplicateDialogOpen: boolean;
  /** Prossegue com o `POST` original após o usuário confirmar a duplicidade. */
  confirmDuplicate: () => Promise<void>;
  /** Fecha o aviso mantendo o formulário preenchido, sem criar. */
  cancelDuplicate: () => void;
}

/**
 * Hook de formulário de recorrência, no formato de `useExpenseForm`: cobre criação
 * e edição, detectando o modo pela presença da recorrência inicial.
 *
 * Duas particularidades em relação a `useExpenseForm`:
 *
 *  - `duplicate-check` é chamado APENAS no caminho de criação, antes do `POST`.
 *    Na edição o usuário já sabe qual recorrência está mexendo — avisar ali
 *    transformaria um reajuste de valor numa pergunta sobre um registro que ele
 *    não está criando. Havendo duplicatas, o `POST` não dispara até a confirmação.
 *  - O escopo de invalidação difere por mutação (ADR-006): criar materializa
 *    ocorrências, então invalida `recurring-expenses` + as três raízes de despesa;
 *    editar vale só para ocorrências futuras, então invalida apenas
 *    `recurring-expenses`.
 */
export function useRecurringExpenseForm({
  initialRecurringExpense = null,
  onSuccess,
}: UseRecurringExpenseFormParams = {}): UseRecurringExpenseFormReturn {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurringExpense, setRecurringExpense] = useState<RecurringExpenseDTO | null>(
    initialRecurringExpense
  );
  const [generatedOccurrences, setGeneratedOccurrences] = useState<
    GeneratedOccurrenceDTO[]
  >([]);
  const [duplicates, setDuplicates] = useState<RecurringExpenseDTO[]>([]);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);

  const isEditMode = !!recurringExpense?.id;

  const getInitialValues = useCallback((): Partial<RecurringExpenseFormData> => {
    if (initialRecurringExpense) {
      return {
        description: initialRecurringExpense.description,
        favorecidoId: initialRecurringExpense.favorecidoId,
        categoryId: initialRecurringExpense.categoryId,
        amountType: initialRecurringExpense.amountType,
        amount: initialRecurringExpense.amount,
        paymentMethod: initialRecurringExpense.paymentMethod,
        municipality: initialRecurringExpense.municipality,
        dueDay: initialRecurringExpense.dueDay,
        startDate:
          initialRecurringExpense.startDate instanceof Date
            ? initialRecurringExpense.startDate
            : new Date(initialRecurringExpense.startDate),
        endDate: initialRecurringExpense.endDate
          ? initialRecurringExpense.endDate instanceof Date
            ? initialRecurringExpense.endDate
            : new Date(initialRecurringExpense.endDate)
          : null,
      };
    }
    return defaultRecurringExpenseFormValues;
  }, [initialRecurringExpense]);

  const form = useForm<RecurringExpenseFormData>({
    // @ts-expect-error - Zod v4 resolver type inference issue with react-hook-form
    resolver: zodResolver(recurringExpenseFormSchema),
    defaultValues: getInitialValues() as RecurringExpenseFormData,
    mode: 'onChange',
  });

  const { formState, reset } = form;
  const isDirty = formState.isDirty;

  const persist = useCallback(
    async (formData: RecurringExpenseFormData) => {
      setIsSubmitting(true);
      try {
        if (recurringExpense?.id) {
          // Edição: apenas `recurring-expenses`. Editar vale para as próximas
          // ocorrências, não para as já geradas — invalidar as raízes de despesa
          // seria trabalho desperdiçado (ADR-006). `amountType`/`startDate` não
          // entram no payload por construção de `toUpdateInput`.
          const updated = await recurringExpensesApiService.update(
            recurringExpense.id,
            toUpdateInput(formData)
          );
          queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
          toast.success('Recorrência atualizada com sucesso');
          setRecurringExpense(updated);
          reset(formData);
          onSuccess?.(updated);
        } else {
          // Criação: materializa ocorrências imediatamente, então invalida as
          // quatro raízes — `recurring-expenses` mais as três de despesa, que os
          // cards e o relatório leem por raízes que o prefixo não alcança (ADR-006).
          const created = await recurringExpensesApiService.create(
            toCreateInput(formData)
          );
          queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
          queryClient.invalidateQueries({ queryKey: ['expense-report-summary'] });
          toast.success('Recorrência criada com sucesso');
          setRecurringExpense(created.recurrence);
          setGeneratedOccurrences(created.generatedOccurrences);
          reset(formData);
          onSuccess?.(created.recurrence);
        }
      } catch (error) {
        // Erros de recorrência já nascem em português no backend (o interceptor de
        // `api-client.ts` extrai `error.message` do corpo). Um 409 de recorrência
        // encerrada é exibido como veio, sem tradutor — ver TechSpec (Tradução de
        // erros). O genérico entra só quando a mensagem vem vazia (erro de rede).
        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : 'Ocorreu um erro ao salvar a recorrência';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [recurringExpense?.id, reset, onSuccess, queryClient]
  );

  const onSubmit = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const formData = form.getValues();

    // Na edição não há `duplicate-check`: o usuário já sabe qual recorrência edita.
    if (recurringExpense?.id) {
      await persist(formData);
      return;
    }

    // Criação: checa duplicatas ANTES do `POST`.
    setIsSubmitting(true);
    let found: RecurringExpenseDTO[];
    try {
      const result = await recurringExpensesApiService.checkDuplicates({
        favorecidoId: formData.favorecidoId,
        amount: formData.amount,
        dueDay: formData.dueDay,
      });
      found = result.duplicates;
    } catch {
      // O aviso de duplicidade nunca bloqueia; uma falha de rede no `duplicate-check`
      // não deve impedir o cadastro. Segue como se não houvesse correspondências.
      found = [];
    }

    if (found.length > 0) {
      // Abre o aviso e ESPERA a decisão do usuário — o `POST` não dispara.
      setIsSubmitting(false);
      setDuplicates(found);
      setIsDuplicateDialogOpen(true);
      return;
    }

    // `persist` reassume o controle de `isSubmitting` (já em `true`) até o fim.
    await persist(formData);
  }, [form, recurringExpense?.id, persist]);

  const confirmDuplicate = useCallback(async () => {
    setIsDuplicateDialogOpen(false);
    setDuplicates([]);
    await persist(form.getValues());
  }, [form, persist]);

  const cancelDuplicate = useCallback(() => {
    setIsDuplicateDialogOpen(false);
    setDuplicates([]);
  }, []);

  const resetForm = useCallback(() => {
    reset(getInitialValues() as RecurringExpenseFormData);
    setRecurringExpense(initialRecurringExpense);
    setGeneratedOccurrences([]);
    setDuplicates([]);
    setIsDuplicateDialogOpen(false);
  }, [reset, getInitialValues, initialRecurringExpense]);

  return {
    form: form as unknown as UseFormReturn<RecurringExpenseFormData>,
    isDirty,
    isSubmitting,
    isEditMode,
    onSubmit,
    resetForm,
    recurringExpense,
    generatedOccurrences,
    duplicates,
    isDuplicateDialogOpen,
    confirmDuplicate,
    cancelDuplicate,
  };
}
