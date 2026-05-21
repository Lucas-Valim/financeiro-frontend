import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryDTO } from '@/types/categories';
import { CategoryRow } from './CategoryRow';

export interface CategoriesListProps {
  categories: CategoryDTO[];
  isLoading: boolean;
  onEdit: (category: CategoryDTO) => void;
  onDelete: (category: CategoryDTO) => void;
}

const SKELETON_ROW_COUNT = 3;

function CategoriesListSkeleton() {
  return (
    <div
      className="rounded-md border divide-y"
      data-testid="categories-list-loading"
      role="status"
      aria-label="Carregando categorias"
    >
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoriesList({
  categories,
  isLoading,
  onEdit,
  onDelete,
}: CategoriesListProps) {
  if (isLoading) {
    return <CategoriesListSkeleton />;
  }

  if (categories.length === 0) {
    return (
      <div
        data-testid="categories-list-empty"
        className="rounded-md border p-8 text-center"
      >
        <p className="text-muted-foreground">
          Nenhuma categoria cadastrada. Crie uma agora.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="categories-list" className="rounded-md border divide-y">
      {categories.map((category) => (
        <CategoryRow
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
