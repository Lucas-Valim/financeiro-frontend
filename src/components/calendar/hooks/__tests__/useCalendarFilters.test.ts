import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarFilters } from '../useCalendarFilters';
import { ExpenseStatus } from '@/constants/expenses';

describe('useCalendarFilters', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  describe('activeFiltersCount', () => {
    it('returns 0 when no filters are set', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: {},
          onFilterChange: mockOnFilterChange,
        })
      );

      expect(result.current.activeFiltersCount).toBe(0);
    });

    it('returns 1 when one filter is set', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: { status: ExpenseStatus.OPEN },
          onFilterChange: mockOnFilterChange,
        })
      );

      expect(result.current.activeFiltersCount).toBe(1);
    });

    it('returns correct count for multiple filters', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: {
            status: ExpenseStatus.OPEN,
            receiver: 'Test Receiver',
            categoryId: 'cat-1',
          },
          onFilterChange: mockOnFilterChange,
        })
      );

      expect(result.current.activeFiltersCount).toBe(3);
    });

    it('ignores empty string filters', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: { receiver: '' },
          onFilterChange: mockOnFilterChange,
        })
      );

      expect(result.current.activeFiltersCount).toBe(0);
    });
  });

  describe('handleStatusChange', () => {
    it('calls onFilterChange with status when value is not ALL_VALUE', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: {},
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.handleStatusChange(ExpenseStatus.OPEN);
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ status: ExpenseStatus.OPEN });
    });

    it('calls onFilterChange with undefined when value is ALL_VALUE', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: {},
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.handleStatusChange('__all__');
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ status: undefined });
    });
  });

  describe('handleReceiverChange', () => {
    it('calls onFilterChange with receiver when value is not ALL_VALUE', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: {},
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.handleReceiverChange('Test Receiver');
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ receiver: 'Test Receiver' });
    });

    it('calls onFilterChange with undefined when value is ALL_VALUE', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: {},
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.handleReceiverChange('__all__');
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ receiver: undefined });
    });
  });

  describe('handleCategoryChange', () => {
    it('calls onFilterChange with categoryId when value is not ALL_VALUE', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: {},
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.handleCategoryChange('cat-1');
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ categoryId: 'cat-1' });
    });

    it('calls onFilterChange with undefined when value is ALL_VALUE', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: {},
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.handleCategoryChange('__all__');
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ categoryId: undefined });
    });
  });

  describe('handleClearFilters', () => {
    it('calls onFilterChange with all filters undefined', () => {
      const { result } = renderHook(() =>
        useCalendarFilters({
          filters: {
            status: ExpenseStatus.OPEN,
            receiver: 'Test',
            categoryId: 'cat-1',
          },
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.handleClearFilters();
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        status: undefined,
        receiver: undefined,
        categoryId: undefined,
      });
    });
  });
});
