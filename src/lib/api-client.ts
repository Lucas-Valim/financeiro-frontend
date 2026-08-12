import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ORGANIZATION_ID } from '../constants/expenses';

const API_TIMEOUT = 10000;

/**
 * URL prefixes whose requests get the organization scope injected. The report
 * export uses its own axios instance (to read `content-disposition`), so this
 * is exported and reused there rather than duplicated (ADR-007).
 */
const ORGANIZATION_SCOPED_PREFIXES = ['/expenses', '/reports'] as const;

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
    timeout: API_TIMEOUT,
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
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          const status = axiosError.response.status;
          const message = axiosError.response.data as { message?: string } | undefined;
          const errorMessage = message?.message || getErrorMessageByStatus(status);
          throw new Error(errorMessage);
        }
        if (axiosError.request) {
          throw new Error('Erro de rede: Não foi possível conectar ao servidor');
        }
      }
      throw error;
    }
  );

  return instance;
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
