import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ExpensesApiService } from '../api/expenses-api';
import type { ExpenseDTO, ExpenseFilter } from '../types/expenses';
import type { CalendarView, CalendarFilters } from '../types/calendar';

interface UseExpenseCalendarParams {
  currentDate: Date;
  view: CalendarView;
  filters: CalendarFilters;
}

interface UseExpenseCalendarReturn {
  expenses: ExpenseDTO[];
  isLoading: boolean;
  error: Error | null;
  receivers: string[];
}

const expensesApiService = new ExpensesApiService();

const CALENDAR_EXPENSES_LIMIT = 100;

function getDateRange(date: Date, view: CalendarView): { start: Date; end: Date } {
  const normalizedDate = startOfDay(date);

  switch (view) {
    case 'month':
      return {
        start: startOfMonth(normalizedDate),
        end: endOfMonth(normalizedDate),
      };
    case 'week':
      return {
        start: startOfWeek(normalizedDate, { weekStartsOn: 0 }),
        end: endOfWeek(normalizedDate, { weekStartsOn: 0 }),
      };
    case 'day':
      return {
        start: startOfDay(normalizedDate),
        end: endOfDay(normalizedDate),
      };
    default:
      return {
        start: startOfMonth(normalizedDate),
        end: endOfMonth(normalizedDate),
      };
  }
}

export function useExpenseCalendar({
  currentDate,
  view,
  filters,
}: UseExpenseCalendarParams): UseExpenseCalendarReturn {
  const dateRange = useMemo(() => getDateRange(currentDate, view), [currentDate, view]);

  const expenseFilter: ExpenseFilter = useMemo(
    () => ({
      status: filters.status,
      receiver: filters.receiver,
      categoryId: filters.categoryId,
      dueDateStart: dateRange.start,
      dueDateEnd: dateRange.end,
    }),
    [filters, dateRange]
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses', 'calendar', expenseFilter],
    queryFn: async () => {
      const result = await expensesApiService.fetchExpenses(expenseFilter, {
        page: 1,
        limit: CALENDAR_EXPENSES_LIMIT,
      });
      return result.data;
    },
    staleTime: 30000,
    gcTime: 60000,
  });

  const receivers = useMemo(() => {
    if (!data) return [];
    const uniqueReceivers = new Set(data.map((expense) => expense.receiver));
    return Array.from(uniqueReceivers).sort();
  }, [data]);

  return {
    expenses: data ?? [],
    isLoading,
    error: error as Error | null,
    receivers,
  };
}
