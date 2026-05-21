import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { categoriesApiService } from '../api/categories-api';
import { LINKED_EXPENSES_ERROR_MESSAGE } from '../constants/categories';

interface DeleteCategoryVariables {
  id: string;
  organizationId: string;
}

export function useDeleteCategory(): UseMutationResult<void, Error, DeleteCategoryVariables, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, organizationId }: DeleteCategoryVariables) =>
      categoriesApiService.delete(id, organizationId),
    onSuccess: (_data, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: ['categories', organizationId] });
    },
    onError: (error: Error) => {
      if (error.message !== LINKED_EXPENSES_ERROR_MESSAGE) {
        toast.error(error.message || 'Ocorreu um erro ao excluir a categoria');
      }
    },
  });
}
