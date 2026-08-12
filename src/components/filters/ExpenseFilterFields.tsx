import { useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import { useFavorecidos } from '@/hooks/use-favorecidos';
import {
  EXPENSE_STATUS_LABELS,
  ExpenseStatus,
  ORGANIZATION_ID,
  PAYMENT_METHODS,
} from '@/constants/expenses';
import { formatDocument } from '@/lib/format-document';
import { cn } from '@/lib/utils';
import type { FavorecidoDTO } from '@/types/favorecidos';
import type { ExpenseFilter } from '@/types/expenses';

/**
 * Sentinel value for the "no filter" option of the status, payment-method and
 * category selects. Radix Select forbids an empty-string item value, so the
 * absence of a filter is modelled by this explicit option.
 */
const ALL_OPTION = 'ALL';

const STATUS_OPTIONS = [
  ExpenseStatus.OPEN,
  ExpenseStatus.OVERDUE,
  ExpenseStatus.PAID,
  ExpenseStatus.CANCELLED,
] as const;

export interface ExpenseFilterFieldsProps {
  filters: ExpenseFilter;
  /** Receives only the changed keys, so the parent decides how to merge them. */
  onChange: (patch: Partial<ExpenseFilter>) => void;
  /** Grid layout classes, since the modal and the report panel differ. */
  className?: string;
}

function formatDateInput(date: Date | undefined): string {
  return date ? format(date, 'yyyy-MM-dd') : '';
}

function parseDateInput(value: string): Date | undefined {
  return value ? parseISO(value) : undefined;
}

/**
 * The expense filter vocabulary — status, favorecido, município, forma de
 * pagamento, categoria and a due-date range — rendered as a set of fields with
 * no state of its own. Both the expense grid's filter modal (which buffers the
 * changes until "Aplicar") and the report panel (which applies them on every
 * interaction) render it, so the two screens cannot drift apart.
 */
export function ExpenseFilterFields({
  filters,
  onChange,
  className,
}: ExpenseFilterFieldsProps) {
  const { categories, isLoading: isLoadingCategories } =
    useCategories(ORGANIZATION_ID);
  const { favorecidos, isLoading: isLoadingFavorecidos } =
    useFavorecidos(ORGANIZATION_ID);

  const handleStatusChange = useCallback(
    (value: string) => {
      onChange({
        status: value === ALL_OPTION ? undefined : (value as ExpenseStatus),
      });
    },
    [onChange]
  );

  const handleFavorecidoChange = useCallback(
    (favorecidoId: string) => {
      const selected = favorecidos.find((f) => f.id === favorecidoId);
      onChange({ receiver: selected?.name || undefined });
    },
    [favorecidos, onChange]
  );

  const handleMunicipalityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ municipality: event.target.value || undefined });
    },
    [onChange]
  );

  const handlePaymentMethodChange = useCallback(
    (value: string) => {
      onChange({ paymentMethod: value === ALL_OPTION ? undefined : value });
    },
    [onChange]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      onChange({ categoryId: value === ALL_OPTION ? undefined : value });
    },
    [onChange]
  );

  const handleDueDateStartChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ dueDateStart: parseDateInput(event.target.value) });
    },
    [onChange]
  );

  const handleDueDateEndChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ dueDateEnd: parseDateInput(event.target.value) });
    },
    [onChange]
  );

  const favorecidoOptions = favorecidos.map((favorecido: FavorecidoDTO) => ({
    value: favorecido.id,
    label: favorecido.name,
    description: favorecido.document
      ? formatDocument(favorecido.document)
      : undefined,
  }));

  const selectedFavorecidoId =
    favorecidos.find((f) => f.name === filters.receiver)?.id ?? '';

  return (
    <div className={cn('grid gap-4', className)}>
      <div className="grid gap-2">
        <label htmlFor="filter-status-field" className="text-sm font-medium">
          Status
        </label>
        <Select
          value={filters.status ?? ALL_OPTION}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger id="filter-status-field" data-testid="filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>Todos os status</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {EXPENSE_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="filter-favorecido-field" className="text-sm font-medium">
          Favorecido
        </label>
        <Combobox
          id="filter-favorecido-field"
          options={favorecidoOptions}
          value={selectedFavorecidoId}
          onValueChange={handleFavorecidoChange}
          placeholder="Todos os favorecidos"
          searchPlaceholder="Buscar por nome ou documento..."
          emptyMessage="Nenhum favorecido encontrado."
          isLoading={isLoadingFavorecidos}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="filter-municipality-field"
          className="text-sm font-medium"
        >
          Município
        </label>
        <Input
          id="filter-municipality-field"
          type="text"
          data-testid="filter-municipality"
          placeholder="Buscar por município"
          value={filters.municipality ?? ''}
          onChange={handleMunicipalityChange}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="filter-payment-method-field"
          className="text-sm font-medium"
        >
          Forma de pagamento
        </label>
        <Select
          value={filters.paymentMethod ?? ALL_OPTION}
          onValueChange={handlePaymentMethodChange}
        >
          <SelectTrigger
            id="filter-payment-method-field"
            data-testid="filter-payment-method"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>Todas as formas</SelectItem>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="filter-category-field" className="text-sm font-medium">
          Categoria
        </label>
        <Select
          value={filters.categoryId ?? ALL_OPTION}
          onValueChange={handleCategoryChange}
          disabled={isLoadingCategories}
        >
          <SelectTrigger
            id="filter-category-field"
            data-testid="filter-category"
          >
            <SelectValue
              placeholder={
                isLoadingCategories ? 'Carregando...' : 'Todas as categorias'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <label
            htmlFor="filter-due-date-start-field"
            className="text-sm font-medium"
          >
            Vencimento de
          </label>
          <Input
            id="filter-due-date-start-field"
            type="date"
            data-testid="filter-due-date-start"
            value={formatDateInput(filters.dueDateStart)}
            onChange={handleDueDateStartChange}
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="filter-due-date-end-field"
            className="text-sm font-medium"
          >
            Vencimento até
          </label>
          <Input
            id="filter-due-date-end-field"
            type="date"
            data-testid="filter-due-date-end"
            value={formatDateInput(filters.dueDateEnd)}
            onChange={handleDueDateEndChange}
          />
        </div>
      </div>
    </div>
  );
}
