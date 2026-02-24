import { useState, useCallback, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  file?: File | null;
  imageUrl?: string | null;
  fileName?: string;
  displayName?: string;
  onRemove: () => void;
  className?: string;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtensionFromUrl(url: string): string {
  const pathname = url.split('?')[0];
  const ext = pathname.split('.').pop()?.toLowerCase();
  if (ext === 'jpg') return 'image/jpeg';
  if (ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'pdf') return 'application/pdf';
  return ext || 'unknown';
}

function isImageType(type: string): boolean {
  return type.startsWith('image/');
}

export function ImagePreview({
  file,
  imageUrl,
  fileName,
  displayName: label,
  onRemove,
  className,
  disabled = false,
}: ImagePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [lastSourceKey, setLastSourceKey] = useState<string | null>(null);

  const fileExtension = imageUrl ? getFileExtensionFromUrl(imageUrl) : null;
  const isImage = file
    ? isImageType(file.type)
    : imageUrl
      ? isImageType(fileExtension || '')
      : false;

  const previewUrl = blobUrl || imageUrl;
  const sourceKey = file?.name || imageUrl || null;

  // Create and manage blob URL for file previews
  useEffect(() => {
    let url: string | null = null;

    // Only create blob URL if we have a file and it's an image
    if (!imageUrl && file && isImage) {
      url = URL.createObjectURL(file);
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setBlobUrl(url);
    }

    // Cleanup function - always revoke the URL created in this effect
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file, isImage, imageUrl]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleRemove = useCallback(() => {
    setBlobUrl(null);
    setImageError(false);
    setLastSourceKey(null);
    onRemove();
  }, [onRemove]);

  const sourceChanged = lastSourceKey !== sourceKey;
  const showImageError = !sourceChanged && imageError;

  if (!file && !imageUrl) {
    return null;
  }

  const displayName = label || file?.name || fileName || 'Unknown file';
  const displaySize = file ? formatFileSize(file.size) : 'Arquivo existente';
  const displayType = file?.type || fileExtension || 'Unknown type';

  return (
    <div
      className={cn(
        'relative rounded-lg border border-input bg-muted/30 p-2 overflow-hidden',
        className
      )}
      data-testid="image-preview-container"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1 h-6 w-6 p-0 z-10 bg-background/80 hover:bg-background"
        onClick={handleRemove}
        disabled={disabled}
        aria-label="Remove file"
        data-testid="remove-file-button"
      >
        <X className="h-3 w-3" />
      </Button>

      <div className="flex items-center gap-2.5 overflow-hidden">
        {showImageError ? (
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-destructive/10 flex-shrink-0">
            <span className="text-xs text-destructive text-center p-1">
              Error
            </span>
          </div>
        ) : isImage && previewUrl ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted flex-shrink-0">
            <img
              key={sourceKey}
              src={previewUrl}
              alt={displayName}
              className="h-full w-full object-cover"
              data-testid="preview-image"
              onLoad={() => setLastSourceKey(sourceKey)}
              onError={handleImageError}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-muted flex-shrink-0">
            <FileText className="h-6 w-6 text-muted-foreground" data-testid="pdf-icon" />
          </div>
        )}

        <div className="flex-1 min-w-0 flex-shrink pr-5">
          <p
            className="text-sm font-medium truncate"
            title={displayName}
            data-testid="file-name"
          >
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate" data-testid="file-info">
            {displaySize} • {displayType}
          </p>
        </div>
      </div>
    </div>
  );
}
