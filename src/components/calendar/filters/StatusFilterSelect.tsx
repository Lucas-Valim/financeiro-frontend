import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_VALUE, STATUS_OPTIONS } from '../constants/calendar-filters';

interface StatusFilterSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  size?: 'sm' | 'default';
}

export function StatusFilterSelect({ value, onChange, size = 'default' }: StatusFilterSelectProps) {
  const triggerClassName = size === 'sm' 
    ? 'h-7 w-[90px] bg-white text-xs' 
    : 'w-full bg-white';

  return (
    <Select value={value ?? ALL_VALUE} onValueChange={onChange}>
      <SelectTrigger className={triggerClassName} aria-label="Filtrar por status">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>Todos</SelectItem>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
