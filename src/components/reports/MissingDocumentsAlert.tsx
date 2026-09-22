import { useRef, useState } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExpenseWithMissingDocuments } from '@/types/reports';
import { MissingDocumentsDialog } from './MissingDocumentsDialog';
import {
  MISSING_DOCUMENTS_GUIDANCE,
  formatMissingDocumentsBreakdown,
  formatMissingDocumentsHeadline,
} from './missing-documents-text';

export interface MissingDocumentsAlertProps {
  /** Every expense missing a document the accounting expects, in sheet order. */
  items: ExpenseWithMissingDocuments[];
}

/**
 * The text-first part of the banner: counts and guidance. Only this block is
 * the `alert` — WAI-ARIA reserves that role for one-shot announcements, so
 * the button stays outside it, as a sibling.
 */
function AlertHeadline({ items }: { items: ExpenseWithMissingDocuments[] }) {
  return (
    <div role="alert" className="flex min-w-0 flex-1 items-start gap-3">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {formatMissingDocumentsHeadline(items.length)}
        </p>
        <p
          className="text-sm text-muted-foreground"
          data-testid="missing-documents-breakdown"
        >
          {formatMissingDocumentsBreakdown(items)}
        </p>
        <p className="text-sm text-muted-foreground">
          {MISSING_DOCUMENTS_GUIDANCE}
        </p>
      </div>
    </div>
  );
}

/**
 * The report's "documento faltando" banner: a compact, text-first alert with
 * the counts and a single button that opens the list of WHICH expenses need a
 * document in a dialog ({@link MissingDocumentsDialog}). The list is not
 * inlined on purpose — with a few dozen rows it used to push the rest of the
 * screen below the fold. Nothing here depends on colour alone. Renders
 * nothing when the list is empty.
 */
export function MissingDocumentsAlert({ items }: MissingDocumentsAlertProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="flex flex-col gap-3 rounded-lg border border-destructive/50 p-4 sm:flex-row sm:items-start"
        data-testid="missing-documents-alert"
      >
        <AlertHeadline items={items} />
        <Button
          ref={openButtonRef}
          type="button"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          data-testid="missing-documents-open"
          className="shrink-0 self-start sm:ml-8"
        >
          Ver despesas
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <MissingDocumentsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        items={items}
        returnFocusTo={openButtonRef}
      />
    </>
  );
}
