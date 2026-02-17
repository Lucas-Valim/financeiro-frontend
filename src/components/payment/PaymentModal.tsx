'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PaymentFormFields } from './PaymentFormFields';
import { usePayExpense } from '@/hooks/usePayExpense';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ExpenseDTO } from '@/types/expenses';
import {
  paymentFormSchema,
  defaultPaymentFormValues,
  type PaymentFormData,
} from '@/schemas/payment-schema';

export interface PaymentModalProps {
  /** Controls whether the modal is open */
  isOpen: boolean;
  /** Callback fired when the modal should close */
  onClose: () => void;
  /** Callback fired when payment succeeds */
  onSuccess?: () => void;
  /** The expense to pay */
  expense: ExpenseDTO | null;
}

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Modal component for registering expense payments
 * Features:
 * - Payment form with amount, date, method, and optional receipt
 * - File upload with image preview
 * - Loading state during submission
 * - Success/error feedback
 * - Form reset after successful payment
 */
export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  expense,
}: PaymentModalProps) {
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payExpenseMutation = usePayExpense();

  // Initialize form with React Hook Form
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      ...defaultPaymentFormValues,
      expenseId: expense?.id ?? '',
      amount: expense?.amount,
    },
  });

  const { reset } = form;

  // Reset modal state
  const resetModal = useCallback(() => {
    if (expense) {
      reset({
        ...defaultPaymentFormValues,
        expenseId: expense.id,
        amount: expense.amount,
      });
      setSubmissionState('idle');
      setErrorMessage(null);
    }
  }, [expense, reset]);

  // Reset form when modal opens with new expense data
  useEffect(() => {
    if (isOpen && expense) {
      resetModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, expense]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: PaymentFormData) => {
      if (!expense) return;

      setSubmissionState('submitting');
      setErrorMessage(null);

      try {
        const paymentData = {
          id: expense.id,
          paymentDate: data.paymentDate.toISOString().split('T')[0],
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || undefined,
          notes: data.notes || undefined,
          paymentProof: data.paymentProof || undefined,
        };

        await payExpenseMutation.mutateAsync(paymentData);

        setSubmissionState('success');
        toast.success('Pagamento registrado com sucesso!');

        // Close modal after short delay to show success state
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      } catch (error) {
        setSubmissionState('error');
        const message = error instanceof Error ? error.message : 'Erro ao registrar pagamento';
        setErrorMessage(message);
        toast.error(message);
      }
    },
    [expense, payExpenseMutation, onSuccess, onClose]
  );

  // Handle close
  const handleClose = useCallback(() => {
    if (submissionState === 'submitting') return;
    onClose();
  }, [submissionState, onClose]);

  // Handle dialog open change
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose]
  );

  const isSubmitting = submissionState === 'submitting';
  const isSuccess = submissionState === 'success';
  const isError = submissionState === 'error';

  // Format currency for display
  const formatCurrency = (value: number | undefined): string => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!expense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Preencha os dados do pagamento para a despesa:{' '}
            <span className="font-medium">{expense.description}</span>
            <br />
            Valor original: <span className="font-medium">{formatCurrency(expense.amount)}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Success state */}
        {isSuccess && (
          <div
            className="flex flex-col items-center justify-center py-8"
            data-testid="success-state"
          >
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-medium text-center">Pagamento Registrado!</p>
          </div>
        )}

        {/* Form */}
        {!isSuccess && (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <PaymentFormFields disabled={isSubmitting} />

              {/* Error message */}
              {isError && errorMessage && (
                <div
                  className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive"
                  data-testid="error-message"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                  data-testid="submit-button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrar Pagamento'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
