import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Calendar Styles', () => {
  let cssContent: string;

  beforeAll(() => {
    cssContent = readFileSync(
      join(process.cwd(), 'src/styles/calendar.css'),
      'utf-8'
    );
  });

  describe('React Big Calendar Import', () => {
    it('should import react-big-calendar base styles', () => {
      expect(cssContent).toContain("@import 'react-big-calendar");
    });
  });

  describe('Calendar Container', () => {
    it('should style calendar container', () => {
      expect(cssContent).toContain('.rbc-calendar');
    });

    it('should use calendar background token', () => {
      expect(cssContent).toContain('var(--calendar-bg)');
    });

    it('should use calendar border token', () => {
      expect(cssContent).toContain('var(--calendar-border)');
    });
  });

  describe('Event Styles', () => {
    it('should define pending event class', () => {
      expect(cssContent).toContain('.event-pending');
    });

    it('should define paid event class', () => {
      expect(cssContent).toContain('.event-paid');
    });

    it('should define overdue event class', () => {
      expect(cssContent).toContain('.event-overdue');
    });

    it('should apply hover animation to events', () => {
      expect(cssContent).toContain('var(--motion-hover)');
    });
  });

  describe('Today Highlight', () => {
    it('should style today cell', () => {
      expect(cssContent).toContain('.rbc-today');
      expect(cssContent).toContain('var(--calendar-today)');
    });
  });

  describe('Spacing', () => {
    it('should use spacing tokens', () => {
      expect(cssContent).toContain('var(--space-xs)');
      expect(cssContent).toContain('var(--space-sm)');
    });
  });
});
