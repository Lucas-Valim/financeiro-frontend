import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagePreview } from '@/components/payment/ImagePreview';

interface FileUploadProps {
  id: string;
  value: File | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  acceptedTypes: readonly string[];
  maxSize: number;
  allowedTypesDisplay?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

function formatMaxSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb}MB`;
}

export function FileUpload({
  id,
  value,
  onChange,
  onRemove,
  acceptedTypes,
  maxSize,
  allowedTypesDisplay,
  disabled = false,
  error,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const displayTypes = allowedTypesDisplay || acceptedTypes
    .map(type => type.split('/')[1]?.toUpperCase() || type)
    .join(', ');

  const handleFileValidation = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type as typeof acceptedTypes[number])) {
        return `Tipo de arquivo inválido. Permitidos: ${displayTypes}`;
      }

      if (file.size > maxSize) {
        return `Arquivo muito grande. Tamanho máximo: ${formatMaxSize(maxSize)}`;
      }

      return null;
    },
    [acceptedTypes, maxSize, displayTypes]
  );

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      const validationErrorMsg = handleFileValidation(file);

      if (validationErrorMsg) {
        setValidationError(validationErrorMsg);
        onChange(null);
        return;
      }

      setValidationError(null);
      onChange(file);
    },
    [handleFileValidation, onChange]
  );

  const handleRemove = useCallback(() => {
    setValidationError(null);
    onChange(null);
    onRemove?.();
  }, [onChange, onRemove]);

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

      if (disabled) {
        return;
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files);
      }
    },
    [handleFileChange, disabled]
  );

  const displayError = error || validationError;

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
          dragActive && 'border-primary bg-primary/5',
          !dragActive && !displayError && 'border-input hover:border-primary/50',
          displayError && 'border-destructive',
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
          accept={acceptedTypes.join(',')}
          disabled={disabled}
          className="hidden"
          id={id}
          onChange={(e) => handleFileChange(e.target.files)}
          data-testid="file-input"
        />
        <label
          htmlFor={id}
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
            {displayTypes} (máx. {formatMaxSize(maxSize)})
          </span>
        </label>
      </div>

      {displayError && (
        <p className="text-sm text-destructive" data-testid="file-error">
          {displayError}
        </p>
      )}

      {value && (
        <ImagePreview
          file={value}
          onRemove={handleRemove}
          disabled={disabled}
        />
      )}
    </div>
  );
}
