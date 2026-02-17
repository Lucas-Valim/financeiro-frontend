// This file MUST run before any other setup to polyfill React.act
// Vitest setupFiles run in order, so this should be listed first

import { vi } from 'vitest'

// Required for React 19 testing - tells React this is a test environment
// @ts-expect-error - globalThis.IS_REACT_ACT_ENVIRONMENT is a React internal property
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Mock react-dom/test-utils to provide our own act implementation
// The callback must be inline (not referencing outer variables) for hoisting to work
vi.mock('react-dom/test-utils', () => ({
  act: <T>(callback: () => T | Promise<T>): T | Promise<T> => {
    const result = callback()
    // Handle async callbacks
    if (result instanceof Promise) {
      return result
    }
    return result
  },
}))
