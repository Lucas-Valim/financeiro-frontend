import type { Assertion, AsymmetricMatchersContaining } from 'vitest'

declare module 'vitest' {
  interface Assertion<T> extends jest.Matchers<void, T> {
    toHaveClass: (className: string) => void
    toBeInTheDocument: () => void
  }
  
  interface AsymmetricMatchersContaining {
    toHaveClass: typeof jest.Matchers.prototype.toHaveClass
    toBeInTheDocument: typeof jest.Matchers.prototype.toBeInTheDocument
  }
}
