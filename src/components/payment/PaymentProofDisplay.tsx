'use client';

import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PaymentProofDisplayProps {
  proofUrl: string | null;
  onImageClick?: () => void;
  className?: string;
}

function getFileTypeFromUrl(url: string): 'image' | 'pdf' | 'unknown' {
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
  if (imageExtensions.includes(extension || '')) return 'image';
  if (extension === 'pdf') return 'pdf';
  return 'unknown';
}

function getFileNameFromUrl(url: string): string {
  return url.split('/').pop()?.split('?')[0] || 'Arquivo';
}

export function PaymentProofDisplay({
  proofUrl,
  onImageClick,
  className = '',
}: PaymentProofDisplayProps) {
  if (proofUrl === null || proofUrl === undefined) {
    return (
      <div className={`rounded-lg border border-input bg-muted/30 p-3 ${className}`}>
        <p className="text-sm text-muted-foreground">
          Nenhum comprovante anexado
        </p>
      </div>
    );
  }

  const fileType = getFileTypeFromUrl(proofUrl);
  const fileName = getFileNameFromUrl(proofUrl);

  if (fileType === 'image') {
    return (
      <div className={`rounded-lg border border-input bg-muted/30 p-3 ${className}`}>
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onImageClick}
          data-testid="image-container"
        >
          <img
            src={proofUrl}
            alt="Comprovante"
            className="h-32 rounded-md"
            data-testid="proof-image"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Clique para expandir
          </p>
        </div>
      </div>
    );
  }

  if (fileType === 'pdf') {
    return (
      <div className={`rounded-lg border border-input bg-muted/30 p-3 ${className}`}>
        <div className="flex items-center gap-3">
          <FileText className="h-12 w-12 text-muted-foreground" data-testid="pdf-icon" />
          <div>
            <p className="text-sm font-medium" data-testid="file-name">{fileName}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(proofUrl, '_blank')}
              data-testid="open-pdf-button"
            >
              Abrir PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-input bg-muted/30 p-3 ${className}`}>
      <p className="text-sm text-muted-foreground">
        Nenhum comprovante anexado
      </p>
    </div>
  );
}
