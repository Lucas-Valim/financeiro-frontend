import type { ExpenseStatus } from '../constants/expenses';
import type { ExpenseDTO } from './expenses';

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarFilters {
  status?: ExpenseStatus;
  receiver?: string;
  categoryId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  expense: ExpenseDTO;
  status: ExpenseStatus;
  amount: number;
}

export type ExpenseEventStatus = 'pending' | 'paid' | 'overdue';
