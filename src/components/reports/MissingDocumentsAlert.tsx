import { useId, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  EXPENSE_STATUS_COLORS,
  EXPENSE_STATUS_LABELS,
  REPORT_MISSING_DOCUMENT_COLORS,
  type ExpenseStatus,
} from '@/constants/expenses';
import { MISSING_DOCUMENT_LABELS } from '@/constants/reports';
import { formatCurrency } from '@/lib/formatCurrency';
import { formatDate } from '@/components/expenses-grid/expense-columns';
import type {
  ExpenseWithMissingDocuments,
  MissingDocument,
} from '@/types/reports';

export interface MissingDocumentsAlertProps {
  /** Every expense missing a document the accounting expects, in sheet order. */
  items: ExpenseWithMissingDocuments[];
}

const MISSING_DOCUMENT_ICONS: Record<MissingDocument, LucideIcon> = {
  serviceInvoice: FileText,
  paymentProof: Receipt,
};

const CHIP_BASE_CLASS =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium';

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Splits the headline count into the two kinds the client tells apart: the
 * expenses with nothing attached (the card's number, derived from the rows so
 * the two can never disagree) and the ones that carry some document but not
 * all. Parts at zero are left out.
 */
function buildBreakdown(items: ExpenseWithMissingDocuments[]): string {
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

function StatusPill({ status }: { status: ExpenseStatus }) {
  return (
    <span className={cn(CHIP_BASE_CLASS, EXPENSE_STATUS_COLORS[status])}>
      {EXPENSE_STATUS_LABELS[status]}
    </span>
  );
}

function MissingDocumentChip({ document }: { document: MissingDocument }) {
  const Icon = MISSING_DOCUMENT_ICONS[document];
  return (
    <span
      className={cn(CHIP_BASE_CLASS, REPORT_MISSING_DOCUMENT_COLORS.missingDocument)}
      data-testid={`missing-document-${document}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {MISSING_DOCUMENT_LABELS[document]}
    </span>
  );
}

function MissingDocumentChips({ item }: { item: ExpenseWithMissingDocuments }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Falta:</span>
      {item.missingDocuments.map((document) => (
        <MissingDocumentChip key={document} document={document} />
      ))}
      {item.hasNoAttachments && (
        <span
          className={cn(CHIP_BASE_CLASS, REPORT_MISSING_DOCUMENT_COLORS.noAttachments)}
          data-testid="missing-documents-none-attached"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          Sem nenhum anexo
        </span>
      )}
    </div>
  );
}

/**
 * Two lines tall on desktop — identity on the left, what is missing in the
 * middle, money and status on the right — so a handful of rows never pushes
 * the export button far below the fold. On phones the three blocks stack.
 */
function ExpenseRow({ item }: { item: ExpenseWithMissingDocuments }) {
  return (
    <li
      className="flex flex-col gap-2 py-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6"
      data-testid="missing-documents-item"
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{item.description}</p>
        <p className="text-sm text-muted-foreground">
          {item.favorecidoName} · vence {formatDate(item.dueDate)}
        </p>
      </div>
      <MissingDocumentChips item={item} />
      <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1">
        <span className="font-semibold tabular-nums">
          {formatCurrency(item.amount)}
        </span>
        <StatusPill status={item.status} />
      </div>
    </li>
  );
}

/**
 * The text-first part of the panel: counts and guidance. Only this block is
 * the `alert` — WAI-ARIA reserves that role for one-shot announcements, so
 * the toggle button stays outside it, as a sibling.
 */
function AlertHeadline({ items }: { items: ExpenseWithMissingDocuments[] }) {
  return (
    <div role="alert" className="flex min-w-0 flex-1 items-start gap-3">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {pluralize(
            items.length,
            'despesa com documento faltando',
            'despesas com documento faltando'
          )}
        </p>
        <p
          className="text-sm text-muted-foreground"
          data-testid="missing-documents-breakdown"
        >
          {buildBreakdown(items)}
        </p>
        <p className="text-sm text-muted-foreground">
          Confira o que falta em cada uma antes de enviar o relatório para a
          contabilidade.
        </p>
      </div>
    </div>
  );
}

/**
 * The report's "documento faltando" panel: a text-first alert with the counts,
 * followed by the list of WHICH expenses need a document, in the same order as
 * the exported sheet. It opens expanded — the whole point is answering "which
 * ones" without a click — and scrolls inside itself so the export button never
 * drops below the fold. The list stays mounted while collapsed (only hidden),
 * so the toggle's `aria-controls` always resolves. Nothing here depends on
 * colour alone: every chip has a label and the headline carries the numbers.
 * Renders nothing when the list is empty.
 */
export function MissingDocumentsAlert({ items }: MissingDocumentsAlertProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const listId = useId();

  if (items.length === 0) {
    return null;
  }

  const ToggleIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <div
      className="rounded-lg border border-destructive/50"
      data-testid="missing-documents-alert"
    >
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start">
        <AlertHeadline items={items} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          aria-controls={listId}
          data-testid="missing-documents-toggle"
          className="shrink-0 self-start sm:ml-8"
        >
          {isExpanded ? 'Ocultar' : 'Mostrar'}
          <ToggleIcon className="h-4 w-4" />
        </Button>
      </div>

      <ul
        id={listId}
        hidden={!isExpanded}
        className="max-h-80 divide-y overflow-y-auto border-t border-destructive/30 px-4"
        data-testid="missing-documents-list"
      >
        {items.map((item) => (
          <ExpenseRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}
