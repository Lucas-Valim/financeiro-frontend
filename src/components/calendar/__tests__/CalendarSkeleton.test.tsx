import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarSkeleton } from '../CalendarSkeleton';

describe('CalendarSkeleton', () => {
  describe('rendering', () => {
    it('renders month view skeleton with 42 cells', () => {
      const { container } = render(<CalendarSkeleton view="month" />);
      const cells = container.querySelectorAll('.h-24');
      expect(cells).toHaveLength(42);
    });

    it('renders week view skeleton with 7 cells', () => {
      const { container } = render(<CalendarSkeleton view="week" />);
      const cells = container.querySelectorAll('.h-24');
      expect(cells).toHaveLength(7);
    });

    it('renders day view skeleton with 1 cell', () => {
      const { container } = render(<CalendarSkeleton view="day" />);
      const cells = container.querySelectorAll('.h-24');
      expect(cells).toHaveLength(1);
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<CalendarSkeleton view="month" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-busy="true"', () => {
      render(<CalendarSkeleton view="month" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-label for loading state', () => {
      render(<CalendarSkeleton view="month" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Carregando calendário');
    });

    it('has sr-only text for screen readers', () => {
      render(<CalendarSkeleton view="month" />);
      expect(screen.getByText('Carregando eventos do calendário...')).toHaveClass('sr-only');
    });
  });

  describe('styling', () => {
    it('applies animate-pulse class to cells', () => {
      const { container } = render(<CalendarSkeleton view="month" />);
      const cells = container.querySelectorAll('.animate-pulse');
      expect(cells.length).toBe(42);
    });

    it('applies grid layout', () => {
      const { container } = render(<CalendarSkeleton view="month" />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('has correct grid columns for month view', () => {
      const { container } = render(<CalendarSkeleton view="month" />);
      const grid = container.querySelector('.grid') as HTMLElement;
      expect(grid?.style.gridTemplateColumns).toBe('repeat(7, minmax(0, 1fr))');
    });

    it('has correct grid columns for week view', () => {
      const { container } = render(<CalendarSkeleton view="week" />);
      const grid = container.querySelector('.grid') as HTMLElement;
      expect(grid?.style.gridTemplateColumns).toBe('repeat(7, minmax(0, 1fr))');
    });

    it('has correct grid columns for day view', () => {
      const { container } = render(<CalendarSkeleton view="day" />);
      const grid = container.querySelector('.grid') as HTMLElement;
      expect(grid?.style.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
    });
  });
});
