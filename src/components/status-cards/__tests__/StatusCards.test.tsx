import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusCards } from '../StatusCards';
import { ExpenseStatus } from '@/constants/expenses';
import type {
  ExpenseStatusSummary,
  ExpenseStatusSummaryItem,
} from '@/types/expenses';

const item = (
  overrides: Partial<ExpenseStatusSummaryItem> = {},
): ExpenseStatusSummaryItem => ({
  count: 0,
  total: 0,
  estimatedCount: 0,
  estimatedTotal: 0,
  ...overrides,
});

const buildSummary = (
  overrides: Partial<ExpenseStatusSummary> = {},
): ExpenseStatusSummary => ({
  [ExpenseStatus.OPEN]: item({ count: 5, total: 1500.5 }),
  [ExpenseStatus.OVERDUE]: item({ count: 3, total: 300 }),
  [ExpenseStatus.PAID]: item({ count: 10, total: 10000 }),
  [ExpenseStatus.CANCELLED]: item({ count: 2, total: 0 }),
  ...overrides,
});

const emptySummary = (): ExpenseStatusSummary => ({
  [ExpenseStatus.OPEN]: item(),
  [ExpenseStatus.OVERDUE]: item(),
  [ExpenseStatus.PAID]: item(),
  [ExpenseStatus.CANCELLED]: item(),
});

const defaultProps = () => ({
  summary: buildSummary(),
  onCardClick: vi.fn(),
});

