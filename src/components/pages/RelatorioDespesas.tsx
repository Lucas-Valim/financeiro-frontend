import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { PageCard } from '@/components/shared/PageCard';
import { Button } from '@/components/ui/button';
import { ReportFilterPanel } from '@/components/reports/ReportFilterPanel';
import { ExportSummary } from '@/components/reports/ExportSummary';
import { ExportButton } from '@/components/reports/ExportButton';
import { useExpenseReportSummary } from '@/hooks/use-expense-report-summary';
import { useExportExpenseReport } from '@/hooks/use-export-expense-report';
import { getDefaultReportFilters } from '@/constants/reports';
import type { ReportFilter } from '@/types/reports';

const PAGE_TITLE = 'Relatório de Despesas';
const PAGE_DESCRIPTION =
  'Gere o pacote mensal de despesas para a contabilidade';

/**
 * Report screen. It owns the filter state — so a failed export never loses it —
 * and wires the grouped filter panel, the live pre-export summary and the
 * single export action to the report hooks. It opens with the current month and
 * no status filter, ready to export without any configuration.
 */
export function RelatorioDespesas() {
  const [filters, setFilters] = useState<ReportFilter>(getDefaultReportFilters);
  const queryClient = useQueryClient();

  const { summary, isLoading, error } = useExpenseReportSummary(filters);
  const { exportReport, isExporting, receivedBytes } = useExportExpenseReport();

  const handleFiltersChange = useCallback((next: ReportFilter) => {
    setFilters(next);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(getDefaultReportFilters());
  }, []);

  const handleExport = useCallback(() => {
    exportReport(filters);
  }, [exportReport, filters]);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['expense-report-summary'] });
  }, [queryClient]);

  if (error && !isLoading) {
    return (
      <PageCard title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
        <div
          className="flex flex-col items-center justify-center p-8 text-center"
          data-testid="error-state"
        >
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Erro ao carregar o resumo
          </h3>
          <p className="text-muted-foreground mb-4">
            {error.message ||
              'Ocorreu um erro inesperado ao carregar o resumo do relatório'}
          </p>
          <Button onClick={handleRetry} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <ReportFilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />

        <ExportSummary summary={summary} isLoading={isLoading} />

        <ExportButton
          summary={summary}
          isExporting={isExporting}
          receivedBytes={receivedBytes}
          onExport={handleExport}
        />
      </div>
    </PageCard>
  );
}
