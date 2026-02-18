import type { Assertion, AsymmetricMatchersContaining } from 'vitest'

declare module 'vitest' {
  interface Assertion<T> extends jest.Matchers<void, T> {
    toHaveClass: (className: string) => void
    toBeInTheDocument: () => void
    toHaveTextContent: (text: string) => void
    toBeDisabled: () => void
    toBeEnabled: () => void
  }
  
  interface AsymmetricMatchersContaining {
    toHaveClass: typeof jest.Matchers.prototype.toHaveClass
    toBeInTheDocument: typeof jest.Matchers.prototype.toBeInTheDocument
    toHaveTextContent: typeof jest.Matchers.prototype.toHaveTextContent
    toBeDisabled: typeof jest.Matchers.prototype.toBeDisabled
    toBeEnabled: typeof jest.Matchers.prototype.toBeEnabled
  }
}
