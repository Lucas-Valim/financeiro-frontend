import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  RECURRING_EXPENSE_COLUMNS,
  RecurringAmountTypeBadge,
  RecurringExpenseStatusBadge,
  formatCurrency,
} from '../recurring-expense-columns';
import type { RecurringExpenseDTO } from '@/types/recurring-expenses';

const mockUseFavorecidos = vi.fn();

vi.mock('@/hooks/use-favorecidos', () => ({
  useFavorecidos: (organizationId: string) => mockUseFavorecidos(organizationId),
}));

const baseRecurrence: RecurringExpenseDTO = {
  id: 'rec-1',
  organizationId: 'org-1',
  description: 'Aluguel do escritório',
  favorecidoId: 'fav-1',
  categoryId: null,
  amountType: 'FIXED',
  amount: 1500,
  paymentMethod: null,
  municipality: 'São Paulo',
  dueDay: 5,
  // Datas construídas no fuso local para o formatador dd/MM/aaaa não escorregar
  // de dia por causa de UTC.
  startDate: new Date(2026, 0, 1),
  endDate: null,
  status: 'ACTIVE',
  terminationReason: null,
  terminatedAt: null,
  createdAt: new Date(2026, 0, 1),
  updatedAt: new Date(2026, 0, 1),
};

function column(id: string) {
  const found = RECURRING_EXPENSE_COLUMNS.find((col) => col.id === id);
  if (!found) throw new Error(`column ${id} not found`);
  return found;
}

function renderFavorecidos(favorecidos: { id: string; name: string }[], isLoading = false) {
  mockUseFavorecidos.mockReturnValue({
    favorecidos,
    isLoading,
    error: null,
  });
}

describe('formatCurrency', () => {
  it('formats values as BRL currency', () => {
    expect(formatCurrency(1500)).toMatch(/R\$\s*1\.500,00/);
  });

  it('falls back to zero for null/undefined', () => {
    expect(formatCurrency(null as unknown as number)).toMatch(/R\$\s*0,00/);
  });
});

describe('RECURRING_EXPENSE_COLUMNS', () => {
  beforeEach(() => {
    mockUseFavorecidos.mockReset();
    renderFavorecidos([]);
  });

  it('defines exactly the seven TechSpec columns in order', () => {
    expect(RECURRING_EXPENSE_COLUMNS.map((col) => col.id)).toEqual([
      'description',
      'favorecido',
      'amountType',
      'amount',
      'dueDay',
      'period',
      'status',
    ]);
  });

  it('gives every column a cardLabel for the mobile layout', () => {
    for (const col of RECURRING_EXPENSE_COLUMNS) {
      expect(col.cardLabel).toBeTruthy();
    }
  });

  describe('amountType column', () => {
    it('renders the "Fixo" badge for FIXED', () => {
      render(<>{column('amountType').cell({ ...baseRecurrence, amountType: 'FIXED' })}</>);
      expect(screen.getByText('Fixo')).toBeInTheDocument();
    });

    it('renders the "Variável" badge for VARIABLE', () => {
      render(<>{column('amountType').cell({ ...baseRecurrence, amountType: 'VARIABLE' })}</>);
      expect(screen.getByText('Variável')).toBeInTheDocument();
    });
  });

  describe('amount column', () => {
    it('marks the amount as reference for a VARIABLE recurrence', () => {
      render(<>{column('amount').cell({ ...baseRecurrence, amountType: 'VARIABLE' })}</>);
      expect(screen.getByTestId('amount-reference-note')).toBeInTheDocument();
      expect(screen.getByText('Valor de referência')).toBeInTheDocument();
    });

    it('does not mark a FIXED recurrence amount as reference', () => {
      render(<>{column('amount').cell({ ...baseRecurrence, amountType: 'FIXED' })}</>);
      expect(screen.queryByTestId('amount-reference-note')).not.toBeInTheDocument();
    });
  });

  describe('dueDay column', () => {
    it('renders "Todo dia N"', () => {
      expect(column('dueDay').cell({ ...baseRecurrence, dueDay: 5 })).toBe('Todo dia 5');
    });
  });

  describe('period column', () => {
    it('renders the interval with both dates when endDate is set', () => {
      const value = column('period').cell({
        ...baseRecurrence,
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 11, 31),
      }) as string;
      expect(value).toContain('01/01/2026');
      expect(value).toContain('31/12/2026');
    });

    it('renders the no-end text when endDate is null', () => {
      const value = column('period').cell({ ...baseRecurrence, endDate: null }) as string;
      expect(value).toContain('sem fim definido');
    });
  });

  describe('status column', () => {
    it('renders the "Ativa" badge for ACTIVE', () => {
      render(<>{column('status').cell({ ...baseRecurrence, status: 'ACTIVE' })}</>);
      expect(screen.getByText('Ativa')).toBeInTheDocument();
    });

    it('renders the "Encerrada" badge for ENDED', () => {
      render(<>{column('status').cell({ ...baseRecurrence, status: 'ENDED' })}</>);
      expect(screen.getByText('Encerrada')).toBeInTheDocument();
    });
  });

  describe('favorecido column', () => {
    it('shows the resolved name matching the favorecidoId', () => {
      renderFavorecidos([
        { id: 'fav-1', name: 'Imobiliária Central' },
        { id: 'fav-2', name: 'Outro Favorecido' },
      ]);
      render(<>{column('favorecido').cell({ ...baseRecurrence, favorecidoId: 'fav-1' })}</>);
      expect(screen.getByText('Imobiliária Central')).toBeInTheDocument();
    });

    it('shows a dash, not an empty string, while favorecidos are loading', () => {
      renderFavorecidos([], true);
      render(<>{column('favorecido').cell(baseRecurrence)}</>);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows a dash when the favorecidoId is absent from the loaded list', () => {
      renderFavorecidos([{ id: 'fav-2', name: 'Outro Favorecido' }]);
      render(<>{column('favorecido').cell({ ...baseRecurrence, favorecidoId: 'missing' })}</>);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });
});

describe('RecurringAmountTypeBadge', () => {
  it('renders "Fixo" with the fixed color family', () => {
    render(<RecurringAmountTypeBadge type="FIXED" />);
    expect(screen.getByText('Fixo').className).toContain('bg-blue-100');
  });

  it('renders "Variável" with the variable color family', () => {
    render(<RecurringAmountTypeBadge type="VARIABLE" />);
    expect(screen.getByText('Variável').className).toContain('bg-amber-100');
  });
});

describe('RecurringExpenseStatusBadge', () => {
  it('renders "Ativa" with the active color family', () => {
    render(<RecurringExpenseStatusBadge status="ACTIVE" />);
    expect(screen.getByText('Ativa').className).toContain('bg-green-100');
  });

  it('renders "Encerrada" with the ended color family', () => {
    render(<RecurringExpenseStatusBadge status="ENDED" />);
    expect(screen.getByText('Encerrada').className).toContain('bg-gray-100');
  });
});
