import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { CalendarIcon, Upload } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImagePreview } from './ImagePreview';
import {
  PaymentFormData,
  PAYMENT_PROOF_ALLOWED_TYPES,
  PAYMENT_PROOF_MAX_SIZE,
} from '@/schemas/payment-schema';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

const ALLOWED_TYPES_DISPLAY = 'PDF, PNG, JPG, JPEG, GIF, WebP';
const MAX_SIZE_MB = PAYMENT_PROOF_MAX_SIZE / (1024 * 1024);

interface PaymentFormFieldsProps {
  disabled?: boolean;
}

export function PaymentFormFields({
  disabled = false,
}: PaymentFormFieldsProps) {
  const form = useFormContext<PaymentFormData>();
  const [dragActive, setDragActive] = useState(false);

  const paymentProof = form.watch('paymentProof');

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];

      if (!PAYMENT_PROOF_ALLOWED_TYPES.includes(file.type as typeof PAYMENT_PROOF_ALLOWED_TYPES[number])) {
        form.setError('paymentProof', {
          type: 'manual',
          message: `Tipo de arquivo inválido. Permitidos: ${ALLOWED_TYPES_DISPLAY}`,
        });
        return;
      }

      if (file.size > PAYMENT_PROOF_MAX_SIZE) {
        form.setError('paymentProof', {
          type: 'manual',
          message: `Arquivo muito grande. Tamanho máximo: ${MAX_SIZE_MB}MB`,
        });
        return;
      }

      form.clearErrors('paymentProof');
      form.setValue('paymentProof', file, { shouldValidate: true, shouldDirty: true });
    },
    [form]
  );

  const handleFileRemove = useCallback(() => {
    form.setValue('paymentProof', null, { shouldValidate: true, shouldDirty: true });
  }, [form]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files);
      }
    },
    [handleFileChange]
  );

  return (
    <div className="space-y-4">
      {/* Payment Date Field */}
      <FormField
        control={form.control}
        name="paymentDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Data do Pagamento</FormLabel>
            <FormControl>
              <ReactDatePicker
                selected={field.value}
                onChange={(date: Date | null) => field.onChange(date)}
                onBlur={field.onBlur}
                disabled={disabled}
                // locale="pt-BR"
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecione a data"
                maxDate={new Date()}
                className={cn(
                  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                  form.formState.errors.paymentDate && 'border-destructive'
                )}
                wrapperClassName="w-full"
                customInput={
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground',
                      form.formState.errors.paymentDate && 'border-destructive'
                    )}
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecione a data'}
                  </Button>
                }
              />
            </FormControl>
            <FormMessage id="paymentDate-error" />
          </FormItem>
        )}
      />

      {/* Payment Proof File Upload */}
      <FormField
        control={form.control}
        name="paymentProof"
        render={({ field: controllerField }) => (
          <FormItem>
            <FormLabel>Comprovante de Pagamento</FormLabel>
            <FormControl>
              <div className="space-y-3">
                {/* File drop zone */}
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
                    dragActive && 'border-primary bg-primary/5',
                    !dragActive && 'border-input hover:border-primary/50',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  data-testid="file-drop-zone"
                >
                <input
                  type="file"
                  accept={PAYMENT_PROOF_ALLOWED_TYPES.join(',')}
                  disabled={disabled}
                  className="hidden"
                  id="payment-proof-input"
                  onChange={(e) => handleFileChange(e.target.files)}
                  data-testid="file-input"
                  ref={controllerField.ref}
                  name={controllerField.name}
                  onBlur={controllerField.onBlur}
                />
                  <label
                    htmlFor="payment-proof-input"
                    className={cn(
                      'cursor-pointer flex flex-col items-center gap-2',
                      disabled && 'cursor-not-allowed'
                    )}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Arraste um arquivo ou clique para selecionar
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ALLOWED_TYPES_DISPLAY} (máx. {MAX_SIZE_MB}MB)
                    </span>
                  </label>
                </div>

                {/* Image preview */}
                {paymentProof && (
                  <ImagePreview
                    file={paymentProof}
                    onRemove={handleFileRemove}
                    disabled={disabled}
                  />
                )}
              </div>
            </FormControl>
            <FormMessage id="paymentProof-error" />
          </FormItem>
        )}
      />
    </div>
  );
}
