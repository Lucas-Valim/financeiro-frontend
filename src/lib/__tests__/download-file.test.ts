import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFile } from '../download-file';

const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  mockCreateObjectURL.mockReturnValue('blob:test-url');
  mockRevokeObjectURL.mockReturnValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('downloadFile', () => {
  it('creates the object URL, clicks the anchor and revokes the URL', () => {
    const blob = new Blob(['zip-bytes']);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadFile(blob, 'a.zip');

    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');

    clickSpy.mockRestore();
  });

  it('sets the download name and href on the anchor', () => {
    const blob = new Blob(['zip-bytes']);
    let capturedAnchor: HTMLAnchorElement | null = null;
    const realCreateElement = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const element = realCreateElement(tag);
        if (tag === 'a') {
          capturedAnchor = element as HTMLAnchorElement;
        }
        return element;
      });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadFile(blob, 'resumo_contabilidade_08-2026.zip');

    expect(capturedAnchor!.download).toBe('resumo_contabilidade_08-2026.zip');
    expect(capturedAnchor!.href).toContain('blob:test-url');

    createSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('removes the anchor from the DOM at the end', () => {
    const blob = new Blob(['zip-bytes']);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadFile(blob, 'a.zip');

    expect(document.querySelector('a')).toBeNull();

    clickSpy.mockRestore();
  });
});
