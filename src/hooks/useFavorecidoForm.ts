import { useCallback, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  favorecidoFormSchema,
  defaultFavorecidoFormValues,
} from '../schemas/favorecido-form-schema';
import type { FavorecidoFormData } from '../schemas/favorecido-form-schema';
import { favorecidosApiService } from '../api/favorecidos-api';
import type { FavorecidoDTO } from '../types/favorecidos';
import { ORGANIZATION_ID } from '../constants/expenses';

interface UseFavorecidoFormParams {
  favorecido?: FavorecidoDTO | null;
  organizationId?: string;
  onSuccess?: (created: FavorecidoDTO) => void;
}

interface UseFavorecidoFormReturn {
  form: UseFormReturn<FavorecidoFormData>;
  isDirty: boolean;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  resetForm: () => void;
}

export function useFavorecidoForm({
  favorecido = null,
  organizationId = ORGANIZATION_ID,
  onSuccess,
}: UseFavorecidoFormParams): UseFavorecidoFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const getInitialValues = useCallback((): FavorecidoFormData => {
    if (favorecido) {
      return {
        name: favorecido.name,
        document: favorecido.document,
        zipCode: favorecido.zipCode ?? '',
        street: favorecido.street ?? '',
        number: favorecido.number ?? '',
        city: favorecido.city ?? '',
        state: favorecido.state ?? '',
        phone: favorecido.phone ?? '',
        email: favorecido.email ?? '',
      };
    }
    return defaultFavorecidoFormValues;
  }, [favorecido]);

  const form = useForm<FavorecidoFormData>({
    // @ts-expect-error - Zod v4 resolver type inference issue with react-hook-form.
    resolver: zodResolver(favorecidoFormSchema),
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
      if (favorecido?.id) {
        const result = await favorecidosApiService.update({
          id: favorecido.id,
          organizationId,
          name: formData.name,
          document: formData.document,
          zipCode: formData.zipCode || null,
          street: formData.street || null,
          number: formData.number || null,
          city: formData.city || null,
          state: formData.state || null,
          phone: formData.phone || null,
          email: formData.email || null,
        });
        toast.success('Favorecido atualizado com sucesso');
        await queryClient.invalidateQueries({ queryKey: ['favorecidos', organizationId] });
        reset(formData);
        onSuccess?.(result);
      } else {
        const result = await favorecidosApiService.create({
          organizationId,
          name: formData.name,
          document: formData.document,
          zipCode: formData.zipCode || null,
          street: formData.street || null,
          number: formData.number || null,
          city: formData.city || null,
          state: formData.state || null,
          phone: formData.phone || null,
          email: formData.email || null,
        });
        toast.success('Favorecido criado com sucesso');
        await queryClient.invalidateQueries({ queryKey: ['favorecidos', organizationId] });
        reset(formData);
        onSuccess?.(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      const normalizedMessage = errorMessage.toLowerCase();
      const isDuplicateOrInvalid = normalizedMessage.includes('já cadastrado') ||
        normalizedMessage.includes('já existe') ||
        normalizedMessage.includes('inválido') ||
        normalizedMessage.includes('documento');

      if (isDuplicateOrInvalid) {
        form.setError('document', { message: errorMessage });
      } else {
        toast.error(errorMessage || 'Ocorreu um erro ao salvar o favorecido');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [form, favorecido?.id, organizationId, queryClient, reset, onSuccess]);

  const resetForm = useCallback(() => {
    reset(getInitialValues());
  }, [reset, getInitialValues]);

  return {
    form: form as unknown as UseFormReturn<FavorecidoFormData>,
    isDirty,
    isSubmitting,
    onSubmit,
    resetForm,
  };
}
