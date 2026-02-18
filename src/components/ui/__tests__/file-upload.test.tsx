import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../file-upload';

const mockAcceptedTypes = ['application/pdf', 'image/png', 'image/jpeg'] as const;
const mockMaxSize = 5 * 1024 * 1024;

vi.mock('lucide-react', () => ({
  Upload: () => <span data-testid="upload-icon">Upload</span>,
}));

vi.mock('@/components/payment/ImagePreview', () => ({
  ImagePreview: ({ file, onRemove, disabled }: { file: File | null; onRemove: () => void; disabled?: boolean }) => (
    <div data-testid="image-preview">
      <span data-testid="file-name">{file?.name}</span>
      <span data-testid="file-size">{file?.size}</span>
      <button
        data-testid="remove-button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove file"
      >
        Remove
      </button>
    </div>
  ),
}));

describe('FileUpload', () => {
  const mockOnChange = vi.fn();
  const mockOnRemove = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders drop zone with upload icon', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });

    it('renders file input with correct accept attribute', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('accept', 'application/pdf,image/png,image/jpeg');
    });

    it('renders file input with correct id', () => {
      render(
        <FileUpload
          id="custom-upload-id"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('id', 'custom-upload-id');
    });

    it('displays allowed file types from prop', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          allowedTypesDisplay="PDF, PNG, JPG"
        />
      );

      expect(screen.getByText(/PDF, PNG, JPG/)).toBeInTheDocument();
    });

    it('displays max file size in MB', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      expect(screen.getByText(/5MB/)).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          error="Custom error message"
        />
      );

      expect(screen.getByTestId('file-error')).toHaveTextContent('Custom error message');
    });

    it('displays drag instruction text', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      expect(screen.getByText(/arraste um arquivo/i)).toBeInTheDocument();
      expect(screen.getByText(/clique para selecionar/i)).toBeInTheDocument();
    });
  });

  describe('File Selection via Input', () => {
    it('calls onChange with valid PDF file', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockOnChange).toHaveBeenCalledWith(file);
    });

    it('calls onChange with valid PNG file', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockOnChange).toHaveBeenCalledWith(file);
    });

    it('shows validation error for invalid file type', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockOnChange).toHaveBeenCalledWith(null);
      expect(screen.getByTestId('file-error')).toBeInTheDocument();
      expect(screen.getByTestId('file-error')).toHaveTextContent('Tipo de arquivo inválido');
    });

    it('shows validation error for file too large', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={1024}
        />
      );

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 2048, writable: false });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockOnChange).toHaveBeenCalledWith(null);
      expect(screen.getByText(/muito grande/i)).toBeInTheDocument();
    });

    it('clears previous validation error when valid file is selected', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const input = screen.getByTestId('file-input');

      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(input, { target: { files: [invalidFile] } });

      expect(screen.getByTestId('file-error')).toBeInTheDocument();

      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [validFile] } });

      expect(screen.queryByTestId('file-error')).not.toBeInTheDocument();
    });

    it('does not call onChange when no file selected', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const input = screen.getByTestId('file-input');
      fireEvent.change(input, { target: { files: [] } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('applies border-primary class on dragenter', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const dropZone = screen.getByTestId('file-drop-zone');
      fireEvent.dragEnter(dropZone);

      expect(dropZone).toHaveClass('border-primary');
    });

    it('applies bg-primary/5 class on dragover', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const dropZone = screen.getByTestId('file-drop-zone');
      fireEvent.dragOver(dropZone);

      expect(dropZone).toHaveClass('bg-primary/5');
    });

    it('removes active styles on dragleave', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const dropZone = screen.getByTestId('file-drop-zone');
      fireEvent.dragEnter(dropZone);
      expect(dropZone).toHaveClass('border-primary');

      fireEvent.dragLeave(dropZone);
      expect(dropZone).not.toHaveClass('border-primary');
    });

    it('calls onChange with file on drop', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const dropZone = screen.getByTestId('file-drop-zone');

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(mockOnChange).toHaveBeenCalledWith(file);
    });

    it('shows validation error on drop with invalid file', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const dropZone = screen.getByTestId('file-drop-zone');

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(mockOnChange).toHaveBeenCalledWith(null);
      expect(screen.getByTestId('file-error')).toBeInTheDocument();
    });

    it('removes active styles after drop', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const dropZone = screen.getByTestId('file-drop-zone');

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(dropZone).not.toHaveClass('border-primary');
    });
  });

  describe('Disabled State', () => {
    it('disables file input when disabled prop is true', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          disabled={true}
        />
      );

      expect(screen.getByTestId('file-input')).toBeDisabled();
    });

    it('applies opacity-50 class to drop zone when disabled', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          disabled={true}
        />
      );

      expect(screen.getByTestId('file-drop-zone')).toHaveClass('opacity-50');
    });

    it('applies cursor-not-allowed class when disabled', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          disabled={true}
        />
      );

      expect(screen.getByTestId('file-drop-zone')).toHaveClass('cursor-not-allowed');
    });

    it('applies cursor-not-allowed to label when disabled', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          disabled={true}
        />
      );

      const label = screen.getByText(/arraste um arquivo/i).closest('label');
      expect(label).toHaveClass('cursor-not-allowed');
    });

    it('does not process file drop when disabled', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          disabled={true}
        />
      );

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const dropZone = screen.getByTestId('file-drop-zone');

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('File Preview', () => {
    it('shows ImagePreview when file is selected', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      render(
        <FileUpload
          id="test-upload"
          value={file}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      expect(screen.getByTestId('image-preview')).toBeInTheDocument();
    });

    it('shows file name in preview', () => {
      const file = new File(['content'], 'my-document.pdf', { type: 'application/pdf' });

      render(
        <FileUpload
          id="test-upload"
          value={file}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      expect(screen.getByTestId('file-name')).toHaveTextContent('my-document.pdf');
    });

    it('does not show preview when no file is selected', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
    });

    it('calls onChange(null) when remove button is clicked', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      render(
        <FileUpload
          id="test-upload"
          value={file}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      await user.click(screen.getByTestId('remove-button'));

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('calls onRemove callback when remove button is clicked', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      render(
        <FileUpload
          id="test-upload"
          value={file}
          onChange={mockOnChange}
          onRemove={mockOnRemove}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      await user.click(screen.getByTestId('remove-button'));

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it('clears validation error when file is removed', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      render(
        <FileUpload
          id="test-upload"
          value={file}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          error="Previous error"
        />
      );

      expect(screen.getByTestId('file-error')).toBeInTheDocument();

      await user.click(screen.getByTestId('remove-button'));

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Error Display', () => {
    it('shows external error over validation error', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          error="External error from form"
        />
      );

      expect(screen.getByTestId('file-error')).toHaveTextContent('External error from form');
    });

    it('applies border-destructive class when error exists', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
          error="Error message"
        />
      );

      expect(screen.getByTestId('file-drop-zone')).toHaveClass('border-destructive');
    });

    it('does not apply border-destructive class when no error', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      expect(screen.getByTestId('file-drop-zone')).not.toHaveClass('border-destructive');
    });
  });

  describe('Accessibility', () => {
    it('has associated label for input', () => {
      render(
        <FileUpload
          id="test-upload"
          value={null}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const input = screen.getByTestId('file-input');
      const label = document.querySelector('label[for="test-upload"]');

      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'test-upload');
    });

    it('remove button has aria-label', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      render(
        <FileUpload
          id="test-upload"
          value={file}
          onChange={mockOnChange}
          acceptedTypes={mockAcceptedTypes}
          maxSize={mockMaxSize}
        />
      );

      const removeButton = screen.getByLabelText('Remove file');
      expect(removeButton).toBeInTheDocument();
    });
  });
});
