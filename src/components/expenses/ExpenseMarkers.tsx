import type { ReactNode } from 'react';
import {
  Repeat,
  FileClock,
  CircleAlert,
  CalendarX,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EXPENSE_MARKER_COLORS,
  hasCalendarSyncFailure,
} from '@/constants/expenses';
import type { ExpenseDTO } from '@/types/expenses';

/**
 * Onde os marcadores são renderizados. A lista tem espaço para o rótulo no
 * próprio marcador; o evento do calendário é apertado e reduz cada marcador a
 * um ícone, com o texto migrando para o `aria-label` do botão do evento via
 * {@link getExpenseMarkersLabel} (ADR-002).
 */
export type ExpenseMarkersDensity = 'list' | 'compact';

export interface ExpenseMarkersProps {
  expense: ExpenseDTO;
  density: ExpenseMarkersDensity;
}

/**
 * Rótulos acessíveis dos marcadores. Fonte única também para o texto: os badges
 * da lista os usam como `aria-label`, e {@link getExpenseMarkersLabel} os
 * concatena para o `aria-label` do evento no calendário.
 *
 * A falha de sincronização com a agenda tem DOIS rótulos para UMA só família de
 * cor (ADR-001): `FAILED` se resolve sozinho na reconciliação do dia seguinte,
 * `UNAUTHORIZED` não se resolve sem alguém agir. É o rótulo — nunca a cor — que
 * carrega a diferença entre esperar e acionar o suporte, respeitando a regra do
 * projeto de nenhum estado depender de cor.
 */
const MARKER_LABELS = {
  recurringOrigin: 'Gerada por recorrência',
  documentPending:
    'Documento pendente: boleto ou nota fiscal ainda não anexados',
  amountPending: 'Valor estimado do mês anterior — confirme antes de pagar',
  calendarSyncFailed:
    'Não foi possível enviar para o Google Agenda — a rotina diária tentará de novo',
  calendarSyncUnauthorized:
    'Autorização do Google Agenda perdida — acione o suporte técnico',
} as const;

/**
 * `labelKey` seleciona o texto acessível em {@link MARKER_LABELS}; a cor chega
 * já resolvida em `colorClass`. As duas chaves são SEPARADAS de propósito
 * (ADR-001): os dois status de falha da agenda apontam para rótulos distintos
 * (`calendarSyncFailed`/`calendarSyncUnauthorized`) mas para uma única cor
 * (`EXPENSE_MARKER_COLORS.calendarSyncFailed`), então `labelKey` não é mais
 * garantia de existir uma entrada de cor homônima. Qual rótulo usar é decidido
 * em {@link getActiveMarkers}, onde o status concreto está disponível.
 */
interface MarkerDefinition {
  labelKey: keyof typeof MARKER_LABELS;
  icon: LucideIcon;
  colorClass: string;
  testId: string;
}

/**
 * Deriva, na ordem de exibição, os marcadores ativos de uma despesa. Cada
 * condição vem direto do campo correspondente do DTO — nunca recalculada no
 * cliente (ADR-002): `documentPending` depende de dado que nem todo caminho de
 * leitura carrega, e reconstruí-lo marcaria despesas completas como pendentes.
 */
function getActiveMarkers(expense: ExpenseDTO): MarkerDefinition[] {
  const markers: MarkerDefinition[] = [];

  if (expense.recurringExpenseId !== null) {
    markers.push({
      labelKey: 'recurringOrigin',
      icon: Repeat,
      colorClass: EXPENSE_MARKER_COLORS.recurringOrigin,
      testId: 'expense-marker-recurring',
    });
  }

  if (expense.documentPending) {
    markers.push({
      labelKey: 'documentPending',
      icon: FileClock,
      colorClass: EXPENSE_MARKER_COLORS.documentPending,
      testId: 'expense-marker-document',
    });
  }

  if (expense.amountPendingConfirmation) {
    markers.push({
      labelKey: 'amountPending',
      icon: CircleAlert,
      colorClass: EXPENSE_MARKER_COLORS.amountPending,
      testId: 'expense-marker-amount',
    });
  }

  // Quarto e último: fala do sistema, não da despesa (ADR-001). A condição é a
  // função única `hasCalendarSyncFailure` — marcador e item de menu não podem
  // discordar. O rótulo se decide pelo status concreto (aqui, onde ele está
  // disponível); a cor é uma só para os dois status.
  if (hasCalendarSyncFailure(expense)) {
    markers.push({
      labelKey:
        expense.calendarSyncStatus === 'UNAUTHORIZED'
          ? 'calendarSyncUnauthorized'
          : 'calendarSyncFailed',
      icon: CalendarX,
      colorClass: EXPENSE_MARKER_COLORS.calendarSyncFailed,
      testId: 'expense-marker-calendar',
    });
  }

  return markers;
}

/**
 * Devolve os rótulos dos marcadores aplicáveis, concatenados, e string vazia
 * numa despesa manual sem nenhum marcador. É o único caminho pelo qual esse
 * texto chega ao leitor de tela na densidade compacta do calendário, onde o
 * `aria-label` do botão substitui o nome acessível de todo o conteúdo interno.
 */
export function getExpenseMarkersLabel(expense: ExpenseDTO): string {
  return getActiveMarkers(expense)
    .map((marker) => MARKER_LABELS[marker.labelKey])
    .join(', ');
}

function Marker({
  definition,
  density,
}: {
  definition: MarkerDefinition;
  density: ExpenseMarkersDensity;
}): ReactNode {
  const { icon: Icon, colorClass, testId, labelKey } = definition;
  const isList = density === 'list';

  return (
    <span
      data-testid={testId}
      role={isList ? 'img' : undefined}
      aria-label={isList ? MARKER_LABELS[labelKey] : undefined}
      aria-hidden={isList ? undefined : true}
      className={cn(
        'inline-flex items-center rounded-full',
        isList ? 'px-1.5 py-0.5' : 'p-0.5',
        colorClass
      )}
    >
      <Icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
    </span>
  );
}

/**
 * Fonte única dos indicadores de uma despesa — origem recorrente, documento
 * pendente, valor a confirmar e falha de sincronização com a agenda — consumida
 * tanto pela lista quanto pelo calendário (ADR-002). A regra de exibição e o
 * vocabulário visual vivem aqui; a prop de densidade apenas ajusta a
 * apresentação ao espaço disponível.
 */
export function ExpenseMarkers({
  expense,
  density,
}: ExpenseMarkersProps): ReactNode {
  const markers = getActiveMarkers(expense);

  if (markers.length === 0) return null;

  return (
    <span
      data-testid="expense-markers"
      className={cn(
        'inline-flex items-center gap-1',
        density === 'list' && 'flex-wrap'
      )}
    >
      {markers.map((definition) => (
        <Marker
          key={definition.labelKey}
          definition={definition}
          density={density}
        />
      ))}
    </span>
  );
}
