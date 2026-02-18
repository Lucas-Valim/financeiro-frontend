import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentProofViewer } from '../PaymentProofViewer';

describe('PaymentProofViewer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility', () => {
    it('renders when isOpen is true', () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('viewer-overlay')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <PaymentProofViewer
          isOpen={false}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('viewer-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Image display', () => {
    it('displays image with correct src', () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('viewer-image')).toHaveAttribute('src', 'https://example.com/proof.png');
    });

    it('displays file name in alt attribute', () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          fileName="my-proof.png"
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('viewer-image')).toHaveAttribute('alt', 'my-proof.png');
    });

    it('displays default alt text when fileName is not provided', () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('viewer-image')).toHaveAttribute('alt', 'Comprovante');
    });
  });

  describe('Close mechanisms', () => {
    it('close button calls onClose', async () => {
      const user = userEvent.setup();

      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByTestId('close-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('clicking backdrop calls onClose', async () => {
      const user = userEvent.setup();

      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByTestId('viewer-overlay'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('clicking image does NOT call onClose', async () => {
      const user = userEvent.setup();

      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByTestId('viewer-image'));
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('Escape key calls onClose', async () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(screen.getByTestId('viewer-overlay'), { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner initially', () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      const spinner = screen.getByRole('img').previousElementSibling;
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Z-index layering', () => {
    it('overlay has z-index 60 to appear above modal dialogs (z-50)', () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByTestId('viewer-overlay');
      expect(overlay).toHaveClass('z-[60]');
    });

    it('close button has z-index 70 to be clickable above overlay', () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTestId('close-button');
      expect(closeButton).toHaveClass('z-[70]');
    });

    it('viewer renders as full-screen fixed overlay', () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByTestId('viewer-overlay');
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
    });

    it('overlay has pointer-events-auto to capture clicks', () => {
      render(
        <PaymentProofViewer
          isOpen={true}
          imageUrl="https://example.com/proof.png"
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByTestId('viewer-overlay');
      expect(overlay).toHaveClass('pointer-events-auto');
    });
  });
});
