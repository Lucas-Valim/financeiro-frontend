import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExportSummary } from '../ExportSummary';
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

describe('ExportSummary', () => {
  it('exibe a quantidade de despesas e o valor total formatado em pt-BR', () => {
    render(
      <ExportSummary
        summary={buildSummary({ expenseCount: 42, totalAmount: 12480 })}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('summary-expense-count')).toHaveTextContent('42');
    expect(screen.getByTestId('summary-total-amount')).toHaveTextContent(
      'R$ 12.480,00'
    );
  });

  it('exibe a quantidade de comprovantes que entrarão no pacote', () => {
    render(
      <ExportSummary
        summary={buildSummary({ attachmentCount: 97 })}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('summary-attachment-count')).toHaveTextContent(
      '97'
    );
  });

  it('mostra o alerta com a quantidade quando há despesas sem comprovante', () => {
    render(
      <ExportSummary
        summary={buildSummary({ expensesWithoutAttachments: 3 })}
        isLoading={false}
      />
    );

    const alert = screen.getByTestId('no-attachments-alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('3');
    expect(alert).toHaveTextContent('sem nenhum comprovante');
  });

  it('não renderiza o alerta quando não há despesas sem comprovante', () => {
    render(
      <ExportSummary
        summary={buildSummary({ expensesWithoutAttachments: 0 })}
        isLoading={false}
      />
    );

    expect(
      screen.queryByTestId('no-attachments-alert')
    ).not.toBeInTheDocument();
  });

  it('comunica o alerta por texto acessível, sem depender de classe de cor', () => {
    render(
      <ExportSummary
        summary={buildSummary({ expensesWithoutAttachments: 5 })}
        isLoading={false}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('5');
    expect(alert).toHaveTextContent('despesas sem nenhum comprovante');
  });

  it('informa a quantidade encontrada e o teto quando o limite é excedido', () => {
    render(
      <ExportSummary
        summary={buildSummary({
          exceedsLimit: true,
          expenseCount: 137,
          exportLimit: 100,
        })}
        isLoading={false}
      />
    );

    const warning = screen.getByTestId('limit-warning');
    expect(warning).toHaveTextContent('137');
    expect(warning).toHaveTextContent('100');
  });

  it('exibe o teto vindo da prop exportLimit, não de um literal', () => {
    const { rerender } = render(
      <ExportSummary
        summary={buildSummary({
          exceedsLimit: true,
          expenseCount: 137,
          exportLimit: 100,
        })}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('limit-warning')).toHaveTextContent('100');

    rerender(
      <ExportSummary
        summary={buildSummary({
          exceedsLimit: true,
          expenseCount: 137,
          exportLimit: 50,
        })}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('limit-warning')).toHaveTextContent('50');
    expect(screen.getByTestId('limit-warning')).not.toHaveTextContent('100');
  });

  it('apenas orienta e não sugere nem aplica recorte alternativo ao exceder o teto', () => {
    render(
      <ExportSummary
        summary={buildSummary({
          exceedsLimit: true,
          expenseCount: 137,
          exportLimit: 100,
        })}
        isLoading={false}
      />
    );

    const warning = screen.getByTestId('limit-warning');
    expect(warning).toHaveTextContent('Ajuste o período ou os filtros');
    expect(warning).not.toHaveTextContent('automaticamente');
  });

  it('exibe o estado de carregamento enquanto o resumo está indefinido', () => {
    render(<ExportSummary summary={undefined} isLoading={true} />);

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.queryByTestId('export-summary')).not.toBeInTheDocument();
  });
});
