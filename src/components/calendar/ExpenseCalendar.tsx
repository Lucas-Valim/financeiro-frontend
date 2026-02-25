import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExpenseEvent } from './ExpenseEvent';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import type { ExpenseDTO } from '@/types/expenses';
import type { CalendarView, CalendarEvent } from '@/types/calendar';

import '@/styles/calendar.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

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

interface ExpenseCalendarProps {
  expenses: ExpenseDTO[];
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onEventClick: (expense: ExpenseDTO) => void;
}

export function ExpenseCalendar({
  expenses,
  currentDate,
  view,
  onDateChange,
  onEventClick,
}: ExpenseCalendarProps) {
  const events = useMemo(() => expenses.map(toCalendarEvent), [expenses]);

  const messages = useMemo(
    () => ({
      today: 'Hoje',
      previous: 'Anterior',
      next: 'Próximo',
      month: 'Mês',
      week: 'Semana',
      day: 'Dia',
      date: 'Data',
      time: 'Hora',
      event: 'Evento',
      noEventsInRange: 'Não há despesas neste período.',
      showMore: (total: number) => `+ ${total} mais`,
    }),
    []
  );

  const components = useMemo(
    () => ({
      event: ({ event }: { event: CalendarEvent }) => (
        <ExpenseEvent event={event} onClick={() => onEventClick(event.expense)} />
      ),
    }),
    [onEventClick]
  );

  if (view === 'week') {
    return (
      <WeekView
        expenses={expenses}
        currentDate={currentDate}
        onEventClick={onEventClick}
      />
    );
  }

  if (view === 'day') {
    return (
      <DayView
        expenses={expenses}
        currentDate={currentDate}
        onEventClick={onEventClick}
      />
    );
  }

  return (
    <Calendar<CalendarEvent>
      localizer={localizer}
      events={events}
      date={currentDate}
      view="month"
      onNavigate={onDateChange}
      onView={() => { /* Intentionally empty: view changes are handled by custom WeekView/DayView components */ }}
      views={['month']}
      messages={messages}
      components={components}
      culture="pt-BR"
      popup
      toolbar={false}
      className="flex-1 min-h-0"
    />
  );
}