describe('StatusCards', () => {
  describe('Rendering', () => {
    it('renders the four status cards from a complete summary object', () => {
      render(<StatusCards {...defaultProps()} />);

      expect(screen.getByTestId('status-card-open')).toBeInTheDocument();
      expect(screen.getByTestId('status-card-overdue')).toBeInTheDocument();
      expect(screen.getByTestId('status-card-paid')).toBeInTheDocument();
      expect(screen.getByTestId('status-card-cancelled')).toBeInTheDocument();
    });

    it('renders all four status cards with correct Portuguese labels', () => {
      render(<StatusCards {...defaultProps()} />);

      expect(screen.getByText('Abertas')).toBeInTheDocument();
      expect(screen.getByText('Atrasadas')).toBeInTheDocument();
      expect(screen.getByText('Pagas')).toBeInTheDocument();
      expect(screen.getByText('Canceladas')).toBeInTheDocument();
    });

    it('renders the count from each bucket of the summary', () => {
      render(<StatusCards {...defaultProps()} />);

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('5');
      expect(screen.getByTestId('status-count-overdue')).toHaveTextContent('3');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('10');
      expect(screen.getByTestId('status-count-cancelled')).toHaveTextContent('2');
    });

    it('renders the BRL formatted total per status from the summary', () => {
      render(<StatusCards {...defaultProps()} />);

      expect(screen.getByTestId('status-total-open')).toHaveTextContent('R$');
      expect(screen.getByTestId('status-total-open')).toHaveTextContent('1.500,50');
      expect(screen.getByTestId('status-total-overdue')).toHaveTextContent('300,00');
      expect(screen.getByTestId('status-total-paid')).toHaveTextContent('10.000,00');
      expect(screen.getByTestId('status-total-cancelled')).toHaveTextContent('0,00');
    });

    it('renders all four cards without an estimated subline when every bucket is zeroed', () => {
      render(<StatusCards summary={emptySummary()} onCardClick={vi.fn()} />);

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('0');
      expect(screen.getByTestId('status-count-overdue')).toHaveTextContent('0');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('0');
      expect(screen.getByTestId('status-count-cancelled')).toHaveTextContent('0');
      expect(screen.queryByTestId('status-estimated-open')).not.toBeInTheDocument();
    });
  });

  describe('Total includes the estimated portion', () => {
    it('shows summary.OPEN.total as the main number, not total minus estimatedTotal', () => {
      const summary = buildSummary({
        [ExpenseStatus.OPEN]: item({
          count: 5,
          total: 5000,
          estimatedCount: 2,
          estimatedTotal: 1500,
        }),
      });

      render(<StatusCards summary={summary} onCardClick={vi.fn()} />);

      const total = screen.getByTestId('status-total-open');
      expect(total).toHaveTextContent('5.000,00');
      expect(total).not.toHaveTextContent('3.500,00');
    });
  });

  describe('Estimated subline', () => {
    it('does NOT render the estimated subline when estimatedTotal is 0', () => {
      const summary = buildSummary({
        [ExpenseStatus.OPEN]: item({
          count: 5,
          total: 1500,
          estimatedCount: 0,
          estimatedTotal: 0,
        }),
      });

      render(<StatusCards summary={summary} onCardClick={vi.fn()} />);

      expect(screen.queryByTestId('status-estimated-open')).not.toBeInTheDocument();
    });

    it('renders the estimated subline naming the value and the "2 de 5" proportion', () => {
      const summary = buildSummary({
        [ExpenseStatus.OPEN]: item({
          count: 5,
          total: 5000,
          estimatedCount: 2,
          estimatedTotal: 1500,
        }),
      });

      render(<StatusCards summary={summary} onCardClick={vi.fn()} />);

      const estimated = screen.getByTestId('status-estimated-open');
      expect(estimated).toHaveTextContent('1.500,00');
      expect(estimated).toHaveTextContent('2 de 5');
    });

    it('renders the estimated subline only for buckets with estimatedTotal > 0', () => {
      const summary = buildSummary({
        [ExpenseStatus.OPEN]: item({
          count: 5,
          total: 5000,
          estimatedCount: 2,
          estimatedTotal: 1500,
        }),
        [ExpenseStatus.OVERDUE]: item({ count: 3, total: 300 }),
      });

      render(<StatusCards summary={summary} onCardClick={vi.fn()} />);

      expect(screen.getByTestId('status-estimated-open')).toBeInTheDocument();
      expect(screen.queryByTestId('status-estimated-overdue')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('applies correct flex layout classes', () => {
      const { container } = render(<StatusCards {...defaultProps()} />);
      const flexContainer = container.firstChild as HTMLElement;

      expect(flexContainer).toHaveClass('flex');
      expect(flexContainer).toHaveClass('flex-wrap');
      expect(flexContainer).toHaveClass('gap-2');
      expect(flexContainer).toHaveClass('justify-center');
    });
  });

  describe('Click Handling', () => {
    it('clicking OPEN card calls onCardClick with OPEN status', () => {
      const onCardClick = vi.fn();
      render(<StatusCards summary={buildSummary()} onCardClick={onCardClick} />);

      fireEvent.click(screen.getByTestId('status-card-open'));

      expect(onCardClick).toHaveBeenCalledTimes(1);
      expect(onCardClick).toHaveBeenCalledWith('OPEN');
    });

    it('clicking OVERDUE card calls onCardClick with OVERDUE status', () => {
      const onCardClick = vi.fn();
      render(<StatusCards summary={buildSummary()} onCardClick={onCardClick} />);

      fireEvent.click(screen.getByTestId('status-card-overdue'));

      expect(onCardClick).toHaveBeenCalledWith('OVERDUE');
    });

    it('clicking PAID card calls onCardClick with PAID status', () => {
      const onCardClick = vi.fn();
      render(<StatusCards summary={buildSummary()} onCardClick={onCardClick} />);

      fireEvent.click(screen.getByTestId('status-card-paid'));

      expect(onCardClick).toHaveBeenCalledWith('PAID');
    });

    it('clicking CANCELLED card calls onCardClick with CANCELLED status', () => {
      const onCardClick = vi.fn();
      render(<StatusCards summary={buildSummary()} onCardClick={onCardClick} />);

      fireEvent.click(screen.getByTestId('status-card-cancelled'));

      expect(onCardClick).toHaveBeenCalledWith('CANCELLED');
    });
  });

  describe('Active State Styling', () => {
    it('marks the active card when activeStatus matches (OPEN)', () => {
      render(
        <StatusCards
          summary={buildSummary()}
          onCardClick={vi.fn()}
          activeStatus={ExpenseStatus.OPEN}
        />,
      );

      expect(screen.getByTestId('status-card-open')).toHaveClass('ring-2');
    });

    it('marks the active card when activeStatus matches (CANCELLED)', () => {
      render(
        <StatusCards
          summary={buildSummary()}
          onCardClick={vi.fn()}
          activeStatus={ExpenseStatus.CANCELLED}
        />,
      );

      expect(screen.getByTestId('status-card-cancelled')).toHaveClass('ring-2');
    });

    it('does NOT mark any card when activeStatus is null', () => {
      render(
        <StatusCards summary={buildSummary()} onCardClick={vi.fn()} activeStatus={null} />,
      );

      expect(screen.getByTestId('status-card-open')).not.toHaveClass('ring-2');
      expect(screen.getByTestId('status-card-overdue')).not.toHaveClass('ring-2');
      expect(screen.getByTestId('status-card-paid')).not.toHaveClass('ring-2');
      expect(screen.getByTestId('status-card-cancelled')).not.toHaveClass('ring-2');
    });

    it('does NOT mark any card when activeStatus is undefined', () => {
      render(<StatusCards summary={buildSummary()} onCardClick={vi.fn()} />);

      expect(screen.getByTestId('status-card-open')).not.toHaveClass('ring-2');
    });

    it('marks only the matching card, not the others', () => {
      render(
        <StatusCards
          summary={buildSummary()}
          onCardClick={vi.fn()}
          activeStatus={ExpenseStatus.OPEN}
        />,
      );

      expect(screen.getByTestId('status-card-open')).toHaveClass('ring-2');
      expect(screen.getByTestId('status-card-overdue')).not.toHaveClass('ring-2');
      expect(screen.getByTestId('status-card-paid')).not.toHaveClass('ring-2');
      expect(screen.getByTestId('status-card-cancelled')).not.toHaveClass('ring-2');
    });
  });

  describe('Count pluralization', () => {
    it('uses the singular "despesa" when a bucket has exactly one expense', () => {
      const summary = buildSummary({
        [ExpenseStatus.OPEN]: item({ count: 1, total: 100 }),
      });

      render(<StatusCards summary={summary} onCardClick={vi.fn()} />);

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('1 despesa');
    });

    it('uses the plural "despesas" for counts other than one', () => {
      render(<StatusCards {...defaultProps()} />);

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('5 despesas');
    });
  });
});
