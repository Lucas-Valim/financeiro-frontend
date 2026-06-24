import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { CalendarIcon, Loader2 } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDocument } from '@/lib/format-document';
import { useCategories } from '@/hooks/use-categories';
import { useFavorecidos } from '@/hooks/use-favorecidos';
import { Combobox } from '@/components/ui/combobox';
import { FavorecidoFormModal } from '@/components/favorecidos/FavorecidoFormModal';
import type { FavorecidoDTO } from '@/types/favorecidos';
import type { ExpenseFormData } from '@/schemas/expense-form-schema';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function parseCurrencyToNumber(value: string): number | undefined {
  if (!value) return undefined;
  const cleanValue = value
    .replace(/[R$\s.]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? undefined : parsed;
}

function applyCurrencyMask(value: string): string {
  const numbers = value.replace(/[^\d]/g, '');
  if (!numbers) return '';
  const intValue = parseInt(numbers, 10);
  const floatValue = intValue / 100;
  return formatCurrency(floatValue);
}

const MUNICIPALITY_OPTIONS = [
  { value: 'Bento Gonçalves', label: 'Bento Gonçalves' },
  { value: 'Caxias do Sul', label: 'Caxias do Sul' },
  { value: 'Passo Fundo', label: 'Passo Fundo' },
  { value: 'Porto Alegre', label: 'Porto Alegre' },
] as const;

const PAYMENT_METHOD_OPTIONS = [
  { value: 'Boleto', label: 'Boleto' },
  { value: 'PIX', label: 'PIX' },
  { value: 'Transferência', label: 'Transferência' },
  { value: 'Guia', label: 'Guia' },
] as const;

interface ExpenseFormFieldsProps {
  disabled?: boolean;
  organizationId: string;
}

export function ExpenseFormFields({ disabled = false, organizationId }: ExpenseFormFieldsProps) {
  const form = useFormContext<ExpenseFormData>();
  const { categories, isLoading: isLoadingCategories } = useCategories(organizationId);
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
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Descrição</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Digite a descrição da despesa"
                disabled={disabled}
                aria-describedby="description-error"
              />
            </FormControl>
            <FormMessage id="description-error" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Valor</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="text"
                inputMode="decimal"
                placeholder="R$ 0,00"
                disabled={disabled}
                aria-describedby="amount-error"
                value={field.value !== undefined ? formatCurrency(field.value) : ''}
                onChange={(e) => {
                  const maskedValue = applyCurrencyMask(e.target.value);
                  const numericValue = parseCurrencyToNumber(maskedValue);
                  field.onChange(numericValue);
                }}
                onBlur={field.onBlur}
              />
            </FormControl>
            <FormMessage id="amount-error" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="dueDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Data de Vencimento</FormLabel>
            <FormControl>
              <ReactDatePicker
                selected={field.value}
                onChange={(date: Date | null) => field.onChange(date)}
                onBlur={field.onBlur}
                disabled={disabled}
                locale="pt-BR"
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecione a data"
                className={cn(
                  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                  form.formState.errors.dueDate && 'border-destructive'
                )}
                wrapperClassName="w-full"
                customInput={
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground',
                      form.formState.errors.dueDate && 'border-destructive'
                    )}
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecione a data'}
                  </Button>
                }
              />
            </FormControl>
            <FormMessage id="dueDate-error" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <Select
              disabled={disabled || isLoadingCategories}
              onValueChange={field.onChange}
              value={field.value ?? undefined}
            >
              <FormControl>
                <SelectTrigger aria-describedby="categoryId-error">
                  <SelectValue placeholder={isLoadingCategories ? "Carregando..." : "Selecione uma categoria"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {isLoadingCategories ? (
                  <SelectItem value="__loading" disabled>
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando categorias...
                    </span>
                  </SelectItem>
                ) : categories.length === 0 ? (
                  <SelectItem value="__empty" disabled>Nenhuma categoria disponível</SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormMessage id="categoryId-error" />
          </FormItem>
        )}
      />

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

      <FormField
        control={form.control}
        name="municipality"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Município</FormLabel>
            <Select
              disabled={disabled}
              onValueChange={field.onChange}
              value={field.value ?? ''}
            >
              <FormControl>
                <SelectTrigger aria-describedby="municipality-error">
                  <SelectValue placeholder="Selecione um município" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {MUNICIPALITY_OPTIONS.map((municipality) => (
                  <SelectItem key={municipality.value} value={municipality.value}>
                    {municipality.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage id="municipality-error" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Forma de Pagamento</FormLabel>
            <Select
              disabled={disabled}
              onValueChange={field.onChange}
              value={field.value ?? ''}
            >
              <FormControl>
                <SelectTrigger aria-describedby="paymentMethod-error">
                  <SelectValue placeholder="Selecione uma forma de pagamento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage id="paymentMethod-error" />
          </FormItem>
        )}
      />
    </div>
  );
}
