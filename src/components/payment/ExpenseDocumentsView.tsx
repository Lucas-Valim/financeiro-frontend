'use client';

import { Label } from '@/components/ui/label';
import { PaymentProofDisplay } from './PaymentProofDisplay';

export interface ExpenseDocumentsViewProps {
  /** URL of the attached service invoice (Nota de Serviço), if any */
  serviceInvoiceUrl: string | null;
  /** URL of the attached bank bill (Boleto), if any */
  bankBillUrl: string | null;
  /** Called when an image document is clicked, to open the fullscreen viewer */
  onViewImage: (url: string) => void;
}

/**
 * Read-only view of the documents attached to an expense (Nota de Serviço and Boleto).
 * Reuses PaymentProofDisplay for empty/image/PDF handling. Images open the fullscreen
 * viewer via onViewImage; PDFs are opened in a new tab by PaymentProofDisplay itself.
 */
export function ExpenseDocumentsView({
  serviceInvoiceUrl,
  bankBillUrl,
  onViewImage,
}: ExpenseDocumentsViewProps) {
  return (
    <div className="space-y-4" data-testid="expense-documents-view">
      <div className="space-y-2">
        <Label>Nota de Serviço</Label>
        <PaymentProofDisplay
          proofUrl={serviceInvoiceUrl}
          onImageClick={serviceInvoiceUrl ? () => onViewImage(serviceInvoiceUrl) : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label>Boleto</Label>
        <PaymentProofDisplay
          proofUrl={bankBillUrl}
          onImageClick={bankBillUrl ? () => onViewImage(bankBillUrl) : undefined}
        />
      </div>
    </div>
  );
}
