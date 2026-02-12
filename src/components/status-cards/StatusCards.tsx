import { Card, CardContent } from '@/components/ui/card';
import { EXPENSE_STATUS_COLORS, ExpenseStatus } from '@/constants/expenses';

export interface StatusCardsProps {
  openCount: number;
  overdueCount: number;
  paidCount: number;
  cancelledCount: number;
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
  { status: ExpenseStatus.OPEN, countKey: 'openCount' as const },
  { status: ExpenseStatus.OVERDUE, countKey: 'overdueCount' as const },
  { status: ExpenseStatus.PAID, countKey: 'paidCount' as const },
  { status: ExpenseStatus.CANCELLED, countKey: 'cancelledCount' as const },
];

export function StatusCards({
  openCount,
  overdueCount,
  paidCount,
  cancelledCount,
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

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {STATUS_CARDS_CONFIG.map(({ status }) => {
        const count = getCount(status);
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
              <div className="flex flex-col items-center justify-center gap-2">
                <div className={`rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}>
                  {label}
                </div>
                <div className="text-xl font-bold" data-testid={`status-count-${status.toLowerCase()}`}>
                  {count}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
