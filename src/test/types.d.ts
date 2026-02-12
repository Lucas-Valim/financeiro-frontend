import * as matchers from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Assertion<T = unknown> extends Matchers<void, T> {
    toHaveClass(...args: Parameters<typeof matchers.toHaveClass>): this
    toBeInTheDocument(...args: Parameters<typeof matchers.toBeInTheDocument>): this
    toHaveAttribute(...args: Parameters<typeof matchers.toHaveAttribute>): this
    toHaveValue(...args: Parameters<typeof matchers.toHaveValue>): this
  }
}
