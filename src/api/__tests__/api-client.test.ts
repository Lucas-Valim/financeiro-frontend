import { describe, it, expect } from 'vitest';
import { apiClient } from '../../lib/api-client';

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
