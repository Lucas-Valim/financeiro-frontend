import { useCallback, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  categoryFormSchema,
  defaultCategoryFormValues,
} from '../schemas/category-form-schema';
import type { CategoryFormData } from '../schemas/category-form-schema';
import { categoriesApiService } from '../api/categories-api';
import type { CategoryDTO } from '../types/categories';
import { ORGANIZATION_ID } from '../constants/expenses';

interface UseCategoryFormParams {
  category?: CategoryDTO | null;
  organizationId: string;
  onSuccess?: () => void;
}

interface UseCategoryFormReturn {
  form: UseFormReturn<CategoryFormData>;
  isDirty: boolean;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  resetForm: () => void;
}

export function useCategoryForm({
  category = null,
  organizationId = ORGANIZATION_ID,
  onSuccess,
}: UseCategoryFormParams): UseCategoryFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const getInitialValues = useCallback((): CategoryFormData => {
    if (category) {
      return {
        name: category.name,
        description: category.description ?? '',
      };
    }
    return defaultCategoryFormValues;
  }, [category]);

  const form = useForm<CategoryFormData>({
    // @ts-expect-error - Zod v4 resolver type inference issue with react-hook-form.
    // Tracking: https://github.com/react-hook-form/resolvers/issues (search "zod v4").
    // Revisit when @hookform/resolvers ships native Zod v4 support.
    resolver: zodResolver(categoryFormSchema),
    defaultValues: getInitialValues(),
    mode: 'onChange',
  });

  const { formState, reset } = form;
  const isDirty = formState.isDirty;

  const onSubmit = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const formData = form.getValues();
    setIsSubmitting(true);

    try {
      if (category?.id) {
        await categoriesApiService.update({
          id: category.id,
          organizationId,
          name: formData.name,
          description: formData.description || null,
        });
        toast.success('Categoria atualizada com sucesso');
      } else {
        await categoriesApiService.create({
          organizationId,
          name: formData.name,
          description: formData.description || null,
        });
        toast.success('Categoria criada com sucesso');
      }

      await queryClient.invalidateQueries({ queryKey: ['categories', organizationId] });
      reset(formData);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Ocorreu um erro ao salvar a categoria';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, category?.id, organizationId, queryClient, reset, onSuccess]);

  const resetForm = useCallback(() => {
    reset(getInitialValues());
  }, [reset, getInitialValues]);

  return {
    form: form as unknown as UseFormReturn<CategoryFormData>,
    isDirty,
    isSubmitting,
    onSubmit,
    resetForm,
  };
}
