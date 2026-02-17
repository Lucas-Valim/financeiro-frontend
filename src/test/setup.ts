import { expect, afterEach, vi } from 'vitest'
import React from 'react'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Required for React 19 testing - tells React this is a test environment
// @ts-expect-error - globalThis.IS_REACT_ACT_ENVIRONMENT is a React internal property
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Note: React.act polyfill is handled in setup-polyfill.ts which runs first

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

class MockResizeObserver {
  callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

;(window as unknown as typeof window).ResizeObserver = MockResizeObserver

class MockIntersectionObserver implements IntersectionObserver {
  callback: IntersectionObserverCallback
  elements: Element[] = []
  root: Element | Document | null = null
  rootMargin: string = '0px'
  thresholds: ReadonlyArray<number> = [0]

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    if (options) {
      this.root = options.root ?? null
      this.rootMargin = options.rootMargin ?? '0px'
      this.thresholds = Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold ?? 0]
    }
  }

  observe(element: Element): void {
    this.elements.push(element)
  }

  unobserve(element: Element): void {
    this.elements = this.elements.filter((el) => el !== element)
  }

  disconnect(): void {
    this.elements = []
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  triggerIntersection(isIntersecting: boolean) {
    const entries = this.elements.map((element) => ({
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      target: element,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    })) as IntersectionObserverEntry[]

    this.callback(entries, this)
  }
}

;(window as unknown as typeof window).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

// Pointer capture polyfill for Radix UI components
Element.prototype.hasPointerCapture = vi.fn()
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()

function createIconMock(name: string): ({ className }: { className?: string }) => React.ReactElement {
  return ({ className }) =>
    React.createElement('span', { 'data-testid': `${name.toLowerCase()}-icon`, className, 'aria-hidden': 'true' })
}

vi.mock('lucide-react', () => ({
  Home: createIconMock('Home'),
  Wallet: createIconMock('Wallet'),
  BarChart3: createIconMock('BarChart3'),
  PanelLeft: createIconMock('PanelLeft'),
  X: createIconMock('X'),
  ChevronDown: createIconMock('ChevronDown'),
  ChevronUp: createIconMock('ChevronUp'),
  Check: createIconMock('Check'),
  MoreVertical: createIconMock('MoreVertical'),
  AlertCircle: createIconMock('AlertCircle'),
  Loader2: createIconMock('Loader2'),
  CalendarIcon: createIconMock('CalendarIcon'),
}))

vi.mock('@tanstack/react-router', () => ({
  Outlet: () => null,
  useLocation: () => ({
    pathname: '/',
    search: {},
    hash: '',
    state: null,
    key: 'default'
  }),
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    state: {
      location: {
        pathname: '/',
        search: {},
        hash: '',
        state: null,
        key: 'default'
      },
      matches: [],
      cachedMatches: []
    },
    isServer: false
  }),
  useRouterState: () => ({
    location: {
      pathname: '/',
      search: {},
      hash: '',
      state: null,
      key: 'default'
    },
    matches: [],
    cachedMatches: [],
    isServer: false
  }),
  Link: ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => {
    return React.createElement('a', props, children)
  }
}))
