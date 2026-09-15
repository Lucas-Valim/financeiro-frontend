import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { DEFAULT_DEBOUNCE_MS, useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('first'));

    expect(result.current).toBe('first');
  });

  it('keeps the previous value until the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    act(() => {
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_MS - 1);
    });

    expect(result.current).toBe('first');
  });

  it('emits the new value once the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    act(() => {
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });

    expect(result.current).toBe('second');
  });

  it('restarts the timer on every change so only the last value is emitted', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 100), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(40);
    });

    expect(result.current).toBe('abc');
  });
});
