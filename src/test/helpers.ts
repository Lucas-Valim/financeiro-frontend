import { vi } from 'vitest'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function mockViewport(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('(max-width:767px)'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

export function resetViewport(): void {
  mockViewport(1280)
}

export function clearAllMocks(): void {
  vi.clearAllMocks()
}

export function mockResizeObserver(): void {
  class MockResizeObserver {
    callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
}

/**
 * Wrapper de QueryClientProvider para testes que renderizam componentes ou
 * hooks que usam react-query. `retry: false` mantém os testes determinísticos:
 * um erro falha na primeira tentativa em vez de esperar o backoff.
 *
 * Usa `createElement` porque este arquivo é `.ts` (sem JSX), seguindo o padrão
 * já adotado em `use-categories.test.ts` e `use-favorecidos.test.ts`.
 */
export function createQueryWrapper(): {
  Wrapper: ({ children }: { children: ReactNode }) => ReactElement
  queryClient: QueryClient
} {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  return { Wrapper, queryClient }
}
