import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageCard } from '../PageCard';

describe('PageCard', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test Description',
    children: <div data-testid="child-content">Child Content</div>,
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<PageCard {...defaultProps} />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders title and description', () => {
      render(<PageCard {...defaultProps} />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(<PageCard {...defaultProps} />);
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('applies 80% width class', () => {
      const { container } = render(<PageCard {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-[100%]');
    });

    it('applies centered margin', () => {
      const { container } = render(<PageCard {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('mx-auto');
    });

    it('applies full available height on desktop', () => {
      const { container } = render(<PageCard {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('md:h-full');
    });

    it('applies overflow hidden to prevent scrolling on the card on desktop', () => {
      const { container } = render(<PageCard {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('md:overflow-hidden');
    });

    it('applies flex layout to Card for proper content distribution', () => {
      render(<PageCard {...defaultProps} />);
      const card = document.querySelector('[class*="flex"]') as HTMLElement;
      expect(card).toBeInTheDocument();
    });

    it('applies flex-col to CardContent for vertical layout', () => {
      render(<PageCard {...defaultProps} />);
      const cardContent = screen.getByTestId('child-content').parentElement;
      expect(cardContent).toHaveClass('flex-col');
    });
  });

  describe('Accessibility', () => {
    it('title is rendered with appropriate styling', () => {
      render(<PageCard {...defaultProps} />);
      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-2xl');
    });
  });
});
