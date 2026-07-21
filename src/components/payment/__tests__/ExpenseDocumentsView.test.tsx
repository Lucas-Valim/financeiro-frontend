import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseDocumentsView } from '../ExpenseDocumentsView';

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    FileText: () => <span data-testid="pdf-icon">FileText</span>,
  };
});

describe('ExpenseDocumentsView', () => {
  const mockOnViewImage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Nota de Serviço" and "Boleto" labels', () => {
    render(
      <ExpenseDocumentsView
        serviceInvoiceUrl={null}
        bankBillUrl={null}
        onViewImage={mockOnViewImage}
      />
    );

    expect(screen.getByText('Nota de Serviço')).toBeInTheDocument();
    expect(screen.getByText('Boleto')).toBeInTheDocument();
  });

  it('shows empty state for both documents when URLs are null', () => {
    render(
      <ExpenseDocumentsView
        serviceInvoiceUrl={null}
        bankBillUrl={null}
        onViewImage={mockOnViewImage}
      />
    );

    expect(screen.getAllByText('Nenhum comprovante anexado')).toHaveLength(2);
  });

  it('renders image thumbnails for image URLs', () => {
    render(
      <ExpenseDocumentsView
        serviceInvoiceUrl="https://example.com/nota.png"
        bankBillUrl="https://example.com/boleto.jpg"
        onViewImage={mockOnViewImage}
      />
    );

    expect(screen.getAllByTestId('proof-image')).toHaveLength(2);
  });

  it('calls onViewImage with the URL when an image is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ExpenseDocumentsView
        serviceInvoiceUrl="https://example.com/nota.png"
        bankBillUrl={null}
        onViewImage={mockOnViewImage}
      />
    );

    await user.click(screen.getByTestId('image-container'));
    expect(mockOnViewImage).toHaveBeenCalledWith('https://example.com/nota.png');
  });

  it('does not call onViewImage for PDF documents', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ExpenseDocumentsView
        serviceInvoiceUrl="https://example.com/nota.pdf"
        bankBillUrl={null}
        onViewImage={mockOnViewImage}
      />
    );

    await user.click(screen.getByTestId('open-pdf-button'));
    expect(mockOnViewImage).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith('https://example.com/nota.pdf', '_blank');

    openSpy.mockRestore();
  });
});
