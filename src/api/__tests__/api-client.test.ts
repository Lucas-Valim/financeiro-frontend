import { describe, it, expect } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { apiClient, injectOrganizationId } from '../../lib/api-client';
import { ORGANIZATION_ID } from '../../constants/expenses';

function makeConfig(url: string): InternalAxiosRequestConfig {
  return { url, headers: {} } as InternalAxiosRequestConfig;
}

describe('injectOrganizationId', () => {
  it('injects organizationId for a /reports request', () => {
    const config = injectOrganizationId(makeConfig('/reports/expenses/summary'));

    expect(config.params?.organizationId).toBe(ORGANIZATION_ID);
  });

  it('keeps injecting organizationId for an /expenses request', () => {
    const config = injectOrganizationId(makeConfig('/expenses'));

    expect(config.params?.organizationId).toBe(ORGANIZATION_ID);
  });

  it('injects organizationId for a /recurring-expenses request', () => {
    const config = injectOrganizationId(makeConfig('/recurring-expenses'));

    expect(config.params?.organizationId).toBe(ORGANIZATION_ID);
  });

  it('injects organizationId for a /recurring-expenses termination-preview request', () => {
    const config = injectOrganizationId(
      makeConfig('/recurring-expenses/rec-1/termination-preview')
    );

    expect(config.params?.organizationId).toBe(ORGANIZATION_ID);
  });

  it('does not inject organizationId for a URL of another prefix', () => {
    const config = injectOrganizationId(makeConfig('/categories'));

    expect(config.params).toBeUndefined();
  });
});

describe('ApiClient', () => {
  it('should export apiClient as singleton', () => {
    expect(apiClient).toBeDefined();
  });

  it('should have get method available', () => {
    expect(typeof apiClient.get).toBe('function');
  });

  it('should have interceptors configured', () => {
    expect(apiClient.interceptors).toBeDefined();
    expect(apiClient.interceptors.request).toBeDefined();
    expect(apiClient.interceptors.response).toBeDefined();
  });

  it('should have defaults configured', () => {
    expect(apiClient.defaults).toBeDefined();
    expect(apiClient.defaults.timeout).toBe(10000);
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });
});
