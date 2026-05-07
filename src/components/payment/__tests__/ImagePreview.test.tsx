import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreview } from '../ImagePreview';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
  FileText: (props: { 'data-testid'?: string }) => <span data-testid={props['data-testid'] || 'pdf-icon'}>FileText</span>,
  Loader2: () => <span data-testid="loader-icon">Loading...</span>,
  ExternalLink: (props: { 'data-testid'?: string }) => <span data-testid={props['data-testid'] || 'open-link-icon'}>ExternalLink</span>,
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
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

describe('ImagePreview', () => {
  const mockOnRemove = vi.fn();

  describe('Rendering', () => {
    it('renders nothing when file is null', () => {
      render(<ImagePreview file={null} onRemove={mockOnRemove} />);

      expect(screen.queryByTestId('image-preview-container')).not.toBeInTheDocument();
    });

    it('renders file info for image files', () => {
      const imageFile = new File(['test content'], 'test-image.png', {
        type: 'image/png',
      });
      Object.defineProperty(imageFile, 'size', { value: 1024 });

      render(<ImagePreview file={imageFile} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('image-preview-container')).toBeInTheDocument();
      expect(screen.getByTestId('file-name')).toHaveTextContent('test-image.png');
      expect(screen.getByTestId('file-info')).toHaveTextContent('1 KB • image/png');
    });

    it('renders PDF icon for PDF files', () => {
      const pdfFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(pdfFile, 'size', { value: 2048 });

      render(<ImagePreview file={pdfFile} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('pdf-icon')).toBeInTheDocument();
      expect(screen.getByTestId('file-name')).toHaveTextContent('test.pdf');
      expect(screen.getByTestId('file-info')).toHaveTextContent('2 KB • application/pdf');
    });

    it('renders image preview for image files', () => {
      const imageFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(imageFile, 'size', { value: 512 });

      render(<ImagePreview file={imageFile} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('preview-image')).toBeInTheDocument();
      expect(screen.getByTestId('preview-image')).toHaveAttribute('src', 'blob:test-url');
      expect(screen.getByTestId('preview-image')).toHaveAttribute('alt', 'test.jpg');
    });
  });

  describe('File size formatting', () => {
    it('formats bytes correctly', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 512 });

      render(<ImagePreview file={file} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('file-info')).toHaveTextContent('512 Bytes');
    });

    it('formats kilobytes correctly', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 2.5 }); // 2.5 KB

      render(<ImagePreview file={file} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('file-info')).toHaveTextContent('2.5 KB');
    });

    it('formats megabytes correctly', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 * 1.5 }); // 1.5 MB

      render(<ImagePreview file={file} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('file-info')).toHaveTextContent('1.5 MB');
    });
  });

  describe('Remove functionality', () => {
    it('renders remove button', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      render(<ImagePreview file={file} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('remove-file-button')).toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      render(<ImagePreview file={file} onRemove={mockOnRemove} />);

      await userEvent.click(screen.getByTestId('remove-file-button'));

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it('does not call onRemove when disabled', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      render(<ImagePreview file={file} onRemove={mockOnRemove} disabled={true} />);

      const removeButton = screen.getByTestId('remove-file-button');
      expect(removeButton).toBeDisabled();

      fireEvent.click(removeButton);
      expect(mockOnRemove).not.toHaveBeenCalled();
    });
  });

  describe('Disabled state', () => {
    it('disables remove button when disabled prop is true', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      render(<ImagePreview file={file} onRemove={mockOnRemove} disabled={true} />);

      expect(screen.getByTestId('remove-file-button')).toBeDisabled();
    });
  });

  describe('URL cleanup', () => {
    it('creates object URL for image files', () => {
      const imageFile = new File(['test'], 'test.png', { type: 'image/png' });

      render(<ImagePreview file={imageFile} onRemove={mockOnRemove} />);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(imageFile);
    });

    it('creates object URL for PDF files to enable open in new tab', () => {
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      render(<ImagePreview file={pdfFile} onRemove={mockOnRemove} />);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(pdfFile);
    });
  });

  describe('Open in new tab', () => {
    beforeEach(() => {
      vi.stubGlobal('open', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('opens imageUrl in new tab when clicking the preview', async () => {
      render(
        <ImagePreview
          imageUrl="https://example.com/document.pdf"
          displayName="Nota de Serviço"
          onRemove={mockOnRemove}
        />
      );

      await userEvent.click(screen.getByTestId('file-preview-click-area'));

      expect(global.open).toHaveBeenCalledWith(
        'https://example.com/document.pdf',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('opens blob URL in new tab when clicking uploaded file preview', async () => {
      const pdfFile = new File(['test content'], 'invoice.pdf', { type: 'application/pdf' });
      Object.defineProperty(pdfFile, 'size', { value: 2048 });

      render(<ImagePreview file={pdfFile} onRemove={mockOnRemove} />);

      await userEvent.click(screen.getByTestId('file-preview-click-area'));

      expect(global.open).toHaveBeenCalledWith(
        'blob:test-url',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('does not open in new tab when disabled', async () => {
      render(
        <ImagePreview
          imageUrl="https://example.com/document.pdf"
          onRemove={mockOnRemove}
          disabled={true}
        />
      );

      await userEvent.click(screen.getByTestId('file-preview-click-area'));

      expect(global.open).not.toHaveBeenCalled();
    });

    it('renders click area with button role when file has blob URL', () => {
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      render(<ImagePreview file={pdfFile} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('file-preview-click-area')).toHaveAttribute('role', 'button');
    });

    it('opens in new tab on Enter key press', async () => {
      render(
        <ImagePreview
          imageUrl="https://example.com/document.pdf"
          onRemove={mockOnRemove}
        />
      );

      screen.getByTestId('file-preview-click-area').focus();
      await userEvent.keyboard('{Enter}');

      expect(global.open).toHaveBeenCalledWith(
        'https://example.com/document.pdf',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('opens in new tab on Space key press', async () => {
      render(
        <ImagePreview
          imageUrl="https://example.com/document.pdf"
          onRemove={mockOnRemove}
        />
      );

      screen.getByTestId('file-preview-click-area').focus();
      await userEvent.keyboard(' ');

      expect(global.open).toHaveBeenCalledWith(
        'https://example.com/document.pdf',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('renders ExternalLink icon when URL is available', () => {
      render(
        <ImagePreview
          imageUrl="https://example.com/document.pdf"
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByTestId('open-link-icon')).toBeInTheDocument();
    });

    it('does not render ExternalLink icon when disabled', () => {
      render(
        <ImagePreview
          imageUrl="https://example.com/document.pdf"
          onRemove={mockOnRemove}
          disabled={true}
        />
      );

      expect(screen.queryByTestId('open-link-icon')).not.toBeInTheDocument();
    });
  });
});
