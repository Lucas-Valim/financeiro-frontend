import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  format,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExpenseEvent } from '../ExpenseEvent';
import type { ExpenseDTO } from '@/types/expenses';
import type { CalendarEvent } from '@/types/calendar';

interface WeekViewProps {
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

function groupExpensesByDay(
  expenses: ExpenseDTO[],
  days: Date[]
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  days.forEach((day) => {
    grouped.set(day.toISOString(), []);
  });

  expenses.forEach((expense) => {
    const expenseDate = new Date(expense.dueDate);
    const matchingDay = days.find((day) => isSameDay(day, expenseDate));
    if (matchingDay) {
      const key = matchingDay.toISOString();
      const events = grouped.get(key) || [];
      events.push(toCalendarEvent(expense));
      grouped.set(key, events);
    }
  });

  return grouped;
}

function formatDayHeader(date: Date): string {
  return format(date, 'EEE', { locale: ptBR });
}

function formatDayNumber(date: Date): string {
  return format(date, 'd');
}

export function WeekView({ expenses, currentDate, onEventClick }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const expensesByDay = useMemo(
    () => groupExpensesByDay(expenses, weekDays),
    [expenses, weekDays]
  );

  return (
    <div
      className="flex-1 min-h-0 overflow-auto bg-[var(--calendar-bg)] border rounded-lg"
      style={{ borderColor: 'var(--calendar-border)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-7 md:min-h-full">
        {weekDays.map((day) => {
          const dayKey = day.toISOString();
          const dayEvents = expensesByDay.get(dayKey) || [];
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dayKey}
              className="flex flex-col border-b md:border-b-0 md:border-r last:border-r-0 min-h-[120px] md:min-h-0"
              style={{ borderColor: 'var(--calendar-border)' }}
            >
              <div
                className={`sticky top-0 z-10 p-2 text-center border-b ${
                  isCurrentDay ? 'bg-[var(--calendar-today)]' : 'bg-[var(--calendar-bg)]'
                }`}
                style={{ borderColor: 'var(--calendar-border)' }}
              >
                <div
                  className="text-xs font-medium uppercase text-[var(--calendar-text-secondary)]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {formatDayHeader(day)}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isCurrentDay
                      ? 'text-[var(--accent-primary)]'
                      : 'text-[var(--calendar-text-primary)]'
                  }`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {formatDayNumber(day)}
                </div>
              </div>

              <div className="flex-1 p-1 space-y-1 overflow-y-auto">
                {dayEvents.length === 0 ? (
                  <div className="h-full min-h-[60px] flex items-center justify-center text-xs text-[var(--calendar-text-secondary)] opacity-50">
                    —
                  </div>
                ) : (
                  dayEvents.map((event) => (
                    <ExpenseEvent
                      key={event.id}
                      event={event}
                      onClick={() => onEventClick(event.expense)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
