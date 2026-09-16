import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ORGANIZATION_ID } from '../constants/expenses';
import { COLD_START_TIMEOUT_MS } from '../constants/api';
import { RequestTimeoutError } from './api-errors';

/**
 * URL prefixes whose requests get the organization scope injected. The report
 * export uses its own axios instance (to read `content-disposition`), so this
 * is exported and reused there rather than duplicated (ADR-007).
 */
const ORGANIZATION_SCOPED_PREFIXES = ['/expenses', '/reports', '/recurring-expenses'] as const;

/**
 * Request interceptor that injects `organizationId` into the query for the
 * organization-scoped namespaces. Shared between the main `apiClient` and the
 * report export instance.
 */
export function injectOrganizationId(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const url = config.url || '';
  if (ORGANIZATION_SCOPED_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    config.params = config.params || {};
    config.params.organizationId = ORGANIZATION_ID;
  }
  return config;
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: COLD_START_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    injectOrganizationId,
    (error: unknown) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    translateResponseError
  );

  return instance;
}

/**
 * Translates an axios failure into the error the UI reacts to. Exported for the
 * same reason `injectOrganizationId` is: it carries branching worth testing on
 * its own, without standing up a server.
 */
export function translateResponseError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const status = axiosError.response.status;
      const message = axiosError.response.data as { message?: string } | undefined;
      const errorMessage = message?.message || getErrorMessageByStatus(status);
      throw new Error(errorMessage);
    }
    if (isTimeout(axiosError)) {
      throw new RequestTimeoutError();
    }
    if (axiosError.request) {
      throw new Error('Erro de rede: Não foi possível conectar ao servidor');
    }
  }
  throw error;
}

/**
 * Axios reports an exhausted timeout as `ECONNABORTED`, and some environments
 * surface the underlying `ETIMEDOUT` instead. Both mean the same thing here.
 */
function isTimeout(error: AxiosError): boolean {
  return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
}

function getErrorMessageByStatus(status: number): string {
  const errorMessages: Record<number, string> = {
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Resource not found',
    500: 'Internal server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
  };
  return errorMessages[status] || `Error ${status}`;
}

export const apiClient = createApiClient();
