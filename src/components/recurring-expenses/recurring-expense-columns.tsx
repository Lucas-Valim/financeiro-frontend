import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatCurrency';
import { ORGANIZATION_ID } from '@/constants/expenses';
import {
  RECURRENCE_AMOUNT_TYPE_LABELS,
  RECURRING_EXPENSE_STATUS_LABELS,
  formatDueDay,
  formatRecurrencePeriod,
} from '@/constants/recurring-expenses';
import { useFavorecidos } from '@/hooks/use-favorecidos';
import type {
  RecurrenceAmountType,
  RecurringExpenseDTO,
  RecurringExpenseStatus,
} from '@/types/recurring-expenses';
import type { Column } from '@/components/shared/DataGrid/types';

/** Traço exibido quando o nome do favorecido ainda não está disponível. */
const FAVORECIDO_PLACEHOLDER = '—';

// Reexportado para os consumidores da área que já importam daqui. A implementação
// é a de `@/lib/formatCurrency`, cujo fallback `R$ 0,00` é o correto para exibição.
export { formatCurrency };

const AMOUNT_TYPE_COLORS: Record<RecurrenceAmountType, string> = {
  FIXED: 'bg-blue-100 text-blue-800',
  VARIABLE: 'bg-amber-100 text-amber-800',
};

const STATUS_COLORS: Record<RecurringExpenseStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  ENDED: 'bg-gray-100 text-gray-800',
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass
      )}
    >
      {label}
    </span>
  );
}

export function RecurringAmountTypeBadge({ type }: { type: RecurrenceAmountType }) {
  return (
    <Badge label={RECURRENCE_AMOUNT_TYPE_LABELS[type]} colorClass={AMOUNT_TYPE_COLORS[type]} />
  );
}

export function RecurringExpenseStatusBadge({ status }: { status: RecurringExpenseStatus }) {
  return (
    <Badge label={RECURRING_EXPENSE_STATUS_LABELS[status]} colorClass={STATUS_COLORS[status]} />
  );
}

/**
 * Resolve o nome do favorecido no cliente, a partir do `favorecidoId`, usando a
 * mesma query `['favorecidos', organizationId]` que alimenta o `Combobox` do
 * formulário — a API de recorrências devolve apenas o id. Enquanto a lista
 * carrega, ou quando o id não está na lista, mostra um traço em vez de string
 * vazia, para nunca deixar a célula em branco nem quebrar.
 */
export function FavorecidoCell({ favorecidoId }: { favorecidoId: string }) {
  const { favorecidos, isLoading } = useFavorecidos(ORGANIZATION_ID);

  if (isLoading) return <span>{FAVORECIDO_PLACEHOLDER}</span>;

  const favorecido = favorecidos.find((item) => item.id === favorecidoId);
  return <span>{favorecido?.name ?? FAVORECIDO_PLACEHOLDER}</span>;
}

export const RECURRING_EXPENSE_COLUMNS: Column<RecurringExpenseDTO>[] = [
  {
    id: 'description',
    header: 'Descrição',
    width: '200px',
    cardLabel: 'Descrição:',
    cell: (recurrence) => recurrence.description || FAVORECIDO_PLACEHOLDER,
  },
  {
    id: 'favorecido',
    header: 'Favorecido',
    width: '160px',
    cardLabel: 'Favorecido:',
    cell: (recurrence) => <FavorecidoCell favorecidoId={recurrence.favorecidoId} />,
  },
  {
    id: 'amountType',
    header: 'Tipo',
    width: '110px',
    cardLabel: 'Tipo:',
    cell: (recurrence) => <RecurringAmountTypeBadge type={recurrence.amountType} />,
  },
  {
    id: 'amount',
    header: 'Valor',
    width: '150px',
    cardLabel: 'Valor:',
    // Em recorrência de valor variável, o número exibido é apenas a sugestão da
    // primeira ocorrência: a nota "Valor de referência" viaja no conteúdo da
    // célula (e não no `cardLabel`, que é estático por coluna) para aparecer nos
    // três layouts.
    cell: (recurrence) => (
      <div className="flex flex-col">
        <span>{formatCurrency(recurrence.amount)}</span>
        {recurrence.amountType === 'VARIABLE' && (
          <span
            className="text-xs text-muted-foreground"
            data-testid="amount-reference-note"
          >
            Valor de referência
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'dueDay',
    header: 'Vencimento',
    width: '130px',
    cardLabel: 'Vencimento:',
    cell: (recurrence) => formatDueDay(recurrence.dueDay),
  },
  {
    id: 'period',
    header: 'Período',
    width: '220px',
    cardLabel: 'Período:',
    cell: (recurrence) => formatRecurrencePeriod(recurrence.startDate, recurrence.endDate),
  },
  {
    id: 'status',
    header: 'Estado',
    width: '110px',
    cardLabel: 'Estado:',
    cell: (recurrence) => <RecurringExpenseStatusBadge status={recurrence.status} />,
  },
];
