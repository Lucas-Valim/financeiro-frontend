import type { ExpenseStatus } from '@/constants/expenses';
import type { ExpenseFilter } from '@/types/expenses';

/**
 * Filters shared by both `/reports/expenses` endpoints. Mirrors the backend
 * query contract (task 05): the summary and the export accept the exact same
 * fields, so the screen computes the filters once and sends them to either.
 *
 * The contract is identical to the grid's {@link ExpenseFilter} — both screens
 * render the same filter fields — so this is an alias rather than a copy.
 * `organizationId` is not modelled here: the api client injects it (see
 * `injectOrganizationId`).
 */
export type ReportFilter = ExpenseFilter;

/**
 * A document the accounting expects and the expense does not carry. Mirrors the
 * backend rule: the service invoice is always expected, the payment proof only
 * once the expense is paid, and the bank bill never. The labels the screen
 * shows live in `MISSING_DOCUMENT_LABELS`.
 */
export type MissingDocument = 'serviceInvoice' | 'paymentProof';

/**
 * One expense the client still has to chase a document for, as listed under
 * the report's alert. `missingDocuments` is never empty. `hasNoAttachments`
 * keeps the card's "sem nenhum comprovante" rule traceable to the row.
 */
export interface ExpenseWithMissingDocuments {
  id: string;
  description: string;
  favorecidoName: string;
  dueDate: string;
  amount: number;
  status: ExpenseStatus;
  missingDocuments: MissingDocument[];
  hasNoAttachments: boolean;
}

/**
 * Pre-export figures the screen polls on every filter change. `exportLimit` is
 * served by the API so the frontend never hard-codes the cap (ADR-007).
 * `expensesWithMissingDocuments` says WHICH expenses need a document, in the
 * spreadsheet's order; the backend serves it, so it must be deployed first.
 */
export interface ExpenseReportSummary {
  expenseCount: number;
  totalAmount: number;
  attachmentCount: number;
  expensesWithoutAttachments: number;
  expensesWithMissingDocuments: ExpenseWithMissingDocuments[];
  exportLimit: number;
  exceedsLimit: boolean;
}

/**
 * The finished export. `filename` comes from the server's `content-disposition`
 * header — it is never reconstructed on the frontend.
 */
export interface ExpenseReportExport {
  blob: Blob;
  filename: string;
}
