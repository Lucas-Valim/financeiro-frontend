'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PaymentProofViewerProps {
  isOpen: boolean;
  imageUrl: string;
  fileName?: string;
  onClose: () => void;
}

export function PaymentProofViewer({
  isOpen,
  imageUrl,
  fileName,
  onClose,
}: PaymentProofViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [isOpen, onClose]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center pointer-events-auto"
      onClick={handleBackdropClick}
      data-testid="viewer-overlay"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-[70] text-white hover:bg-white/10"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        data-testid="close-button"
      >
        <X className="h-6 w-6" />
      </Button>

      {isLoading && (
        <Loader2
          className="h-8 w-8 animate-spin text-white absolute"
          data-testid="loading-spinner"
        />
      )}

      <img
        key={imageUrl}
        src={imageUrl}
        alt={fileName || 'Comprovante'}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onLoad={handleImageLoad}
        onClick={(e) => e.stopPropagation()}
        data-testid="viewer-image"
      />
    </div>
  );
}
