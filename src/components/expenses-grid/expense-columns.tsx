import { cn } from '@/lib/utils';
import { EXPENSE_STATUS_COLORS, type ExpenseStatus } from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';
import type { Column } from '@/components/shared/DataGrid/types';
import { ExpenseMarkers } from '@/components/expenses/ExpenseMarkers';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatAmount(amount: number): string {
  return currencyFormatter.format(amount ?? 0);
}

export function formatDate(date: Date | string): string {
  if (!date) return 'N/A';
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return 'N/A';
    return dateFormatter.format(parsed);
  } catch {
    return 'N/A';
  }
}

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const statusColorClass = EXPENSE_STATUS_COLORS[status] || '';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusColorClass
      )}
    >
      {status}
    </span>
  );
}

export const EXPENSE_COLUMNS: Column<ExpenseDTO>[] = [
  {
    // `width` é track de CSS grid do card de tablet E largura de `<th>` do
    // desktop ao mesmo tempo (Column.width é único). Alargado de 200px para
    // acomodar a descrição junto dos marcadores, que empilham abaixo dela para
    // não competir por espaço horizontal e truncar a descrição.
    id: 'description',
    header: 'Descrição',
    width: '260px',
    cardLabel: 'Descrição:',
    cell: (expense) => (
      <div className="flex flex-col gap-1">
        <span>{expense.description ?? 'N/A'}</span>
        <ExpenseMarkers expense={expense} density="list" />
      </div>
    ),
  },
  {
    id: 'amount',
    header: 'Valor',
    width: '150px',
    cardLabel: 'Valor:',
    cell: (expense) => formatAmount(expense.amount),
  },
  {
    id: 'receiver',
    header: 'Fornecedor',
    width: '150px',
    cardLabel: 'Fornecedor:',
    cell: (expense) => expense.receiver ?? 'N/A',
  },
  {
    id: 'dueDate',
    header: 'Data de Vencimento',
    width: '150px',
    cardLabel: 'Data de Vencimento:',
    cell: (expense) => formatDate(expense.dueDate),
  },
  {
    id: 'status',
    header: 'Status',
    width: '100px',
    cardLabel: 'Status:',
    cell: (expense) => <ExpenseStatusBadge status={expense.status} />,
  },
];
