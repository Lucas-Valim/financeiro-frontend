import type { ReactNode } from 'react';

/**
 * Describes a single column of a {@link DataGrid}. The same definition drives
 * the desktop table, the tablet horizontal cards, and the mobile vertical cards.
 */
export interface Column<T> {
  /** Stable identifier used for React keys. */
  id: string;
  /** Header label shown in the desktop table head and tablet header row. */
  header: ReactNode;
  /**
   * CSS grid track / table width for this column (e.g. `'150px'` or
   * `'minmax(0,1fr)'`). Used both as the `<th>` width and within the
   * `gridTemplateColumns` of the card views.
   */
  width: string;
  /** Renders the cell content for a given item. */
  cell: (item: T) => ReactNode;
  /** Label shown before the value in the mobile vertical card. Defaults to {@link header}. */
  cardLabel?: ReactNode;
}

export interface DataGridProps<T> {
  items: T[];
  columns: Column<T>[];
  getRowId: (item: T) => string;
  isLoading: boolean;
  emptyMessage: string;

  /** Renders the per-row actions cell (e.g. a `⋮` dropdown). Omit to hide the actions column. */
  renderActions?: (item: T) => ReactNode;
  /** Header label for the actions column. Defaults to `'Ações'`. */
  actionsLabel?: string;
  /** Width of the actions column. Defaults to `'120px'`. */
  actionsWidth?: string;

  error?: Error | null;
  /** Title shown in the error state. Defaults to `'Erro ao carregar dados'`. */
  errorTitle?: string;
  onRefresh?: () => void;

  /** Infinite scroll is enabled only when {@link onLoadMore} is provided. */
  hasNextPage?: boolean;
  onLoadMore?: () => void;

  /** Footer counter is rendered only when {@link total} is provided. */
  total?: number;
  /** Noun used in the footer counter, e.g. `'despesas'`. */
  footerNoun?: string;

  /** Renders an in-grid create button when provided. */
  onCreate?: () => void;
  /** Label for the create button. */
  createLabel?: string;

  /** Namespaces the table and container data-testids (e.g. `'expenses'`). */
  testIdPrefix: string;
}
