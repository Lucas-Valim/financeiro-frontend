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
import {
  formatCurrencyInput,
  parseCurrencyToNumber,
  applyCurrencyMask,
} from '@/lib/currency-mask';
import { useCategories } from '@/hooks/use-categories';
import { PAYMENT_METHODS, MUNICIPALITY_OPTIONS } from '@/constants/expenses';
import { FavorecidoField } from '@/components/favorecidos/FavorecidoField';
import type { ExpenseFormData } from '@/schemas/expense-form-schema';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

interface ExpenseFormFieldsProps {
  disabled?: boolean;
  organizationId: string;
}

export function ExpenseFormFields({ disabled = false, organizationId }: ExpenseFormFieldsProps) {
  const form = useFormContext<ExpenseFormData>();
  const { categories, isLoading: isLoadingCategories } = useCategories(organizationId);

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
                value={field.value !== undefined ? formatCurrencyInput(field.value) : ''}
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

      <FavorecidoField organizationId={organizationId} disabled={disabled} />

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
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
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
