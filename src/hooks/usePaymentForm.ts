import { useCallback, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  paymentFormSchema,
  defaultPaymentFormValues,
  transformPaymentFormData,
  type PaymentFormData,
  type CreatePaymentInput,
  type PaymentRequest,
} from '@/schemas/payment-schema';
import type { ExpenseDTO } from '@/types/expenses';

interface UsePaymentFormOptions {
  /** The expense to pay */
  expense: ExpenseDTO;
  /** Callback fired when payment succeeds */
  onSuccess?: (result: unknown) => void;
}

interface UsePaymentFormReturn {
  /** React Hook Form instance */
  form: UseFormReturn<PaymentFormData>;
  /** Whether form has unsaved changes */
  isDirty: boolean;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Submit the form */
  onSubmit: () => Promise<void>;
  /** Reset form to initial values */
  resetForm: () => void;
  /** Get payment request data for API */
  getPaymentRequest: () => PaymentRequest | null;
}

/**
 * Custom hook for managing payment form state and submission
 * Handles form validation, submission, and state management
 */
export function usePaymentForm({
  expense,
  onSuccess,
}: UsePaymentFormOptions): UsePaymentFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      ...defaultPaymentFormValues,
      expenseId: expense.id,
      amount: expense.amount,
    },
  });

  const isDirty = form.formState.isDirty;

  // Reset form to initial values
  const resetForm = useCallback(() => {
    form.reset({
      ...defaultPaymentFormValues,
      expenseId: expense.id,
      amount: expense.amount,
    });
  }, [form, expense]);

  // Get payment request data for API
  const getPaymentRequest = useCallback((): PaymentRequest | null => {
    const formData = form.getValues();

    // Validate required fields
    if (!formData.expenseId || !formData.paymentDate || !formData.amount || !formData.paymentMethod) {
      return null;
    }

    const transformedData = transformPaymentFormData(formData);

    return {
      id: transformedData.expenseId,
      paymentDate: transformedData.paymentDate.toISOString().split('T')[0],
      paymentProof: transformedData.paymentProof ?? undefined,
      amount: transformedData.amount,
      paymentMethod: transformedData.paymentMethod,
      referenceNumber: transformedData.referenceNumber,
      notes: transformedData.notes,
    };
  }, [form]);

  // Handle form submission
  const onSubmit = useCallback(async () => {
    // Trigger validation
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentRequest = getPaymentRequest();
      if (!paymentRequest) {
        throw new Error('Invalid form data');
      }

      // The actual mutation call will be handled by the parent component
      // This hook just prepares the data and validates
      onSuccess?.(paymentRequest);
    } catch (error) {
      console.error('Payment form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, getPaymentRequest, onSuccess]);

  return {
    form,
    isDirty,
    isSubmitting,
    onSubmit,
    resetForm,
    getPaymentRequest,
  };
}
