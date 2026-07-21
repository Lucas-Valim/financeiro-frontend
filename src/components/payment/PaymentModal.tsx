'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentFormFields } from './PaymentFormFields';
import { PaymentProofDisplay } from './PaymentProofDisplay';
import { PaymentProofViewer } from './PaymentProofViewer';
import { ExpenseDocumentsView } from './ExpenseDocumentsView';
import { usePayExpense } from '@/hooks/usePayExpense';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ExpenseDTO } from '@/types/expenses';
import { ExpenseStatus } from '@/constants/expenses';
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
 * Modal component for registering expense payments or viewing payment proof
 * Features:
 * - Payment form with amount, date, method, and optional receipt (for OPEN/OVERDUE)
 * - Read-only view of payment proof and date (for PAID expenses)
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
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);

  const payExpenseMutation = usePayExpense();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      ...defaultPaymentFormValues,
      expenseId: expense?.id ?? '',
    },
  });

  const { reset } = form;

  const isViewMode = expense?.status === ExpenseStatus.PAID;

  const formattedPaymentDate = expense?.paymentDate
    ? format(new Date(expense.paymentDate), 'dd/MM/yyyy', { locale: ptBR })
    : 'N/A';

  const resetModal = useCallback(() => {
    if (expense) {
      reset({
        ...defaultPaymentFormValues,
        expenseId: expense.id,
      });
      setSubmissionState('idle');
      setErrorMessage(null);
      setViewerImageUrl(null);
    }
  }, [expense, reset]);

  useEffect(() => {
    if (isOpen && expense) {
      resetModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, expense]);

  const handleSubmit = useCallback(
    async (data: PaymentFormData) => {
      if (!expense) return;

      setSubmissionState('submitting');
      setErrorMessage(null);

      try {
        const paymentData = {
          id: expense.id,
          paymentDate: data.paymentDate.toISOString().split('T')[0],
          paymentProof: data.paymentProof || undefined,
        };

        await payExpenseMutation.mutateAsync(paymentData);

        setSubmissionState('success');
        toast.success('Pagamento registrado com sucesso!');

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

  const handleClose = useCallback(() => {
    if (submissionState === 'submitting') return;
    onClose();
  }, [submissionState, onClose]);

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

  const formatCurrency = (value: number | undefined): string => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!expense) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            if (viewerImageUrl !== null) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (viewerImageUrl !== null) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (viewerImageUrl !== null) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? 'Ver Comprovante' : 'Registrar Pagamento'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do pagamento para a despesa:{' '}
              <span className="font-medium">{expense.description}</span>
              <br />
              Valor original: <span className="font-medium">{formatCurrency(expense.amount)}</span>
            </DialogDescription>
          </DialogHeader>

          {isViewMode ? (
            <Tabs defaultValue="comprovante" className="w-full" data-testid="view-mode-content">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comprovante">Comprovante</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="comprovante" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Data do Pagamento</Label>
                  <p className="text-sm font-medium" data-testid="payment-date-value">
                    {formattedPaymentDate}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Comprovante de Pagamento</Label>
                  <PaymentProofDisplay
                    proofUrl={expense.paymentProofUrl}
                    onImageClick={
                      expense.paymentProofUrl
                        ? () => setViewerImageUrl(expense.paymentProofUrl)
                        : undefined
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="documentos" className="mt-4">
                <ExpenseDocumentsView
                  serviceInvoiceUrl={expense.serviceInvoiceUrl}
                  bankBillUrl={expense.bankBillUrl}
                  onViewImage={setViewerImageUrl}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {isSuccess && (
                <div
                  className="flex flex-col items-center justify-center py-8"
                  data-testid="success-state"
                >
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-center">Pagamento Registrado!</p>
                </div>
              )}

              {!isSuccess && (
                <FormProvider {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <Tabs defaultValue="pagamento" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
                        <TabsTrigger value="documentos">Documentos</TabsTrigger>
                      </TabsList>

                      <TabsContent value="pagamento" className="mt-4">
                        <PaymentFormFields disabled={isSubmitting} />
                      </TabsContent>

                      <TabsContent value="documentos" className="mt-4">
                        <ExpenseDocumentsView
                          serviceInvoiceUrl={expense.serviceInvoiceUrl}
                          bankBillUrl={expense.bankBillUrl}
                          onViewImage={setViewerImageUrl}
                        />
                      </TabsContent>
                    </Tabs>

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
            </>
          )}

          {isViewMode && (
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} data-testid="close-view-button">
                Fechar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <PaymentProofViewer
        isOpen={viewerImageUrl !== null}
        imageUrl={viewerImageUrl ?? ''}
        fileName={viewerImageUrl?.split('/').pop()}
        onClose={() => setViewerImageUrl(null)}
      />
    </>
  );
}
