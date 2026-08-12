import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useExportExpenseReport } from '../use-export-expense-report';
import type { ExpenseReportExport } from '../../types/reports';

const mockExportExpenses = vi.hoisted(() => vi.fn());
const mockDownloadFile = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock('../../api/reports-api', () => ({
  reportsApiService: {
    exportExpenses: mockExportExpenses,
    fetchSummary: vi.fn(),
  },
}));

vi.mock('../../lib/download-file', () => ({
  downloadFile: mockDownloadFile,
}));

vi.mock('sonner', () => ({
  toast: { error: mockToastError },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const exportResult: ExpenseReportExport = {
  blob: new Blob(['zip-bytes']),
  filename: 'resumo_contabilidade_08-2026.zip',
};

describe('useExportExpenseReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads the blob with the server filename on success', async () => {
    mockExportExpenses.mockResolvedValue(exportResult);
    const { result } = renderHook(() => useExportExpenseReport(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.exportReport({}));

    await waitFor(() => {
      expect(mockDownloadFile).toHaveBeenCalledWith(
        exportResult.blob,
        exportResult.filename
      );
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('toasts the resolved message and skips the download on error', async () => {
    const message = 'A exportação está limitada a 100 despesas. Os filtros atuais retornaram 137.';
    mockExportExpenses.mockRejectedValue(new Error(message));
    const { result } = renderHook(() => useExportExpenseReport(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.exportReport({}));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(message);
    });
    expect(mockDownloadFile).not.toHaveBeenCalled();
  });

  it('flips isExporting to true during the mutation and back to false on success', async () => {
    let resolveExport: (() => void) | undefined;
    mockExportExpenses.mockImplementation(
      () => new Promise<ExpenseReportExport>((resolve) => {
        resolveExport = () => resolve(exportResult);
      })
    );
    const { result } = renderHook(() => useExportExpenseReport(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.exportReport({}));
    await waitFor(() => expect(result.current.isExporting).toBe(true));

    act(() => resolveExport?.());
    await waitFor(() => expect(result.current.isExporting).toBe(false));
  });

  it('flips isExporting back to false on error', async () => {
    let rejectExport: (() => void) | undefined;
    mockExportExpenses.mockImplementation(
      () => new Promise<ExpenseReportExport>((_resolve, reject) => {
        rejectExport = () => reject(new Error('falha'));
      })
    );
    const { result } = renderHook(() => useExportExpenseReport(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.exportReport({}));
    await waitFor(() => expect(result.current.isExporting).toBe(true));

    act(() => rejectExport?.());
    await waitFor(() => expect(result.current.isExporting).toBe(false));
  });

  it('tracks onDownloadProgress via receivedBytes and resets on settle', async () => {
    let resolveExport: (() => void) | undefined;
    mockExportExpenses.mockImplementation(
      (_filters: unknown, onProgress: (bytes: number) => void) =>
        new Promise<ExpenseReportExport>((resolve) => {
          onProgress(2048);
          resolveExport = () => resolve(exportResult);
        })
    );
    const { result } = renderHook(() => useExportExpenseReport(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.exportReport({}));
    await waitFor(() => expect(result.current.receivedBytes).toBe(2048));

    act(() => resolveExport?.());
    await waitFor(() => expect(result.current.receivedBytes).toBe(0));
  });

  it('does not trigger a second export while the first is still pending', async () => {
    let resolveExport: (() => void) | undefined;
    mockExportExpenses.mockImplementation(
      () => new Promise<ExpenseReportExport>((resolve) => {
        resolveExport = () => resolve(exportResult);
      })
    );
    const { result } = renderHook(() => useExportExpenseReport(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.exportReport({}));
    await waitFor(() => expect(result.current.isExporting).toBe(true));

    act(() => result.current.exportReport({}));
    expect(mockExportExpenses).toHaveBeenCalledTimes(1);

    act(() => resolveExport?.());
    await waitFor(() => expect(mockDownloadFile).toHaveBeenCalledTimes(1));
  });
});
