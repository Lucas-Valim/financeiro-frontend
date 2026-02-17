import { useState, useCallback, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  /** The file to preview */
  file: File | null;
  /** Callback to remove the file */
  onRemove: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the preview is disabled */
  disabled?: boolean;
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Component for displaying image previews with file type detection
 * Shows image preview for image files, PDF icon for PDF files
 * Includes remove functionality
 */
export function ImagePreview({
  file,
  onRemove,
  className,
  disabled = false,
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Check if file is an image type
  const isImage = file?.type.startsWith('image/');

  // Generate preview URL for images using effect
  useEffect(() => {
    // Reset error state when file changes
    setImageError(false);

    // Clean up previous URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!file || !isImage) {
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Cleanup on unmount or when file changes
    return () => {
      URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, isImage]);

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setImageError(false);
    onRemove();
  }, [previewUrl, onRemove]);

  if (!file) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border border-input bg-muted/30 p-3',
        className
      )}
      data-testid="image-preview-container"
    >
      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1 h-7 w-7 p-0 z-10 bg-background/80 hover:bg-background"
        onClick={handleRemove}
        disabled={disabled}
        aria-label="Remove file"
        data-testid="remove-file-button"
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Preview content */}
      <div className="flex items-start gap-3">
        {imageError ? (
          <div className="flex items-center justify-center h-20 w-20 rounded-md bg-destructive/10">
            <span className="text-xs text-destructive text-center p-1">
              Failed to load image
            </span>
          </div>
        ) : isImage && previewUrl ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted">
            <img
              src={previewUrl}
              alt={file.name}
              className="h-full w-full object-cover"
              data-testid="preview-image"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 w-20 rounded-md bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" data-testid="pdf-icon" />
          </div>
        )}

        {/* File info */}
        <div className="flex-1 min-w-0 pr-6">
          <p
            className="text-sm font-medium truncate"
            title={file.name}
            data-testid="file-name"
          >
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground" data-testid="file-size">
            {formatFileSize(file.size)}
          </p>
          <p className="text-xs text-muted-foreground" data-testid="file-type">
            {file.type || 'Unknown type'}
          </p>
        </div>
      </div>
    </div>
  );
}
