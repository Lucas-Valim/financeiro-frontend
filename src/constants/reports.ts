import { startOfMonth, endOfMonth } from 'date-fns';
import type { ReportFilter } from '@/types/reports';

/**
 * Timeout for the export call. Overrides the global `API_TIMEOUT` (10s), which
 * is far too short for a bundle of up to 100 expenses. Only the export call
 * uses it — the rest of the application keeps failing fast (see techspec).
 */
export const EXPORT_TIMEOUT_MS = 120000;

/**
 * Default filters when the report screen first loads: the current month by due
 * date and no status filter (so all statuses except CANCELLED are included).
 * Returns fresh Date instances on every call to avoid sharing mutable Dates.
 */
export function getDefaultReportFilters(): ReportFilter {
  const now = new Date();
  return {
    dueDateStart: startOfMonth(now),
    dueDateEnd: endOfMonth(now),
  };
}
