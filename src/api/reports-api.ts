import axios from 'axios';
import type { AxiosInstance, AxiosProgressEvent } from 'axios';
import { apiClient, injectOrganizationId } from '../lib/api-client';
import { EXPORT_TIMEOUT_MS } from '../constants/reports';
import type {
  ExpenseReportExport,
  ExpenseReportSummary,
  ReportFilter,
} from '../types/reports';

const SUMMARY_PATH = '/reports/expenses/summary';
const EXPORT_PATH = '/reports/expenses/export';

/**
 * Fallback file name used only if the server omits `content-disposition`. It is
 * a static generic name, not a reconstruction of the server's `MM-AAAA` naming
 * rule — the server stays the source of truth for the real name.
 */
const EXPORT_FALLBACK_FILENAME = 'relatorio-despesas.zip';

const EXPORT_ERROR_FALLBACK = 'Não foi possível exportar o relatório. Tente novamente.';

/**
 * Turns the report filters into a plain query-params object: Dates become ISO
 * strings and empty values are dropped. A plain object (not URLSearchParams) is
 * used so the request interceptor can inject `organizationId` onto it.
 */
function buildReportQueryParams(filters: ReportFilter): Record<string, string> {
  const params: Record<string, string> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    params[key] = value instanceof Date ? value.toISOString() : String(value);
  });

  return params;
}

/**
 * Extracts the file name from a `content-disposition` header, falling back to a
 * static name if the header is absent or malformed.
 */
function parseFilenameFromContentDisposition(header: string | undefined): string {
  if (!header) {
    return EXPORT_FALLBACK_FILENAME;
  }
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match?.[1] ? decodeURIComponent(match[1].trim()) : EXPORT_FALLBACK_FILENAME;
}

/**
 * Reads the error message from a `422` whose body arrives as a Blob (a side
 * effect of `responseType: 'blob'`): the blob is read as text and JSON-parsed
 * before its `message` can surface. Returns null when the error is not a
 * decodable Blob error.
 */
async function extractBlobErrorMessage(error: unknown): Promise<string | null> {
  if (!axios.isAxiosError(error) || !(error.response?.data instanceof Blob)) {
    return null;
  }
  try {
    const text = await error.response.data.text();
    const parsed = JSON.parse(text) as { message?: string };
    return parsed.message ?? null;
  } catch {
    return null;
  }
}

/**
 * Dedicated instance for the export. It shares the base URL and the request
 * interceptor (for `organizationId`) but has NO response interceptor: the main
 * client unwraps `response.data`, which would hide `content-disposition` — and
 * the file name comes from exactly that header.
 */
function createExportClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: EXPORT_TIMEOUT_MS,
  });

  instance.interceptors.request.use(
    injectOrganizationId,
    (error: unknown) => Promise.reject(error)
  );

  return instance;
}

export class ReportsApiService {
  private readonly exportClient: AxiosInstance;

  constructor(exportClient: AxiosInstance = createExportClient()) {
    this.exportClient = exportClient;
  }

  async fetchSummary(filters: ReportFilter): Promise<ExpenseReportSummary> {
    const params = buildReportQueryParams(filters);
    return apiClient.get<ExpenseReportSummary>(SUMMARY_PATH, {
      params,
    }) as unknown as Promise<ExpenseReportSummary>;
  }

  async exportExpenses(
    filters: ReportFilter,
    onProgress?: (receivedBytes: number) => void
  ): Promise<ExpenseReportExport> {
    const params = buildReportQueryParams(filters);

    try {
      const response = await this.exportClient.get(EXPORT_PATH, {
        params,
        responseType: 'blob',
        timeout: EXPORT_TIMEOUT_MS,
        onDownloadProgress: (event: AxiosProgressEvent) => {
          onProgress?.(event.loaded);
        },
      });

      const filename = parseFilenameFromContentDisposition(
        response.headers['content-disposition']
      );

      return { blob: response.data as Blob, filename };
    } catch (error) {
      const message = await extractBlobErrorMessage(error);
      if (message) {
        throw new Error(message);
      }
      throw error instanceof Error ? error : new Error(EXPORT_ERROR_FALLBACK);
    }
  }
}

export const reportsApiService = new ReportsApiService();
