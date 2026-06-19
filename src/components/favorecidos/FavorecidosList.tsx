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
      emptyMessage="Nenhum favorecido encontrado"
      testIdPrefix="favorecidos"
    />
  );
}
