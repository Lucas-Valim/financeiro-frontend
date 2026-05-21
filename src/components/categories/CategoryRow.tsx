import { useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CategoryDTO } from '@/types/categories';

export interface CategoryRowProps {
  category: CategoryDTO;
  onEdit: (category: CategoryDTO) => void;
  onDelete: (category: CategoryDTO) => void;
}

export function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const hasDescription = typeof category.description === 'string' && category.description !== '';

  const handleEdit = useCallback(() => {
    onEdit(category);
  }, [onEdit, category]);

  const handleDelete = useCallback(() => {
    onDelete(category);
  }, [onDelete, category]);

  return (
    <div
      data-testid="category-row"
      className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50 border-b last:border-b-0"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium truncate">{category.name}</span>
        {hasDescription && (
          <span
            data-testid="category-row-description"
            className="text-xs text-muted-foreground truncate"
          >
            {category.description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Editar categoria ${category.name}`}
          onClick={handleEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Excluir categoria ${category.name}`}
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
