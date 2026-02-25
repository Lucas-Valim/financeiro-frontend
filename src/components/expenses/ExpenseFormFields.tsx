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
import { useCategories } from '@/hooks/use-categories';
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

const RECEIVER_OPTIONS = [
  { value: 'Advento Aprendizagem', label: 'Advento Aprendizagem' },
  { value: 'Maria Cristina Tudium', label: 'Maria Cristina Tudium' },
  { value: 'GFarias', label: 'GFarias' },
  { value: 'Mundi Desenvolvimento Humano', label: 'Mundi Desenvolvimento Humano' },
  { value: 'Jaime Prux', label: 'Jaime Prux' },
  { value: 'Mecanica Lorange', label: 'Mecanica Lorange' },
  { value: 'Unimed', label: 'Unimed' },
  { value: 'Pompeia Parking', label: 'Pompeia Parking' },
] as const;

interface ExpenseFormFieldsProps {
  disabled?: boolean;
  organizationId: string;
}

export function ExpenseFormFields({ disabled = false, organizationId }: ExpenseFormFieldsProps) {
  const form = useFormContext<ExpenseFormData>();
  const { categories, isLoading } = useCategories(organizationId);

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
              disabled={disabled || isLoading}
              onValueChange={field.onChange}
              value={field.value ?? undefined}
            >
              <FormControl>
                <SelectTrigger aria-describedby="categoryId-error">
                  <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione uma categoria"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {isLoading ? (
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
        name="receiver"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Favorecido</FormLabel>
            <Select
              disabled={disabled}
              onValueChange={field.onChange}
              value={field.value ?? ''}
            >
              <FormControl>
                <SelectTrigger aria-describedby="receiver-error">
                  <SelectValue placeholder="Selecione um favorecido" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {RECEIVER_OPTIONS.map((receiver) => (
                  <SelectItem key={receiver.value} value={receiver.value}>
                    {receiver.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage id="receiver-error" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="municipality"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Município</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Digite o município"
                disabled={disabled}
                aria-describedby="municipality-error"
              />
            </FormControl>
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
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                placeholder="Ex: Boleto, PIX, Transferência"
                disabled={disabled}
                aria-describedby="paymentMethod-error"
              />
            </FormControl>
            <FormMessage id="paymentMethod-error" />
          </FormItem>
        )}
      />
    </div>
  );
}
