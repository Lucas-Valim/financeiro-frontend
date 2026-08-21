import { startOfMonth, endOfMonth } from 'date-fns';
import type { ExpenseFilter, ExpenseDTO } from '@/types/expenses';

export const EXPENSE_STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800',
  OVERDUE: 'bg-red-100 text-red-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
} as const;

/**
 * Classes de cor dos três marcadores de despesa gerada (`ExpenseMarkers`),
 * ao lado de `EXPENSE_STATUS_COLORS` para manter todo o vocabulário de badge da
 * aplicação em um só arquivo (ADR-002).
 *
 * A hierarquia é deliberada e precisa ser legível na varredura da lista, sem
 * tooltip: `recurringOrigin` é discreto (texto esmaecido, sem fundo),
 * `documentPending` é neutro (fundo cinza, mesma família de
 * `EXPENSE_STATUS_COLORS.CANCELLED`) e `amountPending` é evidente (âmbar).
 *
 * A família âmbar é PRÓPRIA e NÃO reaproveita os tokens `--event-pending-*` de
 * `calendar-tokens.css`: aqueles já são o fundo de todo evento pendente do
 * calendário, e um marcador âmbar sobre um card âmbar sumiria justamente na
 * superfície mais apertada.
 *
 * `calendarSyncFailed` é a quarta família e repete DELIBERADAMENTE o vermelho de
 * `EXPENSE_STATUS_COLORS.OVERDUE` (ADR-001): as duas coisas significam "isto
 * precisa de ação" e nunca renderizam na mesma coluna — o badge de status vive
 * na coluna de situação, os marcadores vivem sob a descrição. Âmbar está ocupado
 * por "valor a confirmar" (dinheiro) e cinza é a família do que apenas informa;
 * este é o único marcador que diz "o que você vê pode não estar na agenda" e
 * precisa vencer a varredura da lista. Uma entrada só de cor cobre os dois
 * status de falha (`FAILED` e `UNAUTHORIZED`): eles compartilham cor e ícone, e o
 * que os distingue é o `aria-label`, nunca a cor.
 */
export const EXPENSE_MARKER_COLORS = {
  recurringOrigin: 'text-gray-400',
  documentPending: 'bg-gray-100 text-gray-800',
  amountPending: 'bg-amber-100 text-amber-800',
  calendarSyncFailed: 'bg-red-100 text-red-800',
} as const;

export const EXPENSE_PAGE_LIMIT = 10;

export const ORGANIZATION_ID = 'fca3c088-ba34-43a2-9b32-b2b1a1246915';

