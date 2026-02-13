import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ORGANIZATION_ID } from '../constants/expenses';

const API_TIMEOUT = 10000;

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: import.meta.env.API_URL || 'http://localhost:3000',
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const url = config.url || '';
      if (url.startsWith('/expenses')) {
        config.params = config.params || {};
        config.params.organizationId = ORGANIZATION_ID;
      }
      return config;
    },
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
