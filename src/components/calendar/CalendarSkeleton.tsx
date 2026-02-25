import { useMemo } from 'react';
import type { CalendarView } from '@/types/calendar';

interface CalendarSkeletonProps {
  view: CalendarView;
}

export function CalendarSkeleton({ view }: CalendarSkeletonProps) {
  const gridConfig = useMemo(() => {
    switch (view) {
      case 'month':
        return { cols: 7, rows: 6, cells: 42 };
      case 'week':
        return { cols: 7, rows: 1, cells: 7 };
      case 'day':
        return { cols: 1, rows: 1, cells: 1 };
    }
  }, [view]);

  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${gridConfig.rows}, minmax(96px, auto))`,
      }}
      role="status"
      aria-busy="true"
      aria-label="Carregando calendário"
    >
      {Array.from({ length: gridConfig.cells }).map((_, i) => (
        <div
          key={i}
          className="h-24 bg-accent animate-pulse rounded-md"
        />
      ))}
      <span className="sr-only">Carregando eventos do calendário...</span>
    </div>
  );
}
