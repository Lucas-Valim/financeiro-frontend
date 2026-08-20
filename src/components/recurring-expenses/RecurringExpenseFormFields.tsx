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
  FormDescription,
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
import { RECURRENCE_AMOUNT_TYPE_LABELS } from '@/constants/recurring-expenses';
import { FavorecidoField } from '@/components/favorecidos/FavorecidoField';
import type { RecurringExpenseFormData } from '@/schemas/recurring-expense-form-schema';
import 'react-datepicker/dist/react-datepicker.css';

// Convenção do repositório: `registerLocale` em escopo de módulo, junto do import
// do CSS do `react-datepicker`, como em `ExpenseFormFields` e `PaymentFormFields`.
registerLocale('pt-BR', ptBR);

// O rótulo e o texto de ajuda do campo de valor mudam com o tipo de valor: é a
// troca de rótulo que comunica a diferença entre valor definitivo e sugestão da
// primeira ocorrência, sem exigir treinamento (ADR-005, requisito 3).
const AMOUNT_COPY: Record<
  RecurringExpenseFormData['amountType'],
  { label: string; description: string }
> = {
  FIXED: {
    label: 'Valor da despesa',
    description: 'Valor definitivo de cada ocorrência da série.',
  },
  VARIABLE: {
    label: 'Valor de referência',
    description: 'Sugestão da primeira ocorrência; cada mês pode ser confirmado com um valor diferente.',
  },
};

interface RecurringExpenseFormFieldsProps {
  disabled?: boolean;
  organizationId: string;
  /**
   * No modo de edição, `amountType` e `startDate` renderizam somente-leitura: o
   * `PUT` não os aceita (são imutáveis depois da criação da série). Ver ADR-005.
   */
  isEditMode?: boolean;
}

/**
 * Campos do formulário de recorrência. Componente próprio (ADR-005), compondo as
 * mesmas primitivas e as MESMAS fontes de dados do formulário de despesa —
 * `useFavorecidos`/`useCategories` por `organizationId`, `Combobox` de favorecido,
 * `Select` de `PAYMENT_METHODS`, moeda por `Intl.NumberFormat` e `ReactDatePicker`
 * pt-BR — sem parametrizar `ExpenseFormFields`, cuja sobreposição é de dados e não
 * de comportamento.
 */
export function RecurringExpenseFormFields({
  disabled = false,
  organizationId,
  isEditMode = false,
}: RecurringExpenseFormFieldsProps) {
  const form = useFormContext<RecurringExpenseFormData>();
  const { categories, isLoading: isLoadingCategories } = useCategories(organizationId);

  const amountType = form.watch('amountType');
  const amountCopy = AMOUNT_COPY[amountType] ?? AMOUNT_COPY.FIXED;

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
                placeholder="Digite a descrição da recorrência"
                disabled={disabled}
                aria-describedby="description-error"
              />
            </FormControl>
            <FormMessage id="description-error" />
          </FormItem>
        )}
      />

      {/* Tipo de valor — imutável depois da criação. Na edição vira leitura. */}
      <FormField
        control={form.control}
        name="amountType"
        render={({ field }) => (
          <FormItem>
            <FormLabel required={!isEditMode}>Tipo de valor</FormLabel>
            {isEditMode ? (
              <div>
                <p className="text-sm font-medium" data-testid="amount-type-readonly">
                  {RECURRENCE_AMOUNT_TYPE_LABELS[field.value]}
                </p>
                <FormDescription>
                  Vale para a série inteira e não pode ser alterado.
                </FormDescription>
              </div>
            ) : (
              <>
                <Select
                  disabled={disabled}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger aria-describedby="amountType-error">
                      <SelectValue placeholder="Selecione o tipo de valor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FIXED">
                      {RECURRENCE_AMOUNT_TYPE_LABELS.FIXED}
                    </SelectItem>
                    <SelectItem value="VARIABLE">
                      {RECURRENCE_AMOUNT_TYPE_LABELS.VARIABLE}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage id="amountType-error" />
              </>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>{amountCopy.label}</FormLabel>
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
            <FormDescription data-testid="amount-help">
              {amountCopy.description}
            </FormDescription>
            <FormMessage id="amount-error" />
          </FormItem>
        )}
      />

      {/* Dia do vencimento — número de 1 a 31, com a nota fixa sobre meses curtos. */}
      <FormField
        control={form.control}
        name="dueDay"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Dia do vencimento</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={31}
                step={1}
                placeholder="1 a 31"
                disabled={disabled}
                aria-describedby="dueDay-error"
                value={field.value ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  field.onChange(raw === '' ? undefined : Number(raw));
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            <FormDescription data-testid="due-day-note">
              Meses sem esse dia usam o último dia do mês.
            </FormDescription>
            <FormMessage id="dueDay-error" />
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
                  <SelectValue
                    placeholder={isLoadingCategories ? 'Carregando...' : 'Selecione uma categoria'}
                  />
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
                  <SelectItem value="__empty" disabled>
                    Nenhuma categoria disponível
                  </SelectItem>
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
            <Select disabled={disabled} onValueChange={field.onChange} value={field.value ?? ''}>
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
            <Select disabled={disabled} onValueChange={field.onChange} value={field.value ?? ''}>
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

      {/* Data de início — imutável depois da criação. Na edição vira leitura. */}
      <FormField
        control={form.control}
        name="startDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel required={!isEditMode}>Data de início</FormLabel>
            {isEditMode ? (
              <div>
                <p className="text-sm font-medium" data-testid="start-date-readonly">
                  {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                </p>
                <FormDescription>
                  Vale para a série inteira e não pode ser alterada.
                </FormDescription>
              </div>
            ) : (
              <>
                <FormControl>
                  <ReactDatePicker
                    selected={field.value}
                    onChange={(date: Date | null) => field.onChange(date)}
                    onBlur={field.onBlur}
                    disabled={disabled}
                    locale="pt-BR"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Selecione a data"
                    wrapperClassName="w-full"
                    customInput={
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground',
                          form.formState.errors.startDate && 'border-destructive',
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
                <FormMessage id="startDate-error" />
              </>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="endDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data-fim (opcional)</FormLabel>
            <FormControl>
              <ReactDatePicker
                selected={field.value ?? null}
                onChange={(date: Date | null) => field.onChange(date)}
                onBlur={field.onBlur}
                disabled={disabled}
                isClearable={!disabled}
                locale="pt-BR"
                dateFormat="dd/MM/yyyy"
                placeholderText="Sem fim definido"
                wrapperClassName="w-full"
                customInput={
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground',
                      form.formState.errors.endDate && 'border-destructive',
                    )}
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                      : 'Sem fim definido'}
                  </Button>
                }
              />
            </FormControl>
            <FormDescription>
              Deixe em branco para uma recorrência sem data de término.
            </FormDescription>
            <FormMessage id="endDate-error" />
          </FormItem>
        )}
      />
    </div>
  );
}
