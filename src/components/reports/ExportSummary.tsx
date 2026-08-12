import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, Paperclip, Receipt, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatCurrency';
import type { ExpenseReportSummary } from '@/types/reports';

export interface ExportSummaryProps {
  summary: ExpenseReportSummary | undefined;
  isLoading: boolean;
}

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  testId: string;
  highlight?: boolean;
}

function MetricCard({ icon: Icon, label, value, testId, highlight }: MetricCardProps) {
  return (
    <Card className={highlight ? 'border-destructive/50' : undefined}>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm">{label}</span>
        </div>
        <span className="text-2xl font-bold" data-testid={testId}>
          {value}
        </span>
      </CardContent>
    </Card>
  );
}

/**
 * Pre-export summary: the four figures the client checks before committing to
 * the export — expense count, total amount, attachment count and the count of
 * expenses with no attachment at all. It also raises two text-first advisories:
 * a missing-attachment alert (only when that count is above zero) and a
 * cap-exceeded warning that reports how many expenses were found against the
 * server-provided `exportLimit`. Neither advisory suggests or applies an
 * alternative selection — the screen only informs.
 */
export function ExportSummary({ summary, isLoading }: ExportSummaryProps) {
  if (isLoading || !summary) {
    return (
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        data-testid="loading-state"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const {
    expenseCount,
    totalAmount,
    attachmentCount,
    expensesWithoutAttachments,
    exportLimit,
    exceedsLimit,
  } = summary;

  return (
    <div className="space-y-3" data-testid="export-summary">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={Receipt}
          label="Despesas"
          value={String(expenseCount)}
          testId="summary-expense-count"
        />
        <MetricCard
          icon={Wallet}
          label="Valor total"
          value={formatCurrency(totalAmount)}
          testId="summary-total-amount"
        />
        <MetricCard
          icon={Paperclip}
          label="Comprovantes"
          value={String(attachmentCount)}
          testId="summary-attachment-count"
        />
        <MetricCard
          icon={AlertCircle}
          label="Sem comprovante"
          value={String(expensesWithoutAttachments)}
          testId="summary-without-attachments"
          highlight={expensesWithoutAttachments > 0}
        />
      </div>

      {expensesWithoutAttachments > 0 && (
        <div
          role="alert"
          data-testid="no-attachments-alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/50 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold">
              {expensesWithoutAttachments}{' '}
              {expensesWithoutAttachments === 1
                ? 'despesa sem nenhum comprovante'
                : 'despesas sem nenhum comprovante'}
            </p>
            <p className="text-sm text-muted-foreground">
              Estas despesas entrarão no pacote sem qualquer arquivo anexado.
              Revise-as antes de enviar o relatório para a contabilidade.
            </p>
          </div>
        </div>
      )}

      {exceedsLimit && (
        <div
          role="alert"
          data-testid="limit-warning"
          className="flex items-start gap-3 rounded-lg border border-destructive/50 p-4"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold">
              Foram encontradas {expenseCount} despesas, acima do limite de{' '}
              {exportLimit} por exportação.
            </p>
            <p className="text-sm text-muted-foreground">
              Ajuste o período ou os filtros para reduzir a seleção antes de
              exportar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