export enum ExpenseStatus {
  OPEN = 'OPEN',
  OVERDUE = 'OVERDUE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

/**
 * Canonical payment methods accepted by the expense form and matched exactly by
 * the list/report queries (`payment_method` is compared verbatim on the
 * backend), which is why both the form and the filters offer a fixed list
 * instead of free text.
 */
export const PAYMENT_METHODS = [
  'Boleto',
  'PIX',
  'Transferência',
  'Guia',
] as const;

/**
 * Municípios atendidos, oferecidos como lista fixa nos formulários de despesa e
 * de recorrência. Fica aqui, ao lado de `PAYMENT_METHODS`, porque os dois
 * formulários precisam da mesma lista — mantê-la em cada arquivo de campos já
 * levou a duas cópias que só não divergiram por sorte.
 */
export const MUNICIPALITY_OPTIONS = [
  { value: 'Bento Gonçalves', label: 'Bento Gonçalves' },
  { value: 'Caxias do Sul', label: 'Caxias do Sul' },
  { value: 'Passo Fundo', label: 'Passo Fundo' },
  { value: 'Porto Alegre', label: 'Porto Alegre' },
] as const;

export const EXPENSE_STATUS_LABELS = {
  OPEN: 'Aberta',
  OVERDUE: 'Atrasada',
  PAID: 'Paga',
  CANCELLED: 'Cancelada',
} as const;

/**
 * Espelha a regra de domínio do backend (`ExpenseStatus.allowsEditing`):
 * despesas PAID e CANCELLED são estados terminais e não podem ser editadas.
 */
export function isExpenseEditable(status: ExpenseStatus): boolean {
  return status === ExpenseStatus.OPEN || status === ExpenseStatus.OVERDUE;
}

/**
 * Espelha a regra de domínio do backend (`ExpenseStatus.allowsCancellation`):
 * apenas despesas OPEN e OVERDUE podem ser canceladas. Mantida separada de
 * `isExpenseEditable` porque são regras distintas no backend que hoje apenas
 * coincidem.
 */
export function isExpenseCancellable(status: ExpenseStatus): boolean {
  return status === ExpenseStatus.OPEN || status === ExpenseStatus.OVERDUE;
}

/** Trechos das mensagens de domínio (em inglês) devolvidas pelo backend. */
const CANNOT_CANCEL_BACKEND_PREFIX = 'Cannot cancel expense with status';
const NOT_FOUND_BACKEND_SUFFIX = 'not found';

export const CANCEL_EXPENSE_ERROR_MESSAGES = {
  NOT_CANCELLABLE: 'Não é possível cancelar uma despesa paga ou já cancelada',
  NOT_FOUND: 'Despesa não encontrada',
  DEFAULT: 'Ocorreu um erro ao cancelar a despesa',
} as const;

/**
 * Traduz a mensagem de domínio do backend para o texto exibido no toast.
 * Qualquer mensagem desconhecida (inclusive erro de rede) cai no texto
 * genérico, para nunca vazar inglês ou detalhe técnico para o usuário.
 */
export function translateCancelExpenseError(message: string): string {
  if (message.startsWith(CANNOT_CANCEL_BACKEND_PREFIX)) {
    return CANCEL_EXPENSE_ERROR_MESSAGES.NOT_CANCELLABLE;
  }
  if (message.endsWith(NOT_FOUND_BACKEND_SUFFIX)) {
    return CANCEL_EXPENSE_ERROR_MESSAGES.NOT_FOUND;
  }
  return CANCEL_EXPENSE_ERROR_MESSAGES.DEFAULT;
}

/**
 * Espelha a invariante do backend (`Expense.pay`): uma despesa com valor ainda
 * não confirmado não pode ser paga, mesmo vencida. O 409 continua sendo a
 * autoridade — este espelho existe para explicar antes, não para substituir.
 *
 * NÃO usar para decidir se o item "Pagar" aparece no menu: essa decisão é de
 * `ExpenseActions`, que tem o próprio `isPayable` (status !== CANCELLED), e o
 * ADR-003 exige que "Pagar" continue visível na despesa com valor a confirmar.
 */
export function requiresAmountConfirmation(expense: ExpenseDTO): boolean {
  return expense.amountPendingConfirmation;
}

/**
 * Regra única que governa o marcador de falha da agenda e o item "Reenviar para
 * a agenda" (ADR-001): verdadeiro apenas em `FAILED` e `UNAUTHORIZED`, os dois
 * estados que pedem ação. `SYNCED` é a expectativa (não conquista) e `null` é a
 * despesa que ainda não entrou na integração — nenhum dos dois exibe marcador.
 *
 * A comparação é EXPLÍCITA contra os dois status de falha, e NÃO negação de
 * `SYNCED` nem teste de não-nulo: um quarto status futuro do backend cairia em
 * falha por acidente se a regra fosse por exclusão (risco registrado na
 * TechSpec). Esta é a única condição de falha do repositório — nenhum outro
 * arquivo compara `calendarSyncStatus` diretamente.
 */
export function hasCalendarSyncFailure(expense: ExpenseDTO): boolean {
  return (
    expense.calendarSyncStatus === 'FAILED' ||
    expense.calendarSyncStatus === 'UNAUTHORIZED'
  );
}

/** Trechos das mensagens (em inglês) devolvidas pelo backend na confirmação de valor. */
const AMOUNT_CONFIRMATION_REQUIRED_BACKEND = 'Expense amount must be confirmed before payment';
const AMOUNT_ALREADY_CONFIRMED_BACKEND = 'Expense amount is already confirmed';

export const CONFIRM_AMOUNT_ERROR_MESSAGES = {
  CONFIRMATION_REQUIRED: 'Confirme o valor do mês antes de pagar',
  ALREADY_CONFIRMED: 'O valor desta despesa já foi confirmado',
  DEFAULT: 'Ocorreu um erro ao confirmar o valor da despesa',
} as const;

/**
 * Traduz APENAS os dois erros de confirmação de valor que o backend devolve em
 * inglês (`AmountConfirmationRequiredError`, `AmountAlreadyConfirmedError`);
 * qualquer outra mensagem cai no texto genérico. Os erros de recorrência já
 * nascem em português e NÃO passam por aqui — devem ser exibidos com
 * `error.message` diretamente.
 */
export function translateConfirmAmountError(message: string): string {
  if (message.includes(AMOUNT_CONFIRMATION_REQUIRED_BACKEND)) {
    return CONFIRM_AMOUNT_ERROR_MESSAGES.CONFIRMATION_REQUIRED;
  }
  if (message.includes(AMOUNT_ALREADY_CONFIRMED_BACKEND)) {
    return CONFIRM_AMOUNT_ERROR_MESSAGES.ALREADY_CONFIRMED;
  }
  return CONFIRM_AMOUNT_ERROR_MESSAGES.DEFAULT;
}

/**
 * Mensagens dos toasts do reenvio manual para o Google Agenda, uma por desfecho
 * lido de `calendarSyncStatus` (ADR-002), mais um texto genérico. Vive aqui como
 * constante nomeada — e não como literal no hook — no molde de
 * `CONFIRM_AMOUNT_ERROR_MESSAGES`: o teste do hook precisa asseverar o texto
 * exato, e casar string literal duplicada entre hook e teste é a forma de a
 * mensagem divergir em silêncio numa reescrita.
 *
 * `SUCCESS`/`FAILED`/`UNAUTHORIZED` cobrem os três status; `DEFAULT` serve tanto
 * ao `default` do `switch` (um quarto status futuro do backend) quanto ao
 * `onError` (404, queda de rede). Nenhum desses textos entra em
 * `getErrorMessageByStatus`: aquele mapa é compartilhado por todo o sistema, e
 * uma mensagem sobre o Google Agenda apareceria em qualquer requisição que
 * devolvesse o mesmo código (ADR-002).
 */
export const RESYNC_CALENDAR_MESSAGES = {
  SUCCESS: 'Despesa enviada para o Google Agenda',
  FAILED:
    'Não foi possível enviar para o Google Agenda agora — a rotina diária tentará de novo automaticamente',
  UNAUTHORIZED:
    'Autorização do Google Agenda perdida — acione o suporte técnico',
  DEFAULT: 'Ocorreu um erro ao reenviar a despesa para o Google Agenda',
} as const;

/**
 * Builds the default expense filters applied when the page first loads:
 * open expenses within the current month. Returns fresh Date instances on
 * every call to avoid sharing mutable Date objects across renders.
 */
export function getDefaultExpenseFilters(): ExpenseFilter {
  const now = new Date();
  return {
    status: ExpenseStatus.OPEN,
    dueDateStart: startOfMonth(now),
    dueDateEnd: endOfMonth(now),
  };
}

/**
 * Checks whether the given filters match the default view (open + current
 * month with no extra filters). Used to decide when to show the "Limpar
 * Filtros" button.
 */
export function isDefaultExpenseFilters(filters: ExpenseFilter): boolean {
  const defaults = getDefaultExpenseFilters();
  return (
    filters.status === defaults.status &&
    filters.dueDateStart?.getTime() === defaults.dueDateStart?.getTime() &&
    filters.dueDateEnd?.getTime() === defaults.dueDateEnd?.getTime() &&
    !filters.receiver &&
    !filters.municipality &&
    !filters.paymentMethod &&
    !filters.categoryId
  );
}
