import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Calendar Design Tokens', () => {
  let cssContent: string;

  beforeAll(() => {
    cssContent = readFileSync(
      join(process.cwd(), 'src/styles/calendar-tokens.css'),
      'utf-8'
    );
  });

  describe('Color Tokens', () => {
    it('should define calendar background color', () => {
      expect(cssContent).toContain('--calendar-bg');
    });

    it('should define calendar border color', () => {
      expect(cssContent).toContain('--calendar-border');
    });

    it('should define calendar today highlight color', () => {
      expect(cssContent).toContain('--calendar-today');
    });

    it('should define calendar text colors', () => {
      expect(cssContent).toContain('--calendar-text-primary');
      expect(cssContent).toContain('--calendar-text-secondary');
    });

    it('should define pending event colors', () => {
      expect(cssContent).toContain('--event-pending-bg');
      expect(cssContent).toContain('--event-pending-text');
      expect(cssContent).toContain('--event-pending-border');
    });

    it('should define paid event colors', () => {
      expect(cssContent).toContain('--event-paid-bg');
      expect(cssContent).toContain('--event-paid-text');
      expect(cssContent).toContain('--event-paid-border');
    });

    it('should define overdue event colors', () => {
      expect(cssContent).toContain('--event-overdue-bg');
      expect(cssContent).toContain('--event-overdue-text');
      expect(cssContent).toContain('--event-overdue-border');
    });
  });

  describe('Spacing Tokens', () => {
    it('should define all spacing tokens', () => {
      expect(cssContent).toContain('--space-xs');
      expect(cssContent).toContain('--space-sm');
      expect(cssContent).toContain('--space-md');
      expect(cssContent).toContain('--space-lg');
    });
  });

  describe('Motion Tokens', () => {
    it('should define view switch animation', () => {
      expect(cssContent).toContain('--motion-view-switch');
    });

    it('should define hover animation', () => {
      expect(cssContent).toContain('--motion-hover');
    });

    it('should define modal animation', () => {
      expect(cssContent).toContain('--motion-modal');
    });

    it('should define skeleton animation', () => {
      expect(cssContent).toContain('--motion-skeleton');
    });

    it('should define navigate animation', () => {
      expect(cssContent).toContain('--motion-navigate');
    });
  });

  describe('Color Values', () => {
    it('should use correct hex values for colors', () => {
      expect(cssContent).toContain('#FAFBFC');
      expect(cssContent).toContain('#E2E8F0');
      expect(cssContent).toContain('#EEF2FF');
    });
  });
});
