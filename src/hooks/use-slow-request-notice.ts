import { useEffect, useState } from 'react';
import { SLOW_REQUEST_NOTICE_MS } from '../constants/api';

/**
 * Becomes true once a load has been running longer than `thresholdMs`, so the
 * UI can explain the wait instead of showing an undifferentiated spinner. The
 * backend hibernates when idle, and a cold start takes far longer than a warm
 * request — without this the two look identical to the user.
 *
 * The result is derived from `isLoading` rather than reset inside the effect
 * body, so a finished load reports false immediately and the next one starts
 * from a clean threshold.
 */
export function useSlowRequestNotice(
  isLoading: boolean,
  thresholdMs: number = SLOW_REQUEST_NOTICE_MS
): boolean {
  const [hasExceededThreshold, setHasExceededThreshold] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => setHasExceededThreshold(true), thresholdMs);

    return () => {
      clearTimeout(timer);
      setHasExceededThreshold(false);
    };
  }, [isLoading, thresholdMs]);

  return isLoading && hasExceededThreshold;
}
