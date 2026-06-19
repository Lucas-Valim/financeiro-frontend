import { DataGrid } from '@/components/shared/DataGrid/DataGrid';
import type { Column } from '@/components/shared/DataGrid/types';
import type { CategoryDTO } from '@/types/categories';
import { CategoryActions } from './CategoryActions';

export interface CategoriesListProps {
  categories: CategoryDTO[];
  isLoading: boolean;
  onEdit: (category: CategoryDTO) => void;
  onDelete: (category: CategoryDTO) => void;
}

const CATEGORY_COLUMNS: Column<CategoryDTO>[] = [
  {
    id: 'name',
    header: 'Nome',
    width: 'minmax(0,1fr)',
    cardLabel: 'Nome:',
    cell: (category) => category.name,
  },
  {
    id: 'description',
    header: 'Descrição',
    width: 'minmax(0,1.5fr)',
    cardLabel: 'Descrição:',
    cell: (category) => category.description || '—',
  },
];

export function CategoriesList({
  categories,
  isLoading,
  onEdit,
  onDelete,
}: CategoriesListProps) {
  return (
    <DataGrid<CategoryDTO>
      items={categories}
      columns={CATEGORY_COLUMNS}
      getRowId={(category) => category.id}
      renderActions={(category) => (
        <CategoryActions category={category} onEdit={onEdit} onDelete={onDelete} />
      )}
      isLoading={isLoading}
      emptyMessage="Nenhuma categoria cadastrada. Crie uma agora."
      testIdPrefix="categories"
    />
  );
}
