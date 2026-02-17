import { useFormContext } from 'react-hook-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { CalendarIcon } from 'lucide-react';
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
import type { ExpenseFormData } from '@/schemas/expense-form-schema';
import 'react-datepicker/dist/react-datepicker.css';

// Register Portuguese locale for date picker
registerLocale('pt-BR', ptBR);

// Format currency to BRL format
function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Parse currency string to number
function parseCurrencyToNumber(value: string): number | undefined {
  if (!value) return undefined;

  // Remove currency symbol, spaces, and thousand separators
  const cleanValue = value
    .replace(/[R$\s.]/g, '')
    .replace(',', '.');

  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? undefined : parsed;
}

// Apply currency mask during input
function applyCurrencyMask(value: string): string {
  // Remove all non-numeric characters except comma and dot
  const numbers = value.replace(/[^\d]/g, '');

  if (!numbers) return '';

  // Convert to number (treating last two digits as decimal)
  const intValue = parseInt(numbers, 10);
  const floatValue = intValue / 100;

  return formatCurrency(floatValue);
}

// Sample categories - in a real app, these would come from an API
const CATEGORY_OPTIONS = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'services', label: 'Serviços' },
  { value: 'utilities', label: 'Utilidades' },
  { value: 'rent', label: 'Aluguel' },
  { value: 'salaries', label: 'Salários' },
  { value: 'other', label: 'Outros' },
] as const;

// Sample receivers - in a real app, these would come from an API
const RECEIVER_OPTIONS = [
  { value: 'google', label: 'Google' },
  { value: 'microsoft', label: 'Microsoft' },
  { value: 'aws', label: 'Amazon Web Services' },
  { value: 'azure', label: 'Azure' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'slack', label: 'Slack' },
  { value: 'notion', label: 'Notion' },
  { value: 'figma', label: 'Figma' },
  { value: 'other', label: 'Outro' },
] as const;

interface ExpenseFormFieldsProps {
  disabled?: boolean;
}

export function ExpenseFormFields({ disabled = false }: ExpenseFormFieldsProps) {
  const form = useFormContext<ExpenseFormData>();

  return (
    <div className="space-y-4">
      {/* Description Field */}
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

      {/* Amount Field */}
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

      {/* Due Date Field */}
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

      {/* Category Field */}
      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <Select
              disabled={disabled}
              onValueChange={field.onChange}
              value={field.value ?? undefined}
            >
              <FormControl>
                <SelectTrigger aria-describedby="categoryId-error">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage id="categoryId-error" />
          </FormItem>
        )}
      />

      {/* Receiver Field */}
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

      {/* Municipality Field */}
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

      {/* Payment Method Field */}
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

      {/* Service Invoice Field */}
      <FormField
        control={form.control}
        name="serviceInvoice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nota de Serviço</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                placeholder="Digite o número da nota de serviço"
                disabled={disabled}
                aria-describedby="serviceInvoice-error"
              />
            </FormControl>
            <FormMessage id="serviceInvoice-error" />
          </FormItem>
        )}
      />
    </div>
  );
}
