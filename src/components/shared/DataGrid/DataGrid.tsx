import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { Column, DataGridProps } from './types';

const DEFAULT_ACTIONS_LABEL = 'Ações';
const DEFAULT_ACTIONS_WIDTH = '120px';
const DEFAULT_ERROR_TITLE = 'Erro ao carregar dados';
const SCROLL_DEBOUNCE_MS = 300;
const OBSERVER_THRESHOLD = 0.8;

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: unknown[]) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: unknown[]) {
    const later = () => {
      timeout = null;
      func(...(args as Parameters<T>));
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

function buildGridTemplate(
  columns: Column<unknown>[],
  actionsWidth: string | null
): string {
  const tracks = columns.map((column) => column.width);
  return actionsWidth ? [actionsWidth, ...tracks].join(' ') : tracks.join(' ');
}

function GridSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <>
      {Array.from({ length: 3 }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="p-4 grid gap-4 items-center border-b last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columnCount }).map((__, cellIndex) => (
            <Skeleton key={cellIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </>
  );
}

export function DataGrid<T>({
  items,
  columns,
  getRowId,
  isLoading,
  emptyMessage,
  renderActions,
  actionsLabel = DEFAULT_ACTIONS_LABEL,
  actionsWidth = DEFAULT_ACTIONS_WIDTH,
  error,
  errorTitle = DEFAULT_ERROR_TITLE,
  onRefresh,
  hasNextPage,
  onLoadMore,
  total,
  footerNoun,
  onCreate,
  createLabel,
  testIdPrefix,
}: DataGridProps<T>) {
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const tabletContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const showActions = Boolean(renderActions);
  const infiniteScroll = Boolean(onLoadMore);
  const cellColumnCount = columns.length + (showActions ? 1 : 0);
  const gridTemplate = buildGridTemplate(
    columns as Column<unknown>[],
    showActions ? actionsWidth : null
  );

  const handleLoadMore = () => {
    if (infiniteScroll && hasNextPage && !isLoading) {
      onLoadMore?.();
    }
  };

  const observerEnabled = infiniteScroll && Boolean(hasNextPage) && !isLoading;

  const { ref: desktopObserverRef } = useIntersectionObserver(handleLoadMore, {
    threshold: OBSERVER_THRESHOLD,
    enabled: observerEnabled,
    root: desktopContainerRef,
  });

  const { ref: tabletObserverRef } = useIntersectionObserver(handleLoadMore, {
    threshold: OBSERVER_THRESHOLD,
    enabled: observerEnabled,
    root: tabletContainerRef,
  });

  const { ref: mobileObserverRef } = useIntersectionObserver(handleLoadMore, {
    threshold: OBSERVER_THRESHOLD,
    enabled: observerEnabled,
    root: mobileContainerRef,
  });

  useEffect(() => {
    const containers = [
      desktopContainerRef.current,
      tabletContainerRef.current,
      mobileContainerRef.current,
    ].filter(Boolean);

    const debouncedScroll = debounce(() => {
      const activeContainer = containers.find((c) => c && c.scrollTop > 0);
      if (activeContainer) {
        setScrollPosition(activeContainer.scrollTop);
      }
    }, SCROLL_DEBOUNCE_MS);

    const handleScroll = () => {
      debouncedScroll();
    };

    containers.forEach((container) => {
      container?.addEventListener('scroll', handleScroll);
    });

    return () => {
      containers.forEach((container) => {
        container?.removeEventListener('scroll', handleScroll);
      });
    };
  }, []);

  const renderCreateButton = (): ReactNode => {
    if (!onCreate) return null;
    return (
      <div className="flex justify-end shrink-0">
        <Button onClick={onCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {createLabel}
        </Button>
      </div>
    );
  };

  if (error) {
    return (
      <div className="rounded-md border p-8 text-center" data-testid="error-state">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{errorTitle}</h3>
        <p className="text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={onRefresh} variant="outline">
          Tente novamente
        </Button>
      </div>
    );
  }

  if (items.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-4">
        {renderCreateButton()}
        <div className="rounded-md border p-8 text-center" data-testid="empty-state">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const firstVisible = items.length > 0 ? 1 : 0;
  const lastVisible = items.length;
  const counterText = `Mostrando ${firstVisible}-${lastVisible} de ${total} ${footerNoun ?? ''}`.trimEnd();

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {renderCreateButton()}

      {/* Desktop Table View */}
      <div
        ref={desktopContainerRef}
        className="hidden lg:block relative overflow-auto flex-1 rounded-md border"
        data-testid={`${testIdPrefix}-table-container`}
        style={{ scrollBehavior: 'smooth' }}
      >
        <table className="w-full caption-bottom text-sm" data-testid={`${testIdPrefix}-table`}>
          <thead className="sticky top-0 z-10 bg-background border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              {showActions && (
                <th
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  style={{ width: actionsWidth }}
                >
                  {actionsLabel}
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={getRowId(item)}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                {showActions && <td className="p-4">{renderActions?.(item)}</td>}
                {columns.map((column) => (
                  <td key={column.id} className="p-4 text-sm">
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {infiniteScroll && isLoading && items.length > 0 && (
          <div className="flex justify-center py-4" data-testid="loading-more-spinner">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {infiniteScroll && (
          <div ref={desktopObserverRef} className="h-4" data-testid="observer-target" />
        )}
      </div>

      {/* Tablet Horizontal Cards */}
      <div className="hidden md:block lg:hidden">
        <div
          ref={tabletContainerRef}
          className="relative overflow-auto flex-1 rounded-md border"
          data-testid={`${testIdPrefix}-tablet-container`}
        >
          <div
            className="sticky top-0 z-10 bg-background border-b px-4 py-3 grid gap-4 font-medium text-sm text-muted-foreground"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {showActions && <div>{actionsLabel}</div>}
            {columns.map((column) => (
              <div key={column.id}>{column.header}</div>
            ))}
          </div>
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={getRowId(item)}
                className="p-4 grid gap-4 items-center hover:bg-muted/50 border-b last:border-b-0"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {showActions && <div>{renderActions?.(item)}</div>}
                {columns.map((column) => (
                  <div key={column.id} className="text-sm">
                    {column.cell(item)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {infiniteScroll && isLoading && items.length > 0 && (
            <div className="flex justify-center py-4" data-testid="loading-more-spinner-tablet">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {infiniteScroll && <div ref={tabletObserverRef} className="h-4" />}
        </div>
      </div>

      {/* Mobile Vertical Cards */}
      <div className="md:hidden">
        <div
          ref={mobileContainerRef}
          className="relative overflow-auto flex-1 rounded-md border divide-y"
          data-testid={`${testIdPrefix}-mobile-container`}
        >
          {items.map((item) => (
            <div key={getRowId(item)} className="p-4 hover:bg-muted/50 border-b last:border-b-0">
              {showActions && <div className="flex justify-end mb-2">{renderActions?.(item)}</div>}
              <div className="space-y-2 text-sm">
                {columns.map((column) => (
                  <div key={column.id} className="flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">
                      {column.cardLabel ?? column.header}
                    </span>
                    <span className="text-right">{column.cell(item)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {isLoading && <GridSkeleton columnCount={cellColumnCount} />}
          {infiniteScroll && isLoading && items.length > 0 && (
            <div className="flex justify-center py-4" data-testid="loading-more-spinner-mobile">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {infiniteScroll && <div ref={mobileObserverRef} className="h-4" />}
        </div>
      </div>

      {/* Footer Counter */}
      {total !== undefined && (
        <div
          className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground border-t"
          data-testid="footer-counter"
        >
          <span>{counterText}</span>
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando...</span>
            </div>
          )}
        </div>
      )}

      {/* Scroll Position (for testing debounce) */}
      <div data-testid="scroll-position" style={{ display: 'none' }}>
        {scrollPosition}
      </div>
    </div>
  );
}
