import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Combobox } from '@/components/ui/combobox';
import { formatDocument } from '@/lib/format-document';
import { useFavorecidos } from '@/hooks/use-favorecidos';
import { FavorecidoFormModal } from '@/components/favorecidos/FavorecidoFormModal';
import type { FavorecidoDTO } from '@/types/favorecidos';

/**
 * Forma mínima que o formulário hospedeiro precisa ter. Tanto `ExpenseFormData`
 * quanto `RecurringExpenseFormData` a satisfazem.
 */
type FavorecidoFormShape = { favorecidoId: string };

export interface FavorecidoFieldProps {
  organizationId: string;
  disabled?: boolean;
}

/**
 * Campo de seleção de favorecido, compartilhado pelos formulários de despesa e de
 * recorrência.
 *
 * O componente é dono de tudo que o campo precisa — a query de `useFavorecidos`, o
 * mapeamento para opções do `Combobox`, o estado do modal de cadastro rápido e o
 * `FavorecidoFormModal` irmão — de modo que o formulário hospedeiro só o posicione
 * onde quiser. É o que permite compartilhar sem impor ordem de campos, restrição
 * que o ADR-005 rejeitou ao descartar um `SharedExpenseFields`.
 *
 * O reuso da query importa além da conveniência: os dois formulários leem a mesma
 * chave de cache, então um favorecido cadastrado por aqui aparece imediatamente no
 * outro formulário e na coluna de favorecido da listagem de recorrências.
 */
export function FavorecidoField({ organizationId, disabled = false }: FavorecidoFieldProps) {
  const form = useFormContext<FavorecidoFormShape>();
  const { favorecidos, isLoading: isLoadingFavorecidos } = useFavorecidos(organizationId);
  const [isCreateFavorecidoOpen, setIsCreateFavorecidoOpen] = useState(false);

  const favorecidoOptions = favorecidos.map((f: FavorecidoDTO) => ({
    value: f.id,
    label: f.name,
    description: f.document ? formatDocument(f.document) : undefined,
  }));

  const handleFavorecidoCreated = useCallback(
    (created: FavorecidoDTO) => {
      form.setValue('favorecidoId', created.id, { shouldDirty: true });
      setIsCreateFavorecidoOpen(false);
    },
    [form],
  );

  return (
    <>
      <FormField
        control={form.control}
        name="favorecidoId"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Favorecido</FormLabel>
            <FormControl>
              <Combobox
                options={favorecidoOptions}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                placeholder="Selecione um favorecido"
                searchPlaceholder="Buscar por nome ou documento..."
                emptyMessage="Nenhum favorecido encontrado."
                disabled={disabled}
                isLoading={isLoadingFavorecidos}
                onCreateNew={() => setIsCreateFavorecidoOpen(true)}
                createNewLabel="Cadastrar novo favorecido"
                aria-describedby="favorecidoId-error"
              />
            </FormControl>
            <FormMessage id="favorecidoId-error" />
          </FormItem>
        )}
      />

      <FavorecidoFormModal
        isOpen={isCreateFavorecidoOpen}
        onClose={() => setIsCreateFavorecidoOpen(false)}
        onSuccess={handleFavorecidoCreated}
      />
    </>
  );
}
