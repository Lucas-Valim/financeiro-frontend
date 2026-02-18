import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentProofDisplay } from '../PaymentProofDisplay';

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    FileText: () => <span data-testid="pdf-icon">FileText</span>,
  };
});

describe('PaymentProofDisplay', () => {
  const mockOnImageClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image rendering', () => {
    it('renders image thumbnail for PNG URL', () => {
      render(
        <PaymentProofDisplay
          proofUrl="https://example.com/proof.png"
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByTestId('proof-image')).toBeInTheDocument();
      expect(screen.getByTestId('proof-image')).toHaveAttribute('src', 'https://example.com/proof.png');
    });

    it('renders image thumbnail for JPG URL', () => {
      render(
        <PaymentProofDisplay
          proofUrl="https://example.com/proof.jpg"
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByTestId('proof-image')).toBeInTheDocument();
    });

    it('renders image thumbnail for JPEG URL', () => {
      render(
        <PaymentProofDisplay
          proofUrl="https://example.com/proof.jpeg"
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByTestId('proof-image')).toBeInTheDocument();
    });

    it('renders image thumbnail for GIF URL', () => {
      render(
        <PaymentProofDisplay
          proofUrl="https://example.com/proof.gif"
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByTestId('proof-image')).toBeInTheDocument();
    });

    it('renders image thumbnail for WebP URL', () => {
      render(
        <PaymentProofDisplay
          proofUrl="https://example.com/proof.webp"
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByTestId('proof-image')).toBeInTheDocument();
    });
  });

  describe('PDF rendering', () => {
    it('shows PDF icon for PDF URL', () => {
      render(
        <PaymentProofDisplay proofUrl="https://example.com/proof.pdf" />
      );

      expect(screen.getByTestId('pdf-icon')).toBeInTheDocument();
      expect(screen.getByTestId('open-pdf-button')).toBeInTheDocument();
    });

    it('clicking "Abrir PDF" opens new tab', async () => {
      const user = userEvent.setup();
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(
        <PaymentProofDisplay proofUrl="https://example.com/proof.pdf" />
      );

      await user.click(screen.getByTestId('open-pdf-button'));
      expect(openSpy).toHaveBeenCalledWith('https://example.com/proof.pdf', '_blank');

      openSpy.mockRestore();
    });
  });

  describe('Null/undefined handling', () => {
    it('shows "Nenhum comprovante" for null', () => {
      render(<PaymentProofDisplay proofUrl={null} />);

      expect(screen.getByText('Nenhum comprovante anexado')).toBeInTheDocument();
    });

    it('shows "Nenhum comprovante" for undefined', () => {
      render(<PaymentProofDisplay proofUrl={undefined as unknown as null} />);

      expect(screen.getByText('Nenhum comprovante anexado')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('clicking image calls onImageClick', async () => {
      const user = userEvent.setup();

      render(
        <PaymentProofDisplay
          proofUrl="https://example.com/proof.png"
          onImageClick={mockOnImageClick}
        />
      );

      await user.click(screen.getByTestId('image-container'));
      expect(mockOnImageClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('UI elements', () => {
    it('displays extracted file name', () => {
      render(
        <PaymentProofDisplay proofUrl="https://example.com/my-proof-file.pdf" />
      );

      expect(screen.getByTestId('file-name')).toHaveTextContent('my-proof-file.pdf');
    });

    it('shows "Clique para expandir" hint for images', () => {
      render(
        <PaymentProofDisplay
          proofUrl="https://example.com/proof.png"
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByText('Clique para expandir')).toBeInTheDocument();
    });
  });
});
