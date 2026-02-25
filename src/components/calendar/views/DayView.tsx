import { useMemo } from 'react';
import { isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExpenseEvent } from '../ExpenseEvent';
import type { ExpenseDTO } from '@/types/expenses';
import type { CalendarEvent } from '@/types/calendar';

interface DayViewProps {
  expenses: ExpenseDTO[];
  currentDate: Date;
  onEventClick: (expense: ExpenseDTO) => void;
}

function toCalendarEvent(expense: ExpenseDTO): CalendarEvent {
  const dueDate = new Date(expense.dueDate);
  return {
    id: expense.id,
    title: expense.description,
    start: dueDate,
    end: dueDate,
    expense,
    status: expense.status,
    amount: expense.amount,
  };
}

function formatDayTitle(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function DayView({ expenses, currentDate, onEventClick }: DayViewProps) {
  const dayEvents = useMemo(() => {
    return expenses
      .filter((expense) => isSameDay(new Date(expense.dueDate), currentDate))
      .map(toCalendarEvent);
  }, [expenses, currentDate]);

  const dayTitle = useMemo(
    () => formatDayTitle(currentDate),
    [currentDate]
  );

  return (
    <div
      className="flex-1 min-h-0 overflow-auto bg-[var(--calendar-bg)] border rounded-lg"
      style={{ borderColor: 'var(--calendar-border)' }}
    >
      <div
        className="sticky top-0 z-10 p-4 border-b bg-[var(--calendar-bg)]"
        style={{ borderColor: 'var(--calendar-border)' }}
      >
        <h2
          className="text-lg font-semibold capitalize text-[var(--calendar-text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {dayTitle}
        </h2>
      </div>

      <div className="p-4">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--calendar-text-secondary)]">
            <p className="text-sm">Nenhuma despesa neste dia</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <ExpenseEvent
                key={event.id}
                event={event}
                onClick={() => onEventClick(event.expense)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
