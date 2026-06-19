import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { favorecidosApiService } from '../api/favorecidos-api';
import { LINKED_EXPENSES_ERROR_MESSAGE } from '../constants/favorecidos';

interface DeleteFavorecidoVariables {
  id: string;
  organizationId: string;
}

export function useDeleteFavorecido(): UseMutationResult<void, Error, DeleteFavorecidoVariables, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, organizationId }: DeleteFavorecidoVariables) =>
      favorecidosApiService.delete(id, organizationId),
    onSuccess: (_data, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorecidos', organizationId] });
    },
    onError: (error: Error) => {
      if (error.message !== LINKED_EXPENSES_ERROR_MESSAGE) {
        toast.error(error.message || 'Ocorreu um erro ao excluir o favorecido');
      }
    },
  });
}
