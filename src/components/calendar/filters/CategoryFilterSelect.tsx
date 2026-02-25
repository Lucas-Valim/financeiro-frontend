import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CategoryDTO } from '@/types/categories';
import { ALL_VALUE } from '../constants/calendar-filters';

interface CategoryFilterSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  categories: CategoryDTO[];
  size?: 'sm' | 'default';
}

export function CategoryFilterSelect({ 
  value, 
  onChange, 
  categories, 
  size = 'default' 
}: CategoryFilterSelectProps) {
  const triggerClassName = size === 'sm' 
    ? 'h-7 w-[100px] bg-white text-xs' 
    : 'w-full bg-white';

  return (
    <Select value={value ?? ALL_VALUE} onValueChange={onChange}>
      <SelectTrigger className={triggerClassName} aria-label="Filtrar por categoria">
        <SelectValue placeholder="Categoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>Todas</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
