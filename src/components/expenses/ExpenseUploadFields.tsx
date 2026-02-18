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
}

export function ExpenseUploadFields({ disabled = false }: ExpenseUploadFieldsProps) {
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
    <div className="space-y-4">
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
                acceptedTypes={EXPENSE_FILE_ALLOWED_TYPES}
                maxSize={EXPENSE_FILE_MAX_SIZE}
                allowedTypesDisplay={EXPENSE_FILE_ALLOWED_TYPES_DISPLAY}
                disabled={disabled}
                error={form.formState.errors.serviceInvoice?.message}
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
                acceptedTypes={EXPENSE_FILE_ALLOWED_TYPES}
                maxSize={EXPENSE_FILE_MAX_SIZE}
                allowedTypesDisplay={EXPENSE_FILE_ALLOWED_TYPES_DISPLAY}
                disabled={disabled}
                error={form.formState.errors.bankBill?.message}
              />
            </FormControl>
            <FormMessage id="bankBill-error" />
          </FormItem>
        )}
      />
    </div>
  );
}
