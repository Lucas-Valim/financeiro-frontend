import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ActiveFiltersBadgeProps {
  count: number;
  onClear: () => void;
  showLabel?: boolean;
  size?: 'sm' | 'default';
}

export function ActiveFiltersBadge({ 
  count, 
  onClear, 
  showLabel = false,
  size = 'default' 
}: ActiveFiltersBadgeProps) {
  if (count === 0) return null;

  const badgeClassName = size === 'sm'
    ? 'bg-[var(--event-pending-bg)] text-[var(--event-pending-text)] border-[var(--event-pending-border)] text-xs'
    : 'bg-[var(--event-pending-bg)] text-[var(--event-pending-text)] border-[var(--event-pending-border)]';

  const buttonClassName = size === 'sm' 
    ? 'h-7 px-2' 
    : 'text-[var(--calendar-text-secondary)] hover:text-[var(--calendar-text-primary)]';

  return (
    <div className="flex items-center gap-1">
      <Badge variant="secondary" className={badgeClassName}>
        {showLabel ? `${count} ativo${count > 1 ? 's' : ''}` : count}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        aria-label="Limpar filtros"
        className={buttonClassName}
      >
        <X className="w-3 h-3" aria-hidden="true" />
        {showLabel && <span className="ml-1">Limpar</span>}
      </Button>
    </div>
  );
}
