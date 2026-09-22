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
      <MissingDocumentsAlert items={[buildItem({ hasNoAttachments: true })]} />
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

  it('não lista as despesas na própria tela — só no modal', () => {
    render(<MissingDocumentsAlert items={[buildItem(), buildItem({ id: 'b' })]} />);

    expect(screen.queryByTestId('missing-documents-item')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deixa o botão "Ver despesas" fora da região de alerta', () => {
    render(<MissingDocumentsAlert items={[buildItem()]} />);

    const alert = screen.getByRole('alert');
    expect(
      within(alert).queryByTestId('missing-documents-open')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('missing-documents-open')).toHaveTextContent(
      'Ver despesas'
    );
  });

  it('abre o modal com a lista ao clicar em "Ver despesas" e fecha pelo botão Fechar', async () => {
    const user = userEvent.setup();
    render(
      <MissingDocumentsAlert
        items={[
          buildItem({ id: 'a', description: 'Primeira' }),
          buildItem({ id: 'b', description: 'Segunda' }),
        ]}
      />
    );

    await user.click(screen.getByTestId('missing-documents-open'));

    const dialog = screen.getByRole('dialog', {
      name: 'Despesas com documento faltando',
    });
    expect(within(dialog).getAllByTestId('missing-documents-item')).toHaveLength(2);
    expect(dialog).toHaveTextContent('Primeira');
    expect(dialog).toHaveTextContent('Segunda');

    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByTestId('missing-documents-open'));
  });
});
