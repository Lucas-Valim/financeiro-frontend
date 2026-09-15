import { DataGrid } from '@/components/shared/DataGrid/DataGrid';
import type { Column } from '@/components/shared/DataGrid/types';
import type { FavorecidoDTO } from '@/types/favorecidos';
import { formatDocument } from '@/lib/format-document';
import { FavorecidoActions } from './FavorecidoActions';

export interface FavorecidosListProps {
  favorecidos: FavorecidoDTO[];
  isLoading: boolean;
  onEdit: (favorecido: FavorecidoDTO) => void;
  onDelete: (favorecido: FavorecidoDTO) => void;
  /** Renders the DataGrid error state with a retry button calling {@link onRefresh}. */
  error?: Error | null;
  onRefresh?: () => void;
  /** Total on the server; renders the "Mostrando X-Y de Z" footer when provided. */
  total?: number;
  /** Infinite scroll is enabled only when {@link onLoadMore} is provided. */
  hasNextPage?: boolean;
  onLoadMore?: () => void;
}

const FAVORECIDO_COLUMNS: Column<FavorecidoDTO>[] = [
  {
    id: 'name',
    header: 'Nome',
    width: 'minmax(0,1fr)',
    cardLabel: 'Nome:',
    cell: (favorecido) => favorecido.name,
  },
  {
    id: 'document',
    header: 'Documento',
    width: '220px',
    cardLabel: 'Documento:',
    cell: (favorecido) => formatDocument(favorecido.document),
  },
];

export function FavorecidosList({
  favorecidos,
  isLoading,
  onEdit,
  onDelete,
  error,
  onRefresh,
  total,
  hasNextPage,
  onLoadMore,
}: FavorecidosListProps) {
  return (
    <DataGrid<FavorecidoDTO>
      items={favorecidos}
      columns={FAVORECIDO_COLUMNS}
      getRowId={(favorecido) => favorecido.id}
      renderActions={(favorecido) => (
        <FavorecidoActions favorecido={favorecido} onEdit={onEdit} onDelete={onDelete} />
      )}
      isLoading={isLoading}
      error={error}
      errorTitle="Erro ao carregar favorecidos"
      onRefresh={onRefresh}
      emptyMessage="Nenhum favorecido encontrado"
      total={total}
      footerNoun="favorecidos"
      hasNextPage={hasNextPage}
      onLoadMore={onLoadMore}
      testIdPrefix="favorecidos"
    />
  );
}
