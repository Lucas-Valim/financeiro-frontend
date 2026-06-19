import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FavorecidoDTO } from '@/types/favorecidos';

export interface FavorecidoActionsProps {
  favorecido: FavorecidoDTO;
  onEdit: (favorecido: FavorecidoDTO) => void;
  onDelete: (favorecido: FavorecidoDTO) => void;
}

export function FavorecidoActions({ favorecido, onEdit, onDelete }: FavorecidoActionsProps) {
  const handleEdit = () => {
    onEdit(favorecido);
  };

  const handleDelete = () => {
    onDelete(favorecido);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label={`Ações de ${favorecido.name}`}
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
