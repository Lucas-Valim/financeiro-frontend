import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissingDocumentsAlert } from '../MissingDocumentsAlert';
import { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseWithMissingDocuments } from '@/types/reports';

function buildItem(
  overrides: Partial<ExpenseWithMissingDocuments> = {}
): ExpenseWithMissingDocuments {
  return {
    id: 'expense-1',
    description: 'Aluguel sala',
    favorecidoName: 'Imobiliária Silva',
    dueDate: '2026-09-21T12:00:00.000Z',
    amount: 1200,
    status: ExpenseStatus.OVERDUE,
    missingDocuments: ['serviceInvoice'],
    hasNoAttachments: false,
    ...overrides,
  };
}

describe('MissingDocumentsAlert', () => {
  it('não renderiza nada quando não há despesa com documento faltando', () => {
    render(<MissingDocumentsAlert items={[]} />);

    expect(
      screen.queryByTestId('missing-documents-alert')
    ).not.toBeInTheDocument();
  });

  it('anuncia a contagem por texto acessível, no singular e no plural', () => {
    const { rerender } = render(
      <MissingDocumentsAlert
        items={[buildItem({ hasNoAttachments: true })]}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      '1 despesa com documento faltando'
    );

    rerender(
      <MissingDocumentsAlert
        items={[
          buildItem({ id: 'a', hasNoAttachments: true }),
          buildItem({ id: 'b' }),
        ]}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      '2 despesas com documento faltando'
    );
  });

  it('separa as sem nenhum comprovante das com documentação incompleta', () => {
    render(
      <MissingDocumentsAlert
        items={[
          buildItem({ id: 'a', hasNoAttachments: true }),
          buildItem({ id: 'b' }),
          buildItem({ id: 'c' }),
        ]}
      />
    );

    expect(screen.getByTestId('missing-documents-breakdown')).toHaveTextContent(
      '1 sem nenhum comprovante · 2 com documentação incompleta'
    );
  });

  it('omite a parte zerada da sublinha', () => {
    render(
      <MissingDocumentsAlert
        items={[buildItem()]}
      />
    );

    const breakdown = screen.getByTestId('missing-documents-breakdown');
    expect(breakdown).toHaveTextContent('1 com documentação incompleta');
    expect(breakdown).not.toHaveTextContent('sem nenhum comprovante');
  });

  it('lista descrição, favorecido, vencimento, valor e status em português', () => {
    render(
      <MissingDocumentsAlert
        items={[buildItem()]}
      />
    );

    const row = screen.getByTestId('missing-documents-item');
    expect(row).toHaveTextContent('Aluguel sala');
    expect(row).toHaveTextContent('Imobiliária Silva');
    expect(row).toHaveTextContent('vence 21/09/2026');
    expect(row).toHaveTextContent('R$ 1.200,00');
    expect(row).toHaveTextContent('Atrasada');
    expect(row).not.toHaveTextContent('OVERDUE');
  });

  it('mostra um chip por documento faltante, com o rótulo do cliente', () => {
    render(
      <MissingDocumentsAlert
        items={[
          buildItem({
            status: ExpenseStatus.PAID,
            missingDocuments: ['serviceInvoice', 'paymentProof'],
          }),
        ]}
      />
    );

    const row = screen.getByTestId('missing-documents-item');
    expect(within(row).getByTestId('missing-document-serviceInvoice')).toHaveTextContent(
      'Nota fiscal'
    );
    expect(within(row).getByTestId('missing-document-paymentProof')).toHaveTextContent(
      'Comprovante de pagamento'
    );
    expect(row).toHaveTextContent('Falta:');
  });

  it('marca "Sem nenhum anexo" apenas na despesa sem documento algum', () => {
    render(
      <MissingDocumentsAlert
        items={[
          buildItem({ id: 'none', hasNoAttachments: true }),
          buildItem({ id: 'partial' }),
        ]}
      />
    );

    const [withoutAny, partial] = screen.getAllByTestId('missing-documents-item');
    expect(
      within(withoutAny).getByTestId('missing-documents-none-attached')
    ).toHaveTextContent('Sem nenhum anexo');
    expect(
      within(partial).queryByTestId('missing-documents-none-attached')
    ).not.toBeInTheDocument();
  });

  it('preserva a ordem recebida, que é a ordem da planilha', () => {
    render(
      <MissingDocumentsAlert
        items={[
          buildItem({ id: 'first', description: 'Primeira' }),
          buildItem({ id: 'second', description: 'Segunda' }),
        ]}
      />
    );

    const rows = screen.getAllByTestId('missing-documents-item');
    expect(rows[0]).toHaveTextContent('Primeira');
    expect(rows[1]).toHaveTextContent('Segunda');
  });

  it('abre expandido e recolhe/expande pelo botão, expondo aria-expanded', async () => {
    const user = userEvent.setup();
    render(
      <MissingDocumentsAlert
        items={[buildItem()]}
      />
    );

    const toggle = screen.getByTestId('missing-documents-toggle');
    const list = screen.getByTestId('missing-documents-list');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveTextContent('Ocultar');
    expect(list).toBeVisible();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveTextContent('Mostrar');
    expect(list).not.toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '1 despesa com documento faltando'
    );

    await user.click(toggle);

    expect(list).toBeVisible();
  });

  it('mantém a lista no DOM quando recolhida, para o aria-controls sempre resolver', async () => {
    const user = userEvent.setup();
    render(<MissingDocumentsAlert items={[buildItem()]} />);

    const toggle = screen.getByTestId('missing-documents-toggle');
    await user.click(toggle);

    const controlledId = toggle.getAttribute('aria-controls');
    expect(controlledId).toBeTruthy();
    expect(document.getElementById(controlledId!)).toBe(
      screen.getByTestId('missing-documents-list')
    );
  });

  it('deixa o botão de recolher fora da região de alerta', () => {
    render(<MissingDocumentsAlert items={[buildItem()]} />);

    const alert = screen.getByRole('alert');
    expect(
      within(alert).queryByTestId('missing-documents-toggle')
    ).not.toBeInTheDocument();
    expect(alert).toHaveTextContent('1 despesa com documento faltando');
  });
});
