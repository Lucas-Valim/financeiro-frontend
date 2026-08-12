import { describe, it, expect } from 'vitest';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getDefaultReportFilters, EXPORT_TIMEOUT_MS } from '../reports';

describe('getDefaultReportFilters', () => {
  it('returns dueDateStart on the first day of the current month', () => {
    const filters = getDefaultReportFilters();

    expect(filters.dueDateStart?.getTime()).toBe(startOfMonth(new Date()).getTime());
  });

  it('returns dueDateEnd on the last day of the current month', () => {
    const filters = getDefaultReportFilters();

    expect(filters.dueDateEnd?.getTime()).toBe(endOfMonth(new Date()).getTime());
  });

  it('returns no status filter', () => {
    const filters = getDefaultReportFilters();

    expect(filters.status).toBeUndefined();
  });

  it('returns fresh Date instances on every call', () => {
    const first = getDefaultReportFilters();
    const second = getDefaultReportFilters();

    expect(first.dueDateStart).not.toBe(second.dueDateStart);
  });
});

describe('EXPORT_TIMEOUT_MS', () => {
  it('is 120 seconds', () => {
    expect(EXPORT_TIMEOUT_MS).toBe(120000);
  });
});
