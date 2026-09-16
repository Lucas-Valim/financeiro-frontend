import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSlowRequestNotice } from '../use-slow-request-notice';

const THRESHOLD_MS = 8000;

describe('useSlowRequestNotice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not warn while the load is still within the threshold', () => {
    const { result } = renderHook(() => useSlowRequestNotice(true, THRESHOLD_MS));

    expect(result.current).toBe(false);
  });

  it('should warn once the load runs past the threshold', async () => {
    const { result } = renderHook(() => useSlowRequestNotice(true, THRESHOLD_MS));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(THRESHOLD_MS);
    });

    expect(result.current).toBe(true);
  });

  it('should stay quiet when nothing is loading', async () => {
    const { result } = renderHook(() =>
      useSlowRequestNotice(false, THRESHOLD_MS)
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(THRESHOLD_MS);
    });

    expect(result.current).toBe(false);
  });

  it('should reset once the load finishes, so a later fast request starts clean', async () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useSlowRequestNotice(isLoading, THRESHOLD_MS),
      { initialProps: { isLoading: true } }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(THRESHOLD_MS);
    });
    expect(result.current).toBe(true);

    act(() => rerender({ isLoading: false }));

    expect(result.current).toBe(false);
  });
});
