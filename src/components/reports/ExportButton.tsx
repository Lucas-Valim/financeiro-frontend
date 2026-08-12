import { useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExpenseReportSummary } from '@/types/reports';

export interface ExportButtonProps {
  summary: ExpenseReportSummary | undefined;
  isExporting: boolean;
  receivedBytes: number;
  onExport: () => void;
}

const BYTES_PER_UNIT = 1024;
const BYTE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

function formatBytes(bytes: number): string {
  if (bytes < BYTES_PER_UNIT) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / BYTES_PER_UNIT;
  if (kilobytes < BYTES_PER_UNIT) {
    return `${BYTE_FORMATTER.format(kilobytes)} KB`;
  }
  return `${BYTE_FORMATTER.format(kilobytes / BYTES_PER_UNIT)} MB`;
}

/**
 * Resolves why the export is unavailable, in the order the guards fire: an
 * empty selection first, then the cap. The cap text always reads the limit from
 * the summary, never a literal. Returns null when the export is available.
 */
function resolveDisabledReason(
  summary: ExpenseReportSummary | undefined
): string | null {
  if (!summary || summary.expenseCount === 0) {
    return 'Nenhuma despesa no período selecionado. Ajuste os filtros para exportar.';
  }
  if (summary.exceedsLimit) {
    return `A exportação está limitada a ${summary.exportLimit} despesas. Ajuste o período ou os filtros para continuar.`;
  }
  return null;
}

/**
 * The single export action. It is blocked with an explanation on an empty
 * selection and above the cap, and it is blocked against repeated clicks while
 * an export is in flight. During the export the button carries `aria-busy` and
 * an `aria-live="polite"` region announces the state: a spinner-only "gerando"
 * phase, then a live byte counter once the transfer starts.
 */
export function ExportButton({
  summary,
  isExporting,
  receivedBytes,
  onExport,
}: ExportButtonProps) {
  const disabledReason = resolveDisabledReason(summary);
  const canExport = disabledReason === null;
  const isDisabled = !canExport || isExporting;

  const handleClick = useCallback(() => {
    if (isExporting || !canExport) {
      return;
    }
    onExport();
  }, [isExporting, canExport, onExport]);

  const progressText =
    receivedBytes > 0
      ? `${formatBytes(receivedBytes)} recebidos`
      : 'Gerando o pacote. Isso pode levar alguns instantes...';

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        onClick={handleClick}
        disabled={isDisabled}
        aria-busy={isExporting}
        data-testid="export-button"
        className="flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Exportar XLSX
          </>
        )}
      </Button>

      {isExporting && (
        <p
          role="status"
          aria-live="polite"
          data-testid="export-status"
          className="text-sm text-muted-foreground"
        >
          {progressText}
        </p>
      )}

      {!isExporting && disabledReason && (
        <p
          data-testid="export-explanation"
          className="text-sm text-muted-foreground"
        >
          {disabledReason}
        </p>
      )}
    </div>
  );
}
