import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { translateResponseError } from '../api-client';
import { RequestTimeoutError } from '../api-errors';

const buildAxiosError = (
  code: string,
  overrides: Partial<AxiosError> = {}
): AxiosError => {
  const error = new AxiosError('failed', code);
  Object.assign(error, { request: {} }, overrides);
  return error;
};

describe('translateResponseError', () => {
  it('should raise RequestTimeoutError when the budget is exhausted (ECONNABORTED)', () => {
    expect(() => translateResponseError(buildAxiosError('ECONNABORTED'))).toThrow(
      RequestTimeoutError
    );
  });

  it('should raise RequestTimeoutError for the underlying ETIMEDOUT too', () => {
    expect(() => translateResponseError(buildAxiosError('ETIMEDOUT'))).toThrow(
      RequestTimeoutError
    );
  });

  it('should keep reporting an unreachable host as a network error, not a timeout', () => {
    const error = buildAxiosError('ECONNREFUSED');

    expect(() => translateResponseError(error)).toThrow(
      'Erro de rede: Não foi possível conectar ao servidor'
    );
    expect(() => translateResponseError(error)).not.toThrow(RequestTimeoutError);
  });

  it('should surface the server message when the response carries one', () => {
    const error = buildAxiosError('ERR_BAD_REQUEST', {
      response: {
        status: 422,
        data: { message: 'Despesa inválida' },
      } as AxiosError['response'],
    });

    expect(() => translateResponseError(error)).toThrow('Despesa inválida');
  });

  it('should fall back to a status-based message when the body has none', () => {
    const error = buildAxiosError('ERR_BAD_RESPONSE', {
      response: { status: 503, data: {} } as AxiosError['response'],
    });

    expect(() => translateResponseError(error)).toThrow('Service unavailable');
  });
});
