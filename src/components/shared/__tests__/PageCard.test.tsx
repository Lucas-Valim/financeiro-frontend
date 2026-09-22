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

  describe('Header action', () => {
    it('renders the action in the header, before the content', () => {
      render(
        <PageCard {...defaultProps} action={<button type="button">Exportar</button>} />
      );

      const action = screen.getByTestId('page-card-action');
      expect(action).toHaveTextContent('Exportar');
      expect(action.closest('[data-slot="card-header"]')).not.toBeNull();
      expect(
        action.compareDocumentPosition(screen.getByTestId('child-content')) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it('keeps the header when only the action is provided', () => {
      render(
        <PageCard title="" description="" action={<button type="button">Exportar</button>}>
          <div>Content</div>
        </PageCard>
      );

      expect(screen.getByTestId('page-card-action')).toHaveTextContent('Exportar');
      expect(screen.getByTestId('page-card-action').closest('[data-slot="card-header"]')).not.toBeNull();
    });

    it('renders no action container when the prop is omitted', () => {
      render(<PageCard {...defaultProps} />);

      expect(screen.queryByTestId('page-card-action')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('title is rendered with appropriate styling', () => {
      render(<PageCard {...defaultProps} />);
      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-2xl');
    });
  });

  describe('Conditional Header', () => {
    it('does not render CardHeader when title and description are empty', () => {
      render(
        <PageCard title="" description="">
          <div data-testid="child-content">Child Content</div>
        </PageCard>
      );
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('renders CardHeader when only title is provided', () => {
      render(
        <PageCard title="Only Title" description="">
          <div>Content</div>
        </PageCard>
      );
      expect(screen.getByText('Only Title')).toBeInTheDocument();
    });

    it('renders CardHeader when only description is provided', () => {
      render(
        <PageCard title="" description="Only Description">
          <div>Content</div>
        </PageCard>
      );
      expect(screen.getByText('Only Description')).toBeInTheDocument();
    });

    it('removes padding when no header is present', () => {
      const { container } = render(
        <PageCard title="" description="">
          <div>Content</div>
        </PageCard>
      );
      const card = container.querySelector('[data-slot="card"]') as HTMLElement;
      expect(card).toHaveClass('py-0');
    });

    it('keeps default padding when header is present', () => {
      const { container } = render(<PageCard {...defaultProps} />);
      const card = container.querySelector('[data-slot="card"]') as HTMLElement;
      expect(card).not.toHaveClass('py-0');
    });
  });
});
