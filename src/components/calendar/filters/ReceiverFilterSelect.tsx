import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_VALUE } from '../constants/calendar-filters';

interface ReceiverFilterSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  receivers: string[];
  size?: 'sm' | 'default';
}

export function ReceiverFilterSelect({ 
  value, 
  onChange, 
  receivers, 
  size = 'default' 
}: ReceiverFilterSelectProps) {
  const triggerClassName = size === 'sm' 
    ? 'h-7 w-[110px] bg-white text-xs' 
    : 'w-full bg-white';

  return (
    <Select value={value ?? ALL_VALUE} onValueChange={onChange}>
      <SelectTrigger className={triggerClassName} aria-label="Filtrar por recebedor">
        <SelectValue placeholder="Recebedor" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>Todos</SelectItem>
        {receivers.map((receiver) => (
          <SelectItem key={receiver} value={receiver}>
            {receiver}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
