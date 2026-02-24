import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { FileUpload } from '@/components/ui/file-upload';
import {
  EXPENSE_FILE_ALLOWED_TYPES,
  EXPENSE_FILE_MAX_SIZE,
  EXPENSE_FILE_ALLOWED_TYPES_DISPLAY,
  type ExpenseFormData,
} from '@/schemas/expense-form-schema';

interface ExpenseUploadFieldsProps {
  disabled?: boolean;
  existingServiceInvoiceUrl?: string | null;
  existingBankBillUrl?: string | null;
  onClearServiceInvoice?: () => void;
  onClearBankBill?: () => void;
}

export function ExpenseUploadFields({
  disabled = false,
  existingServiceInvoiceUrl,
  existingBankBillUrl,
  onClearServiceInvoice,
  onClearBankBill,
}: ExpenseUploadFieldsProps) {
  const form = useFormContext<ExpenseFormData>();

  const handleServiceInvoiceChange = useCallback(
    (file: File | null) => {
      form.setValue('serviceInvoice', file, { 
        shouldValidate: true, 
        shouldDirty: true 
      });
    },
    [form]
  );

  const handleBankBillChange = useCallback(
    (file: File | null) => {
      form.setValue('bankBill', file, { 
        shouldValidate: true, 
        shouldDirty: true 
      });
    },
    [form]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="serviceInvoice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nota de Serviço</FormLabel>
            <FormControl>
              <FileUpload
                id="service-invoice-upload"
                value={field.value ?? null}
                onChange={handleServiceInvoiceChange}
                existingUrl={existingServiceInvoiceUrl}
                onClearExisting={onClearServiceInvoice}
                acceptedTypes={EXPENSE_FILE_ALLOWED_TYPES}
                maxSize={EXPENSE_FILE_MAX_SIZE}
                allowedTypesDisplay={EXPENSE_FILE_ALLOWED_TYPES_DISPLAY}
                disabled={disabled}
                error={form.formState.errors.serviceInvoice?.message}
                documentLabel="Nota de Serviço"
              />
            </FormControl>
            <FormMessage id="serviceInvoice-error" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="bankBill"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Boleto</FormLabel>
            <FormControl>
              <FileUpload
                id="bank-bill-upload"
                value={field.value ?? null}
                onChange={handleBankBillChange}
                existingUrl={existingBankBillUrl}
                onClearExisting={onClearBankBill}
                acceptedTypes={EXPENSE_FILE_ALLOWED_TYPES}
                maxSize={EXPENSE_FILE_MAX_SIZE}
                allowedTypesDisplay={EXPENSE_FILE_ALLOWED_TYPES_DISPLAY}
                disabled={disabled}
                error={form.formState.errors.bankBill?.message}
                documentLabel="Boleto"
              />
            </FormControl>
            <FormMessage id="bankBill-error" />
          </FormItem>
        )}
      />
    </div>
  );
}
