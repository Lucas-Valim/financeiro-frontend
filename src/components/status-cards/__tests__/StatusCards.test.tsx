import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusCards } from '../StatusCards';
import { ExpenseStatus } from '@/constants/expenses';

describe('StatusCards', () => {
  const defaultProps = {
    openCount: 5,
    overdueCount: 3,
    paidCount: 10,
    cancelledCount: 2,
    onCardClick: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<StatusCards {...defaultProps} />);
      expect(screen.getByTestId('status-card-open')).toBeInTheDocument();
    });

    it('renders all four status cards with correct Portuguese labels', () => {
      render(<StatusCards {...defaultProps} />);

      expect(screen.getByText('Abertas')).toBeInTheDocument();
      expect(screen.getByText('Atrasadas')).toBeInTheDocument();
      expect(screen.getByText('Pagas')).toBeInTheDocument();
      expect(screen.getByText('Canceladas')).toBeInTheDocument();
    });

    it('renders all four status cards with correct count values from props', () => {
      render(<StatusCards {...defaultProps} />);

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('5');
      expect(screen.getByTestId('status-count-overdue')).toHaveTextContent('3');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('10');
      expect(screen.getByTestId('status-count-cancelled')).toHaveTextContent('2');
    });

    it('renders correctly with all zero counts', () => {
      const props = { ...defaultProps, openCount: 0, overdueCount: 0, paidCount: 0, cancelledCount: 0 };
      render(<StatusCards {...props} />);

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('0');
      expect(screen.getByTestId('status-count-overdue')).toHaveTextContent('0');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('0');
      expect(screen.getByTestId('status-count-cancelled')).toHaveTextContent('0');
    });

    it('renders correctly with mixed count values', () => {
      const props = { ...defaultProps, openCount: 15, overdueCount: 0, paidCount: 1, cancelledCount: 100 };
      render(<StatusCards {...props} />);

      expect(screen.getByTestId('status-count-open')).toHaveTextContent('15');
      expect(screen.getByTestId('status-count-overdue')).toHaveTextContent('0');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('1');
      expect(screen.getByTestId('status-count-cancelled')).toHaveTextContent('100');
    });
  });

  describe('Responsive Layout', () => {
    it('applies correct flex layout classes', () => {
      const { container } = render(<StatusCards {...defaultProps} />);
      const flexContainer = container.firstChild as HTMLElement;
      
      expect(flexContainer).toHaveClass('flex');
      expect(flexContainer).toHaveClass('flex-wrap');
      expect(flexContainer).toHaveClass('gap-2');
      expect(flexContainer).toHaveClass('justify-center');
    });

    it('applies responsive flex-wrap behavior for all screen sizes', () => {
      const { container } = render(<StatusCards {...defaultProps} />);
      const flexContainer = container.firstChild as HTMLElement;
      
      expect(flexContainer).toHaveClass('flex');
      expect(flexContainer).toHaveClass('flex-wrap');
    });
  });

  describe('Click Handling', () => {
    it('clicking OPEN card calls onCardClick with OPEN status', () => {
      const onCardClick = vi.fn();
      render(<StatusCards {...defaultProps} onCardClick={onCardClick} />);

      const openCard = screen.getByTestId('status-card-open');
      fireEvent.click(openCard);

      expect(onCardClick).toHaveBeenCalledTimes(1);
      expect(onCardClick).toHaveBeenCalledWith('OPEN');
    });

    it('clicking OVERDUE card calls onCardClick with OVERDUE status', () => {
      const onCardClick = vi.fn();
      render(<StatusCards {...defaultProps} onCardClick={onCardClick} />);

      const overdueCard = screen.getByTestId('status-card-overdue');
      fireEvent.click(overdueCard);

      expect(onCardClick).toHaveBeenCalledTimes(1);
      expect(onCardClick).toHaveBeenCalledWith('OVERDUE');
    });

    it('clicking PAID card calls onCardClick with PAID status', () => {
      const onCardClick = vi.fn();
      render(<StatusCards {...defaultProps} onCardClick={onCardClick} />);

      const paidCard = screen.getByTestId('status-card-paid');
      fireEvent.click(paidCard);

      expect(onCardClick).toHaveBeenCalledTimes(1);
      expect(onCardClick).toHaveBeenCalledWith('PAID');
    });

    it('clicking CANCELLED card calls onCardClick with CANCELLED status', () => {
      const onCardClick = vi.fn();
      render(<StatusCards {...defaultProps} onCardClick={onCardClick} />);

      const cancelledCard = screen.getByTestId('status-card-cancelled');
      fireEvent.click(cancelledCard);

      expect(onCardClick).toHaveBeenCalledTimes(1);
      expect(onCardClick).toHaveBeenCalledWith('CANCELLED');
    });
  });

  describe('Active State Styling', () => {
    it('applies active state styling when activeStatus matches card status (OPEN)', () => {
      render(<StatusCards {...defaultProps} activeStatus={ExpenseStatus.OPEN} />);

      const openCard = screen.getByTestId('status-card-open');
      expect(openCard).toHaveClass('ring-2');
    });

    it('applies active state styling when activeStatus matches card status (OVERDUE)', () => {
      render(<StatusCards {...defaultProps} activeStatus={ExpenseStatus.OVERDUE} />);

      const overdueCard = screen.getByTestId('status-card-overdue');
      expect(overdueCard).toHaveClass('ring-2');
    });

    it('applies active state styling when activeStatus matches card status (PAID)', () => {
      render(<StatusCards {...defaultProps} activeStatus={ExpenseStatus.PAID} />);

      const paidCard = screen.getByTestId('status-card-paid');
      expect(paidCard).toHaveClass('ring-2');
    });

    it('applies active state styling when activeStatus matches card status (CANCELLED)', () => {
      render(<StatusCards {...defaultProps} activeStatus={ExpenseStatus.CANCELLED} />);

      const cancelledCard = screen.getByTestId('status-card-cancelled');
      expect(cancelledCard).toHaveClass('ring-2');
    });

    it('does NOT apply active state styling when activeStatus is null', () => {
      render(<StatusCards {...defaultProps} activeStatus={null} />);

      const openCard = screen.getByTestId('status-card-open');
      const overdueCard = screen.getByTestId('status-card-overdue');
      const paidCard = screen.getByTestId('status-card-paid');
      const cancelledCard = screen.getByTestId('status-card-cancelled');

      expect(openCard).not.toHaveClass('ring-2');
      expect(overdueCard).not.toHaveClass('ring-2');
      expect(paidCard).not.toHaveClass('ring-2');
      expect(cancelledCard).not.toHaveClass('ring-2');
    });

    it('does NOT apply active state styling when activeStatus is undefined', () => {
      render(<StatusCards {...defaultProps} activeStatus={undefined} />);

      const openCard = screen.getByTestId('status-card-open');
      expect(openCard).not.toHaveClass('ring-2');
    });

    it('does NOT apply active state styling when activeStatus is different', () => {
      render(<StatusCards {...defaultProps} activeStatus={ExpenseStatus.OPEN} />);

      const overdueCard = screen.getByTestId('status-card-overdue');
      const paidCard = screen.getByTestId('status-card-paid');
      const cancelledCard = screen.getByTestId('status-card-cancelled');

      expect(overdueCard).not.toHaveClass('ring-2');
      expect(paidCard).not.toHaveClass('ring-2');
      expect(cancelledCard).not.toHaveClass('ring-2');
    });
  });

  describe('Edge Cases', () => {
    it('handles null counts gracefully', () => {
      const props = { 
        ...defaultProps, 
        openCount: null as unknown as number, 
        overdueCount: null as unknown as number,
        paidCount: null as unknown as number,
        cancelledCount: null as unknown as number,
      };
      
      expect(() => render(<StatusCards {...props} />)).not.toThrow();
    });

    it('handles undefined counts gracefully', () => {
      const props = { 
        ...defaultProps, 
        openCount: undefined as unknown as number, 
        overdueCount: undefined as unknown as number,
        paidCount: undefined as unknown as number,
        cancelledCount: undefined as unknown as number,
      };
      
      expect(() => render(<StatusCards {...props} />)).not.toThrow();
    });

    it('handles negative counts gracefully', () => {
      const props = { 
        ...defaultProps, 
        openCount: -1, 
        overdueCount: -5,
        paidCount: -10,
        cancelledCount: -2,
      };
      
      expect(() => render(<StatusCards {...props} />)).not.toThrow();
      expect(screen.getByTestId('status-count-open')).toHaveTextContent('-1');
      expect(screen.getByTestId('status-count-overdue')).toHaveTextContent('-5');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('-10');
      expect(screen.getByTestId('status-count-cancelled')).toHaveTextContent('-2');
    });

    it('handles very large counts gracefully', () => {
      const props = { 
        ...defaultProps, 
        openCount: 999999, 
        overdueCount: 1000000,
        paidCount: 500000,
        cancelledCount: 1234567890,
      };
      
      expect(() => render(<StatusCards {...props} />)).not.toThrow();
      expect(screen.getByTestId('status-count-open')).toHaveTextContent('999999');
      expect(screen.getByTestId('status-count-overdue')).toHaveTextContent('1000000');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('500000');
      expect(screen.getByTestId('status-count-cancelled')).toHaveTextContent('1234567890');
    });

    it('handles zero counts mixed with positive counts', () => {
      const props = { 
        ...defaultProps, 
        openCount: 0, 
        overdueCount: 5,
        paidCount: 0,
        cancelledCount: 10,
      };
      
      render(<StatusCards {...props} />);
      expect(screen.getByTestId('status-count-open')).toHaveTextContent('0');
      expect(screen.getByTestId('status-count-overdue')).toHaveTextContent('5');
      expect(screen.getByTestId('status-count-paid')).toHaveTextContent('0');
      expect(screen.getByTestId('status-count-cancelled')).toHaveTextContent('10');
    });
  });
});
