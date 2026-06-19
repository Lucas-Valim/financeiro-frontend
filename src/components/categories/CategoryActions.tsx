import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CategoryDTO } from '@/types/categories';

export interface CategoryActionsProps {
  category: CategoryDTO;
  onEdit: (category: CategoryDTO) => void;
  onDelete: (category: CategoryDTO) => void;
}

export function CategoryActions({ category, onEdit, onDelete }: CategoryActionsProps) {
  const handleEdit = () => {
    onEdit(category);
  };

  const handleDelete = () => {
    onDelete(category);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label={`Ações de ${category.name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer" onSelect={handleEdit}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={handleDelete}
        >
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
