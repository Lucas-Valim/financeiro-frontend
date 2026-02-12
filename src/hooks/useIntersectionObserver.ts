import { useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useIntersectionObserver(
  onIntersect: () => void,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { threshold = 0.8, rootMargin = '0px', enabled = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onIntersect);

  useEffect(() => {
    callbackRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    if (!enabled) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callbackRef.current();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, enabled]);

  return { ref };
}
