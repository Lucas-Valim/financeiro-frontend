import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../ExportButton';
import type { ExpenseReportSummary } from '@/types/reports';

function buildSummary(
  overrides: Partial<ExpenseReportSummary> = {}
): ExpenseReportSummary {
  return {
    expenseCount: 42,
    totalAmount: 12480,
    attachmentCount: 97,
    expensesWithoutAttachments: 0,
    exportLimit: 100,
    exceedsLimit: false,
    ...overrides,
  };
}

const MEGABYTE = 1024 * 1024;

describe('ExportButton', () => {
  it('desabilita o botão e explica a seleção vazia quando não há despesas', () => {
    render(
      <ExportButton
        summary={buildSummary({ expenseCount: 0 })}
        isExporting={false}
        receivedBytes={0}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByTestId('export-button')).toBeDisabled();
    expect(screen.getByTestId('export-explanation')).toHaveTextContent(
      'Nenhuma despesa'
    );
  });

  it('desabilita o botão e explica o teto quando o limite é excedido', () => {
    render(
      <ExportButton
        summary={buildSummary({
          exceedsLimit: true,
          expenseCount: 137,
          exportLimit: 100,
        })}
        isExporting={false}
        receivedBytes={0}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByTestId('export-button')).toBeDisabled();
    expect(screen.getByTestId('export-explanation')).toHaveTextContent(
      'limitada a 100 despesas'
    );
  });

  it('habilita o botão com despesas e sem estouro de teto', () => {
    const onExport = vi.fn();
    render(
      <ExportButton
        summary={buildSummary({ expenseCount: 42 })}
        isExporting={false}
        receivedBytes={0}
        onExport={onExport}
      />
    );

    const button = screen.getByTestId('export-button');
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('marca aria-busy e bloqueia novos cliques durante a exportação', () => {
    const onExport = vi.fn();
    render(
      <ExportButton
        summary={buildSummary({ expenseCount: 42 })}
        isExporting={true}
        receivedBytes={0}
        onExport={onExport}
      />
    );

    const button = screen.getByTestId('export-button');
    expect(button).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(button);
    expect(onExport).not.toHaveBeenCalled();
  });

  it('anuncia o estado da exportação numa região aria-live="polite"', () => {
    render(
      <ExportButton
        summary={buildSummary({ expenseCount: 42 })}
        isExporting={true}
        receivedBytes={0}
        onExport={vi.fn()}
      />
    );

    const status = screen.getByTestId('export-status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Gerando o pacote');
  });

  it('mostra a quantidade recebida quando os bytes começam a chegar', () => {
    render(
      <ExportButton
        summary={buildSummary({ expenseCount: 42 })}
        isExporting={true}
        receivedBytes={2 * MEGABYTE}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByTestId('export-status')).toHaveTextContent(
      '2 MB recebidos'
    );
  });
});
