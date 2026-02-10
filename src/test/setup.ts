import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import * as React from 'react'

expect.extend(matchers)

declare module 'vitest' {
  interface AsymmetricMatchersContaining {
    toHaveClass: typeof matchers.toHaveClass
    toBeInTheDocument: typeof matchers.toBeInTheDocument
  }
}

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
