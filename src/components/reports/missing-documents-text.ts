import type { ExpenseWithMissingDocuments } from '@/types/reports';

/** The one sentence both the banner and the dialog end with. */
export const MISSING_DOCUMENTS_GUIDANCE =
  'Confira o que falta em cada uma antes de enviar o relatório para a contabilidade.';

/** "1 despesa com documento faltando" / "N despesas com documento faltando". */
export function formatMissingDocumentsHeadline(count: number): string {
  const noun = count === 1 ? 'despesa' : 'despesas';
  return `${count} ${noun} com documento faltando`;
}

/**
 * Splits the headline count into the two kinds the client tells apart: the
 * expenses with nothing attached (the card's number, derived from the rows so
 * the two can never disagree) and the ones that carry some document but not
 * all. Parts at zero are left out; an empty list yields an empty string.
 */
export function formatMissingDocumentsBreakdown(
  items: ExpenseWithMissingDocuments[]
): string {
  const withoutAttachments = items.filter((item) => item.hasNoAttachments).length;
  const incomplete = items.length - withoutAttachments;
  const parts: string[] = [];
  if (withoutAttachments > 0) {
    parts.push(`${withoutAttachments} sem nenhum comprovante`);
  }
  if (incomplete > 0) {
    parts.push(`${incomplete} com documentação incompleta`);
  }
  return parts.join(' · ');
}
