import type { RefObject } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, FileText, Receipt } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  MISSING_DOCUMENTS_GUIDANCE,
  formatMissingDocumentsBreakdown,
  formatMissingDocumentsHeadline,
} from './missing-documents-text';

export interface MissingDocumentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Every expense missing a document the accounting expects, in sheet order. */
  items: ExpenseWithMissingDocuments[];
  /**
   * Element that receives focus when the dialog closes. The dialog is opened
   * from state, not from a `DialogTrigger`, so Radix has no trigger to return
   * focus to and would drop it on `body` — a keyboard user would lose their
   * place on the page.
   */
  returnFocusTo?: RefObject<HTMLElement | null>;
}

const MISSING_DOCUMENT_ICONS: Record<MissingDocument, LucideIcon> = {
  serviceInvoice: FileText,
  paymentProof: Receipt,
};

const CHIP_BASE_CLASS =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium';

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
 * Identity and what is missing on the left, money and status on the right.
 * Two blocks (not three columns): the dialog is narrow, and here height is
 * free — the body scrolls.
 */
function ExpenseRow({ item }: { item: ExpenseWithMissingDocuments }) {
  return (
    <li
      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
      data-testid="missing-documents-item"
    >
      <div className="min-w-0 space-y-1.5">
        <p className="truncate font-medium">{item.description}</p>
        <p className="text-sm text-muted-foreground">
          {item.favorecidoName} · vence {formatDate(item.dueDate)}
        </p>
        <MissingDocumentChips item={item} />
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
        <span className="font-semibold tabular-nums">
          {formatCurrency(item.amount)}
        </span>
        <StatusPill status={item.status} />
      </div>
    </li>
  );
}

/**
 * The list of WHICH expenses need a document, in the same order as the
 * exported sheet, opened from the report's "documento faltando" banner. Same
 * shell as the other tall modals of the app (`ExpenseFormModal`,
 * `TerminateRecurringExpenseDialog`): header and footer stay put, the body
 * scrolls. Radix wires the title and description to the dialog for assistive
 * tech, and closes on Esc, on the overlay and on the corner X.
 */
export function MissingDocumentsDialog({
  isOpen,
  onClose,
  items,
  returnFocusTo,
}: MissingDocumentsDialogProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  // Mirrors the banner's guard, so the dialog is safe on its own: with no
  // rows the description would read "· ." around an empty breakdown.
  if (items.length === 0) {
    return null;
  }

  const handleCloseAutoFocus = (event: Event) => {
    const target = returnFocusTo?.current;
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden"
        data-testid="missing-documents-dialog"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>Despesas com documento faltando</DialogTitle>
          <DialogDescription>
            {formatMissingDocumentsHeadline(items.length)} ·{' '}
            {formatMissingDocumentsBreakdown(items)}. {MISSING_DOCUMENTS_GUIDANCE}
          </DialogDescription>
        </DialogHeader>

        <ul
          className="min-h-0 flex-1 divide-y overflow-y-auto"
          data-testid="missing-documents-list"
        >
          {items.map((item) => (
            <ExpenseRow key={item.id} item={item} />
          ))}
        </ul>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
