import { useEffect, useRef, useState } from 'react';
import { ExpenseRow } from './ExpenseRow';
import type { ExpensesGridProps } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, MoreVertical, Plus } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { ExpenseDTO } from '@/types/expenses';
import { EXPENSE_STATUS_COLORS } from '@/constants/expenses';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatAmount(amount: number): string {
  return currencyFormatter.format(amount ?? 0);
}

function formatDate(date: Date | string): string {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return dateFormatter.format(d);
  } catch {
    return 'N/A';
  }
}

function ActionsDropdown({
  expense,
  onEdit,
}: {
  expense: ExpenseDTO;
  onEdit?: (expense: ExpenseDTO) => void;
}) {
  const handleEdit = () => {
    onEdit?.(expense);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer" onSelect={handleEdit}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">Pay</DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">Cancel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <tr key={index} className="border-b">
          <td className="p-4">
            <Skeleton className="h-8 w-8" />
          </td>
          <td className="p-4">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="p-4">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="p-4">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="p-4">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="p-4">
            <Skeleton className="h-6 w-16" />
          </td>
        </tr>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border-b p-4 last:border-b-0">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </>
  );
}

function HorizontalCard({
  expense,
  onEdit,
}: {
  expense: ExpenseDTO;
  onEdit?: (expense: ExpenseDTO) => void;
}) {
  const statusColorClass = EXPENSE_STATUS_COLORS[expense.status] || '';

  return (
    <div className="p-4 grid grid-cols-5 gap-4 items-center hover:bg-muted/50 border-b last:border-b-0">
      <div className="w-[120px]">
        <ActionsDropdown expense={expense} onEdit={onEdit} />
      </div>
      <div className="w-[150px] text-sm">{formatAmount(expense.amount)}</div>
      <div className="w-[150px] text-sm">{expense.receiver ?? 'N/A'}</div>
      <div className="w-[150px] text-sm">{formatDate(expense.dueDate)}</div>
      <div className="w-[100px]">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusColorClass
          )}
        >
          {expense.status}
        </span>
      </div>
    </div>
  );
}

function VerticalCard({
  expense,
  onEdit,
}: {
  expense: ExpenseDTO;
  onEdit?: (expense: ExpenseDTO) => void;
}) {
  const statusColorClass = EXPENSE_STATUS_COLORS[expense.status] || '';

  const handleEdit = () => {
    onEdit?.(expense);
  };

  return (
    <div className="p-4 hover:bg-muted/50 border-b last:border-b-0">
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="h-8 px-2 text-xs"
        >
          Edit
        </Button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor:</span>
          <span>{formatAmount(expense.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fornecedor:</span>
          <span>{expense.receiver ?? 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Data de Vencimento:</span>
          <span>{formatDate(expense.dueDate)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status:</span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              statusColorClass
            )}
          >
            {expense.status}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ExpensesGrid({
  expenses,
  isLoading,
  error,
  hasNextPage,
  total,
  onLoadMore,
  onRefresh,
  onCreate,
  onEdit,
}: ExpensesGridProps) {
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const tabletContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleLoadMore = () => {
    if (hasNextPage && !isLoading) {
      onLoadMore();
    }
  };

  const { ref: desktopObserverRef } = useIntersectionObserver(handleLoadMore, {
    threshold: 0.8,
    enabled: hasNextPage && !isLoading,
    root: desktopContainerRef,
  });

  const { ref: tabletObserverRef } = useIntersectionObserver(handleLoadMore, {
    threshold: 0.8,
    enabled: hasNextPage && !isLoading,
    root: tabletContainerRef,
  });

  const { ref: mobileObserverRef } = useIntersectionObserver(handleLoadMore, {
    threshold: 0.8,
    enabled: hasNextPage && !isLoading,
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
    }, 300);

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

  const firstVisible = expenses.length > 0 ? 1 : 0;
  const lastVisible = expenses.length;
  const counterText = `Mostrando ${firstVisible}-${lastVisible} de ${total} despesas`;

  if (error) {
    return (
      <div className="rounded-md border p-8 text-center" data-testid="error-state">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error loading expenses</h3>
        <p className="text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={onRefresh} variant="outline">
          Tente novamente
        </Button>
      </div>
    );
  }

  if (expenses.length === 0 && !isLoading) {
    return (
      <div className="rounded-md border p-8 text-center" data-testid="empty-state">
        <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {/* Create Button */}
      {onCreate && (
        <div className="flex justify-end shrink-0">
          <Button onClick={onCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      )}

      {/* Desktop Table View */}
      <div
        ref={desktopContainerRef}
        className="hidden lg:block relative overflow-auto flex-1 rounded-md border"
        data-testid="expenses-table-container"
        style={{ scrollBehavior: 'smooth' }}
      >
        <table className="w-full caption-bottom text-sm" data-testid="expenses-table">
          <thead className="sticky top-0 z-10 bg-background border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                style={{ width: '120px' }}
              >
                Actions
              </th>
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                style={{ width: '150px' }}
              >
                Valor
              </th>
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                style={{ width: '150px' }}
              >
                Fornecedor
              </th>
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                style={{ width: '150px' }}
              >
                Data de Vencimento
              </th>
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                style={{ width: '100px' }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} onEdit={onEdit} />
            ))}
            {isLoading && <TableSkeleton />}
          </tbody>
        </table>
        {isLoading && expenses.length > 0 && (
          <div className="flex justify-center py-4" data-testid="loading-more-spinner">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div ref={desktopObserverRef} className="h-4" data-testid="observer-target" />
      </div>

      {/* Tablet Horizontal Cards */}
      <div className="hidden md:block lg:hidden">
        <div
          ref={tabletContainerRef}
          className="relative overflow-auto flex-1 rounded-md border"
          data-testid="expenses-tablet-container"
        >
          <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 grid grid-cols-5 gap-4 font-medium text-sm text-muted-foreground">
            <div style={{ width: '120px' }}>Actions</div>
            <div style={{ width: '150px' }}>Amount</div>
            <div style={{ width: '150px' }}>Fornecedor</div>
            <div style={{ width: '150px' }}>Due Date</div>
            <div style={{ width: '100px' }}>Status</div>
          </div>
          <div className="divide-y">
            {expenses.map((expense) => (
              <HorizontalCard key={expense.id} expense={expense} onEdit={onEdit} />
            ))}
            {isLoading && <CardSkeleton />}
          </div>
          {isLoading && expenses.length > 0 && (
            <div className="flex justify-center py-4" data-testid="loading-more-spinner-tablet">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div ref={tabletObserverRef} className="h-4" />
        </div>
      </div>

      {/* Mobile Vertical Cards */}
      <div className="md:hidden">
        <div
          ref={mobileContainerRef}
          className="relative overflow-auto flex-1 rounded-md border divide-y"
          data-testid="expenses-mobile-container"
        >
          {expenses.map((expense) => (
            <VerticalCard key={expense.id} expense={expense} onEdit={onEdit} />
          ))}
          {isLoading && <CardSkeleton />}
          {isLoading && expenses.length > 0 && (
            <div className="flex justify-center py-4" data-testid="loading-more-spinner-mobile">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div ref={mobileObserverRef} className="h-4" />
        </div>
      </div>

      {/* Footer Counter */}
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

      {/* Scroll Position Debug (for testing debounce) */}
      <div data-testid="scroll-position" style={{ display: 'none' }}>
        {scrollPosition}
      </div>
    </div>
  );
}
