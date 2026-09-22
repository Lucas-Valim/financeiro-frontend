import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissingDocumentsDialog } from '../MissingDocumentsDialog';
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

describe('MissingDocumentsDialog', () => {
  it('não renderiza nada quando está fechado', () => {
    render(
      <MissingDocumentsDialog isOpen={false} onClose={vi.fn()} items={[buildItem()]} />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('não renderiza nada com a lista vazia, mesmo aberto', () => {
    render(<MissingDocumentsDialog isOpen onClose={vi.fn()} items={[]} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre com título e descrição contendo as contagens e a orientação', () => {
    render(
      <MissingDocumentsDialog
        isOpen
        onClose={vi.fn()}
        items={[buildItem({ id: 'a', hasNoAttachments: true }), buildItem({ id: 'b' })]}
      />
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Despesas com documento faltando',
    });
    const descriptionId = dialog.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId!)).toHaveTextContent(
      '2 despesas com documento faltando · 1 sem nenhum comprovante · 1 com documentação incompleta. Confira o que falta em cada uma antes de enviar o relatório para a contabilidade.'
    );
  });

  it('lista descrição, favorecido, vencimento, valor e status em português', () => {
    render(<MissingDocumentsDialog isOpen onClose={vi.fn()} items={[buildItem()]} />);

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
      <MissingDocumentsDialog
        isOpen
        onClose={vi.fn()}
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
      <MissingDocumentsDialog
        isOpen
        onClose={vi.fn()}
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
      <MissingDocumentsDialog
        isOpen
        onClose={vi.fn()}
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

  it('devolve o foco ao elemento indicado ao fechar', async () => {
    const user = userEvent.setup();
    const returnFocusTo = { current: null as HTMLButtonElement | null };
    function Harness() {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <>
          <button type="button" ref={(node) => { returnFocusTo.current = node; }}>
            Ver despesas
          </button>
          <MissingDocumentsDialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            items={[buildItem()]}
            returnFocusTo={returnFocusTo}
          />
        </>
      );
    }
    render(<Harness />);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ver despesas' }));
  });

  it('chama onClose pelo botão Fechar e pela tecla Esc', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MissingDocumentsDialog isOpen onClose={onClose} items={[buildItem()]} />);

    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
