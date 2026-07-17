import { Card, CardContent } from '@/components/ui/card';
import { EXPENSE_STATUS_COLORS, ExpenseStatus } from '@/constants/expenses';
import { formatCurrency } from '@/lib/formatCurrency';

export interface StatusCardsProps {
  openCount: number;
  overdueCount: number;
  paidCount: number;
  cancelledCount: number;
  openTotal: number;
  overdueTotal: number;
  paidTotal: number;
  cancelledTotal: number;
  onCardClick: (status: ExpenseStatus) => void;
  activeStatus?: ExpenseStatus | null;
}

const STATUS_CARDS_LABELS = {
  OPEN: 'Abertas',
  OVERDUE: 'Atrasadas',
  PAID: 'Pagas',
  CANCELLED: 'Canceladas',
} as const;

const STATUS_CARDS_CONFIG = [
  { status: ExpenseStatus.OPEN },
  { status: ExpenseStatus.OVERDUE },
  { status: ExpenseStatus.PAID },
  { status: ExpenseStatus.CANCELLED },
];

export function StatusCards({
  openCount,
  overdueCount,
  paidCount,
  cancelledCount,
  openTotal,
  overdueTotal,
  paidTotal,
  cancelledTotal,
  onCardClick,
  activeStatus = null,
}: StatusCardsProps) {
  const getCount = (status: ExpenseStatus): number => {
    switch (status) {
      case ExpenseStatus.OPEN:
        return openCount;
      case ExpenseStatus.OVERDUE:
        return overdueCount;
      case ExpenseStatus.PAID:
        return paidCount;
      case ExpenseStatus.CANCELLED:
        return cancelledCount;
      default:
        return 0;
    }
  };

  const getTotal = (status: ExpenseStatus): number => {
    switch (status) {
      case ExpenseStatus.OPEN:
        return openTotal;
      case ExpenseStatus.OVERDUE:
        return overdueTotal;
      case ExpenseStatus.PAID:
        return paidTotal;
      case ExpenseStatus.CANCELLED:
        return cancelledTotal;
      default:
        return 0;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {STATUS_CARDS_CONFIG.map(({ status }) => {
        const count = getCount(status);
        const total = getTotal(status);
        const label = STATUS_CARDS_LABELS[status];
        const isActive = activeStatus === status;
        const colorClass = EXPENSE_STATUS_COLORS[status];

        return (
          <Card
            key={status}
            className={`py-2 cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-inset ring-primary' : ''}`}
            onClick={() => onCardClick(status)}
            data-testid={`status-card-${status.toLowerCase()}`}
          >
            <CardContent className="p-2">
              <div className="flex flex-col items-center justify-center gap-1">
                <div className={`rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}>
                  {label}
                </div>
                <div
                  className="text-lg font-bold"
                  data-testid={`status-total-${status.toLowerCase()}`}
                >
                  {formatCurrency(total)}
                </div>
                <div
                  className="text-xs text-muted-foreground"
                  data-testid={`status-count-${status.toLowerCase()}`}
                >
                  {count} {count === 1 ? 'despesa' : 'despesas'}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
