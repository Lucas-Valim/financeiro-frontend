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
 * Pre-export figures the screen polls on every filter change. `exportLimit` is
 * served by the API so the frontend never hard-codes the cap (ADR-007).
 */
export interface ExpenseReportSummary {
  expenseCount: number;
  totalAmount: number;
  attachmentCount: number;
  expensesWithoutAttachments: number;
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
