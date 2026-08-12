import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { ReportsApiService } from '../reports-api';
import { EXPORT_TIMEOUT_MS } from '../../constants/reports';
import { ExpenseStatus } from '../../constants/expenses';

// jsdom's Blob lacks `text()`, which browsers provide and the export error path
// relies on. Polyfill it via FileReader so the test exercises the real code.
beforeAll(() => {
  if (typeof Blob.prototype.text !== 'function') {
    Blob.prototype.text = function readAsText(this: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(this);
      });
    };
  }
});

const mockApiGet = vi.hoisted(() => vi.fn());

vi.mock('../../lib/api-client', () => ({
  apiClient: { get: mockApiGet },
  injectOrganizationId: (config: unknown) => config,
}));

function buildAxiosError(status: number, blob: Blob): AxiosError {
  return new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    undefined,
    undefined,
    { status, data: blob } as AxiosResponse
  );
}

function createService(mockGet: ReturnType<typeof vi.fn>): ReportsApiService {
  const exportClient = { get: mockGet } as unknown as AxiosInstance;
  return new ReportsApiService(exportClient);
}

describe('ReportsApiService.fetchSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the summary endpoint with the converted filters', async () => {
    const summary = {
      expenseCount: 42,
      totalAmount: 12480,
      attachmentCount: 97,
      expensesWithoutAttachments: 3,
      exportLimit: 100,
      exceedsLimit: false,
    };
    mockApiGet.mockResolvedValue(summary);
    const dueDateStart = new Date('2026-08-01T00:00:00.000Z');

    const result = await createService(vi.fn()).fetchSummary({ dueDateStart });

    expect(mockApiGet).toHaveBeenCalledWith('/reports/expenses/summary', {
      params: { dueDateStart: dueDateStart.toISOString() },
    });
    expect(result).toEqual(summary);
  });
});

describe('ReportsApiService.exportExpenses', () => {
  const zipBlob = new Blob(['zip-bytes'], { type: 'application/zip' });

  it("sends responseType 'blob' and the export timeout", async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: zipBlob, headers: {} });

    await createService(mockGet).exportExpenses({});

    expect(mockGet).toHaveBeenCalledWith(
      '/reports/expenses/export',
      expect.objectContaining({
        responseType: 'blob',
        timeout: EXPORT_TIMEOUT_MS,
      })
    );
  });

  it('extracts the filename from content-disposition', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      data: zipBlob,
      headers: {
        'content-disposition':
          'attachment; filename="resumo_contabilidade_08-2026.zip"',
      },
    });

    const result = await createService(mockGet).exportExpenses({});

    expect(result.filename).toBe('resumo_contabilidade_08-2026.zip');
    expect(result.blob).toBe(zipBlob);
  });

  it('propagates the limit-exceeded 422 message, not "Error 422"', async () => {
    const message =
      'A exportação está limitada a 100 despesas. Os filtros atuais retornaram 137.';
    const errorBlob = new Blob([JSON.stringify({ message })]);
    const mockGet = vi.fn().mockRejectedValue(buildAxiosError(422, errorBlob));

    await expect(createService(mockGet).exportExpenses({})).rejects.toThrow(message);
  });

  it('propagates the empty-selection 422 message', async () => {
    const message = 'Nenhuma despesa encontrada para os filtros selecionados.';
    const errorBlob = new Blob([JSON.stringify({ message })]);
    const mockGet = vi.fn().mockRejectedValue(buildAxiosError(422, errorBlob));

    await expect(createService(mockGet).exportExpenses({})).rejects.toThrow(message);
  });

  it('converts Date filters to the query format and omits empty fields', async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: zipBlob, headers: {} });
    const dueDateStart = new Date('2026-08-01T00:00:00.000Z');

    await createService(mockGet).exportExpenses({
      dueDateStart,
      status: ExpenseStatus.OPEN,
      receiver: '',
      categoryId: undefined,
    });

    expect(mockGet.mock.calls[0][1].params).toEqual({
      dueDateStart: dueDateStart.toISOString(),
      status: ExpenseStatus.OPEN,
    });
  });

  it('feeds onDownloadProgress bytes to the progress callback', async () => {
    const mockGet = vi.fn().mockImplementation((_path, config) => {
      config.onDownloadProgress({ loaded: 2048 });
      return Promise.resolve({ data: zipBlob, headers: {} });
    });
    const onProgress = vi.fn();

    await createService(mockGet).exportExpenses({}, onProgress);

    expect(onProgress).toHaveBeenCalledWith(2048);
  });
});
