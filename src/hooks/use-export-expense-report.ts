import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportsApiService } from '../api/reports-api';
import { downloadFile } from '../lib/download-file';
import type { ExpenseReportExport, ReportFilter } from '../types/reports';

const EXPORT_ERROR_FALLBACK = 'Não foi possível exportar o relatório. Tente novamente.';

interface UseExportExpenseReportReturn {
  exportReport: (filters: ReportFilter) => void;
  isExporting: boolean;
  receivedBytes: number;
}

/**
 * Drives the report export: streams the bundle, triggers the download with the
 * server-provided file name, and surfaces the resolved error message as a toast.
 *
 * `isExporting` blocks repeated clicks and `receivedBytes` (fed by axios'
 * `onDownloadProgress`) powers the live "X MB received" text. The filter state
 * lives on the page, not here, so a failed export never loses it.
 */
export function useExportExpenseReport(): UseExportExpenseReportReturn {
  const [receivedBytes, setReceivedBytes] = useState(0);

  const mutation = useMutation<ExpenseReportExport, Error, ReportFilter>({
    mutationFn: (filters) =>
      reportsApiService.exportExpenses(filters, setReceivedBytes),
    onSuccess: ({ blob, filename }) => downloadFile(blob, filename),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : EXPORT_ERROR_FALLBACK),
    onSettled: () => setReceivedBytes(0),
  });

  const exportReport = useCallback(
    (filters: ReportFilter) => {
      if (mutation.isPending) {
        return;
      }
      mutation.mutate(filters);
    },
    [mutation]
  );

  return {
    exportReport,
    isExporting: mutation.isPending,
    receivedBytes,
  };
}
