import { describe, it, expect } from 'vitest';
import { formatDocument } from '../format-document';

describe('formatDocument', () => {
  it('formats 11-digit document as CPF', () => {
    expect(formatDocument('12345678901')).toBe('123.456.789-01');
  });

  it('formats 14-digit document as CNPJ', () => {
    expect(formatDocument('12345678000190')).toBe('12.345.678/0001-90');
  });

  it('returns raw value for non-standard lengths', () => {
    expect(formatDocument('12345')).toBe('12345');
  });

  it('returns a dash placeholder when document is absent', () => {
    expect(formatDocument('')).toBe('—');
    expect(formatDocument(null)).toBe('—');
    expect(formatDocument(undefined)).toBe('—');
  });

  it('strips non-digits before formatting', () => {
    expect(formatDocument('123.456.789-01')).toBe('123.456.789-01');
    expect(formatDocument('12.345.678/0001-90')).toBe('12.345.678/0001-90');
  });
});
