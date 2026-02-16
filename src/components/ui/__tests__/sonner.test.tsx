import { describe, it, expect } from 'vitest'

describe('Dependencies Import Tests', () => {
  it('should import react-hook-form without errors', async () => {
    const { useForm } = await import('react-hook-form')
    expect(useForm).toBeDefined()
    expect(typeof useForm).toBe('function')
  })

  it('should import zod without errors', async () => {
    const { z } = await import('zod')
    expect(z).toBeDefined()
    expect(typeof z.object).toBe('function')
  })

  it('should import @hookform/resolvers without errors', async () => {
    const { zodResolver } = await import('@hookform/resolvers/zod')
    expect(zodResolver).toBeDefined()
    expect(typeof zodResolver).toBe('function')
  })

  it('should import sonner without errors', async () => {
    const sonner = await import('sonner')
    expect(sonner.toast).toBeDefined()
    expect(typeof sonner.toast).toBe('function')
    expect(typeof sonner.toast.success).toBe('function')
    expect(typeof sonner.toast.error).toBe('function')
    expect(typeof sonner.toast.info).toBe('function')
    expect(typeof sonner.toast.warning).toBe('function')
  })

  it('should import Toaster component without errors', async () => {
    const { Toaster } = await import('../sonner')
    expect(Toaster).toBeDefined()
    expect(typeof Toaster).toBe('function')
  })
})

describe('Zod Schema Integration Tests', () => {
  it('should create a form schema with zod and use zodResolver', async () => {
    const { z } = await import('zod')
    const { zodResolver } = await import('@hookform/resolvers/zod')

    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
    })

    const resolver = zodResolver(testSchema)
    expect(resolver).toBeDefined()
    expect(typeof resolver).toBe('function')
  })

  it('should validate schema with zod and infer types correctly', async () => {
    const { z } = await import('zod')

    const expenseSchema = z.object({
      description: z.string().min(1, 'Description is required'),
      amount: z.number().positive('Amount must be positive'),
      date: z.string().min(1, 'Date is required'),
    })

    // Test valid data
    const validResult = expenseSchema.safeParse({
      description: 'Test expense',
      amount: 100.50,
      date: '2024-01-15',
    })
    expect(validResult.success).toBe(true)

    // Test invalid data
    const invalidResult = expenseSchema.safeParse({
      description: '',
      amount: -50,
      date: '',
    })
    expect(invalidResult.success).toBe(false)
  })
})

describe('React Hook Form Integration Tests', () => {
  it('should verify useForm and zodResolver can be imported together', async () => {
    const reactHookForm = await import('react-hook-form')
    const { z } = await import('zod')
    const { zodResolver } = await import('@hookform/resolvers/zod')

    const testSchema = z.object({
      name: z.string().min(1),
    })

    // Verify both imports are available and compatible
    expect(reactHookForm.useForm).toBeDefined()
    expect(typeof zodResolver).toBe('function')

    // Verify zodResolver can process the schema
    const resolver = zodResolver(testSchema)
    expect(resolver).toBeDefined()
    expect(typeof resolver).toBe('function')
  })
})

describe('Sonner Toast API Tests', () => {
  it('should expose all required toast methods', async () => {
    const { toast } = await import('sonner')

    // Verify toast function signature
    expect(typeof toast).toBe('function')
    expect(typeof toast.success).toBe('function')
    expect(typeof toast.error).toBe('function')
    expect(typeof toast.info).toBe('function')
    expect(typeof toast.warning).toBe('function')
    expect(typeof toast.loading).toBe('function')
    expect(typeof toast.dismiss).toBe('function')
    expect(typeof toast.promise).toBe('function')
  })
})
