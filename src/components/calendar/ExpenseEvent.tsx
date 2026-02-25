import { useMemo } from 'react';
import { startOfDay } from 'date-fns';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ExpenseStatus } from '@/constants/expenses';
import type { CalendarEvent, ExpenseEventStatus } from '@/types/calendar';

interface ExpenseEventProps {
  event: CalendarEvent;
  onClick: () => void;
}

function getEventStatus(event: CalendarEvent): ExpenseEventStatus {
  const today = startOfDay(new Date());
  const dueDate = startOfDay(new Date(event.expense.dueDate));

  if (event.expense.status === ExpenseStatus.PAID) return 'paid';
  if (dueDate < today) return 'overdue';
  return 'pending';
}

function getStatusStyles(status: ExpenseEventStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-[var(--event-paid-bg)] text-[var(--event-paid-text)] border-l-[var(--event-paid-border)]';
    case 'overdue':
      return 'bg-[var(--event-overdue-bg)] text-[var(--event-overdue-text)] border-l-[var(--event-overdue-border)]';
    case 'pending':
      return 'bg-[var(--event-pending-bg)] text-[var(--event-pending-text)] border-l-[var(--event-pending-border)]';
  }
}

function StatusIcon({ status }: { status: ExpenseEventStatus }) {
  const iconProps = { className: 'w-3 h-3 flex-shrink-0' };

  switch (status) {
    case 'paid':
      return <CheckCircle {...iconProps} aria-hidden="true" />;
    case 'overdue':
      return <AlertCircle {...iconProps} aria-hidden="true" />;
    case 'pending':
      return <Clock {...iconProps} aria-hidden="true" />;
  }
}

function getStatusLabel(status: ExpenseEventStatus): string {
  switch (status) {
    case 'paid':
      return 'Pago';
    case 'overdue':
      return 'Vencido';
    case 'pending':
      return 'Pendente';
  }
}

export function ExpenseEvent({ event, onClick }: ExpenseEventProps) {
  const status = useMemo(() => getEventStatus(event), [event]);

  const formattedAmount = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(event.amount),
    [event.amount]
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full p-1.5 rounded border-l-2 text-left
        transition-all
        hover:scale-[1.02] hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-1
        ${getStatusStyles(status)}
      `}
      style={{ transitionDuration: 'var(--motion-hover)' }}
      aria-label={`${event.title}, ${formattedAmount}, ${getStatusLabel(status)}`}
    >
      <div className="flex items-center gap-1">
        <StatusIcon status={status} />
        <span
          className="text-xs font-medium truncate flex-1"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {event.title}
        </span>
      </div>
      <span
        className="text-xs font-semibold mt-0.5 block"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {formattedAmount}
      </span>
    </button>
  );
}
