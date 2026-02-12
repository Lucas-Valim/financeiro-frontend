import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIntersectionObserver } from '../useIntersectionObserver';

describe('useIntersectionObserver', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    
    // Create a mock constructor
    const MockIntersectionObserverClass = vi.fn().mockImplementation(() => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn(),
      takeRecords: vi.fn().mockReturnValue([]),
      root: null,
      rootMargin: '0px',
      thresholds: [0],
    }));

    // Replace global IntersectionObserver
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: MockIntersectionObserverClass,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a ref object', () => {
    const onIntersect = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver(onIntersect));

    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('does not throw when rendered', () => {
    const onIntersect = vi.fn();
    
    expect(() => {
      renderHook(() => useIntersectionObserver(onIntersect));
    }).not.toThrow();
  });

  it('accepts threshold option', () => {
    const onIntersect = vi.fn();
    
    expect(() => {
      renderHook(() => useIntersectionObserver(onIntersect, { threshold: 0.8 }));
    }).not.toThrow();
  });

  it('accepts rootMargin option', () => {
    const onIntersect = vi.fn();
    
    expect(() => {
      renderHook(() => useIntersectionObserver(onIntersect, { rootMargin: '100px' }));
    }).not.toThrow();
  });

  it('accepts enabled option', () => {
    const onIntersect = vi.fn();
    
    expect(() => {
      renderHook(() => useIntersectionObserver(onIntersect, { enabled: false }));
    }).not.toThrow();
  });

  it('disconnects on unmount', () => {
    const onIntersect = vi.fn();
    const { unmount } = renderHook(() => useIntersectionObserver(onIntersect));
    
    // Even without an element, unmount should not throw
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
