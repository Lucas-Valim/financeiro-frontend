import { useEffect, useState } from 'react';

export const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Returns `value` after it has stayed unchanged for `delayMs`. Used to turn a
 * filter typed "in real time" into a server query without one request per
 * keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = DEFAULT_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}
