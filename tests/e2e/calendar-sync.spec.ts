import { test, expect, type Page, type Route } from '@playwright/test'
import { RESYNC_CALENDAR_MESSAGES } from '../../src/constants/expenses'

/**
 * Cobertura E2E da Fase 2 da integração com o Google Agenda: marcador de falha na
 * lista, reenvio manual pelo menu (os três desfechos) e o atalho "Abrir no Google
 * Agenda". A tela é exercitada com o backend mockado por `page.route` — mesmo
 * padrão de `expense-cancel.spec.ts` e `recurring-expenses.spec.ts` — porque o
 * webServer da suíte sobe apenas o Vite.
 *
 * O mock guarda o estado da despesa em memória: no desfecho `SYNCED` o
 * `calendar-sync` muda `calendarSyncStatus` para `SYNCED`, então o refetch
 * disparado pela invalidação de `['expenses']` devolve a despesa já sincronizada e
 * o marcador some. É isso que comprova que a invalidação do
 * `useResyncExpenseCalendar` realmente atualiza a lista (ADR-002).
 *
 * O endpoint responde `200` NOS TRÊS DESFECHOS — inclusive na falha: o corpo
 * carrega o resultado em `calendarSyncStatus`, e não o código HTTP (ADR-002). Um
 * mock que respondesse `503` para `FAILED` testaria o caminho do `onError` (o do
 * `404` e da rede), que não é o caminho do resultado.
 *
 * Os textos dos toasts são asseverados PELA CONSTANTE `RESYNC_CALENDAR_MESSAGES`
 * (task 01), nunca por cópia reescrita aqui: uma cópia divergente transformaria
 * toda mudança de mensagem em teste vermelho sem causa aparente.
 */

const DESPESA_URL = 'http://localhost:5173/despesa'
const CALENDARIO_URL = 'http://localhost:5173/calendario'

const CALENDAR_EVENT_URL = 'https://calendar.google.com/calendar/event?eid=abc123'

const now = new Date()

/** Data de vencimento no mês corrente — a lista abre no mês atual e o calendário na data de hoje. */
function dueDateThisMonth(day: number): string {
  return new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0).toISOString()
}

type Expense = Record<string, unknown>

/**
 * Fixture de despesa como JSON puro (sem tipagem). Os DOIS campos novos
 * (`calendarSyncStatus`, `calendarEventUrl`) são acrescentados EXPLICITAMENTE:
 * não há erro de compilação avisando da ausência, e um campo faltando chega ao
 * componente como `undefined`, que não é nenhum dos quatro valores previstos.
 */
function buildExpense(overrides: Expense = {}): Expense {
  return {
    id: 'expense-cal-1',
    organizationId: 'fca3c088-ba34-43a2-9b32-b2b1a1246915',
    categoryId: null,
    favorecidoId: null,
    description: 'Aluguel do escritório',
    amount: 1500,
    currency: 'BRL',
    dueDate: dueDateThisMonth(15),
    status: 'OPEN',
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Imobiliária Central',
    municipality: 'Porto Alegre',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    recurringExpenseId: null,
    occurrenceMonth: null,
    amountPendingConfirmation: false,
    documentPending: false,
    calendarSyncStatus: null,
    calendarEventUrl: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

function emptyBucket() {
  return { count: 0, total: 0, estimatedCount: 0, estimatedTotal: 0 }
}

function summaryFor(expenses: Expense[]) {
  const bucket = (status: string) => {
    const matching = expenses.filter((e) => e.status === status)
    return {
      ...emptyBucket(),
      count: matching.length,
      total: matching.reduce((sum, e) => sum + (e.amount as number), 0),
    }
  }
  return {
    OPEN: bucket('OPEN'),
    OVERDUE: bucket('OVERDUE'),
    PAID: bucket('PAID'),
    CANCELLED: bucket('CANCELLED'),
  }
}

type ResyncOutcome = 'SYNCED' | 'FAILED' | 'UNAUTHORIZED'

interface MockState {
  expenses: Expense[]
  /** Desfecho devolvido pelo `calendar-sync`, no corpo de um `200`. */
  resyncOutcome: ResyncOutcome
  resyncCalls: string[]
}

interface SeedOptions {
  expenses?: Expense[]
  resyncOutcome?: ResyncOutcome
}

/**
 * Instala o mock da API de despesas com estado em memória. O predicado de rota é
 * ancorado no `pathname` da API, NUNCA um glob amplo: o Vite dev serve os
 * módulos-fonte (`/src/api/expenses-api.ts`) cujo nome contém "expenses"; um glob
 * os interceptaria e devolveria JSON no lugar do JS.
 */
async function installMock(page: Page, seed: SeedOptions = {}): Promise<MockState> {
  const state: MockState = {
    expenses: (seed.expenses ?? []).map((e) => ({ ...e })),
    resyncOutcome: seed.resyncOutcome ?? 'SYNCED',
    resyncCalls: [],
  }

  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route(
    (url) => url.pathname.startsWith('/expenses'),
    async (route) => {
      const request = route.request()
      const method = request.method()
      const url = new URL(request.url())
      const path = url.pathname

      if (method === 'GET' && path === '/expenses') {
        const status = url.searchParams.get('status')
        const data = status
          ? state.expenses.filter((e) => e.status === status)
          : state.expenses
        return json(route, 200, {
          data,
          pagination: { page: 1, limit: 10, total: data.length },
        })
      }

      if (method === 'GET' && path === '/expenses/summary') {
        return json(route, 200, summaryFor(state.expenses))
      }

      const resyncMatch = path.match(/^\/expenses\/([^/]+)\/calendar-sync$/)
      if (method === 'POST' && resyncMatch) {
        const id = resyncMatch[1]
        state.resyncCalls.push(request.url())
        const target = state.expenses.find((e) => e.id === id)

        // Só o desfecho SYNCED "conserta" a despesa; FAILED e UNAUTHORIZED a
        // deixam como está, então o refetch mantém o marcador na linha.
        if (target && state.resyncOutcome === 'SYNCED') {
          target.calendarSyncStatus = 'SYNCED'
        }

        // 200 nos três desfechos: o resultado vai no corpo, não no HTTP (ADR-002).
        return json(route, 200, {
          calendarSyncStatus: state.resyncOutcome,
          calendarEventUrl: (target?.calendarEventUrl as string | null) ?? null,
          calendarSyncedAt: '2026-08-21T10:00:00.000Z',
        })
      }

      return route.fallback()
    }
  )

  return state
}

/**
 * O DataGrid renderiza três variantes responsivas (table/tablet/mobile) do mesmo
 * dado, então todo locator precisa ser escopado — senão o strict mode do
 * Playwright acusa múltiplos matches.
 */
function grid(page: Page) {
  return page.getByTestId('expenses-table-container')
}

function rowFor(page: Page, description: string) {
  return grid(page)
    .getByRole('cell', { name: description })
    .locator('xpath=ancestor::tr[1]')
}

async function openMenuFor(page: Page, description: string) {
  await rowFor(page, description).getByRole('button', { name: 'Open menu' }).click()
}

test.describe('Reenvio para o Google Agenda', () => {
  test('FAILED → reenvio SYNCED → toast de sucesso e marcador some após o refetch', async ({
    page,
  }) => {
    const state = await installMock(page, {
      expenses: [buildExpense({ calendarSyncStatus: 'FAILED' })],
      resyncOutcome: 'SYNCED',
    })
    await page.goto(DESPESA_URL)

    const row = rowFor(page, 'Aluguel do escritório')
    await expect(row.getByTestId('expense-marker-calendar')).toBeVisible()

    await openMenuFor(page, 'Aluguel do escritório')
    await page.getByRole('menuitem', { name: 'Reenviar para a agenda' }).click()

    await expect(page.getByText(RESYNC_CALENDAR_MESSAGES.SUCCESS)).toBeVisible()
    // A invalidação de ['expenses'] refaz o fetch; a despesa volta SYNCED e o
    // marcador some da linha.
    await expect(row.getByTestId('expense-marker-calendar')).toHaveCount(0)

    expect(state.resyncCalls).toHaveLength(1)
    expect(state.resyncCalls[0]).toContain('/expenses/expense-cal-1/calendar-sync')
    // O organizationId é injetado pelo interceptor do api-client.
    expect(state.resyncCalls[0]).toContain('organizationId=')
  })

  test('FAILED → reenvio FAILED → toast promete nova tentativa e marcador permanece', async ({
    page,
  }) => {
    await installMock(page, {
      expenses: [buildExpense({ calendarSyncStatus: 'FAILED' })],
      resyncOutcome: 'FAILED',
    })
    await page.goto(DESPESA_URL)

    const row = rowFor(page, 'Aluguel do escritório')
    await expect(row.getByTestId('expense-marker-calendar')).toBeVisible()

    await openMenuFor(page, 'Aluguel do escritório')
    await page.getByRole('menuitem', { name: 'Reenviar para a agenda' }).click()

    await expect(page.getByText(RESYNC_CALENDAR_MESSAGES.FAILED)).toBeVisible()
    // A despesa continua em falha: o marcador permanece na linha após o refetch.
    await expect(row.getByTestId('expense-marker-calendar')).toBeVisible()
  })

  test('UNAUTHORIZED → reenvio UNAUTHORIZED → toast manda acionar o suporte e marcador permanece', async ({
    page,
  }) => {
    await installMock(page, {
      expenses: [buildExpense({ calendarSyncStatus: 'UNAUTHORIZED' })],
      resyncOutcome: 'UNAUTHORIZED',
    })
    await page.goto(DESPESA_URL)

    const row = rowFor(page, 'Aluguel do escritório')
    await expect(row.getByTestId('expense-marker-calendar')).toBeVisible()

    await openMenuFor(page, 'Aluguel do escritório')
    await page.getByRole('menuitem', { name: 'Reenviar para a agenda' }).click()

    await expect(page.getByText(RESYNC_CALENDAR_MESSAGES.UNAUTHORIZED)).toBeVisible()
    await expect(row.getByTestId('expense-marker-calendar')).toBeVisible()
  })

  test('despesa com calendarEventUrl oferece "Abrir no Google Agenda" apontando para a url em nova aba', async ({
    page,
  }) => {
    // Sincronizada: sem marcador e sem "Reenviar", mas com evento para abrir.
    await installMock(page, {
      expenses: [
        buildExpense({
          calendarSyncStatus: 'SYNCED',
          calendarEventUrl: CALENDAR_EVENT_URL,
        }),
      ],
    })

    // Captura o alvo do `window.open` sem sair da aplicação nem depender de rede
    // externa (o domínio do Google nunca é visitado).
    await page.addInitScript(() => {
      ;(window as unknown as { __openCalls: Array<[string, string]> }).__openCalls = []
      window.open = ((url?: string | URL, target?: string) => {
        ;(window as unknown as { __openCalls: Array<[string, string]> }).__openCalls.push([
          String(url),
          String(target),
        ])
        return null
      }) as typeof window.open
    })

    await page.goto(DESPESA_URL)
    await expect(grid(page).getByText('Aluguel do escritório')).toBeVisible()

    await openMenuFor(page, 'Aluguel do escritório')
    await page.getByRole('menuitem', { name: 'Abrir no Google Agenda' }).click()

    const openCalls = await page.evaluate(
      () => (window as unknown as { __openCalls: Array<[string, string]> }).__openCalls
    )
    expect(openCalls).toHaveLength(1)
    expect(openCalls[0][0]).toBe(CALENDAR_EVENT_URL)
    expect(openCalls[0][1]).toBe('_blank')
  })

  test('despesa SYNCED não exibe marcador nem oferece "Reenviar para a agenda"', async ({
    page,
  }) => {
    await installMock(page, {
      expenses: [buildExpense({ calendarSyncStatus: 'SYNCED' })],
    })
    await page.goto(DESPESA_URL)

    const row = rowFor(page, 'Aluguel do escritório')
    await expect(row).toBeVisible()
    await expect(row.getByTestId('expense-marker-calendar')).toHaveCount(0)

    await openMenuFor(page, 'Aluguel do escritório')
    await expect(
      page.getByRole('menuitem', { name: 'Reenviar para a agenda' })
    ).toHaveCount(0)
    // Sem url de evento, também não há "Abrir no Google Agenda".
    await expect(
      page.getByRole('menuitem', { name: 'Abrir no Google Agenda' })
    ).toHaveCount(0)
  })
})

test.describe('Densidade compacta do calendário (build de produção)', () => {
  /**
   * Risco do ADR-001: quatro marcadores empilhados dentro de um evento apertado
   * do calendário. Este cenário renderiza os quatro (recorrência + documento
   * pendente + valor a confirmar + falha de sincronização) e confirma que os
   * quatro ícones permanecem no evento e que o `aria-label` do botão concatena os
   * quatro rótulos — o único caminho pelo qual o texto chega ao leitor de tela na
   * densidade compacta.
   *
   * DEVE rodar em BUILD DE PRODUÇÃO (`npm run build` + `npm run preview`), fora do
   * `webServer` do Vite: o dev server difere do build em ordem de CSS e em
   * comportamento de portal, e o repositório já corrigiu algo que parecia certo no
   * dev e errado no build.
   */
  test('evento com os quatro marcadores permanece legível e o aria-label concatena os quatro rótulos', async ({
    page,
  }) => {
    await installMock(page, {
      expenses: [
        buildExpense({
          description: 'Internet corporativa',
          dueDate: dueDateThisMonth(15),
          recurringExpenseId: 'rec-1',
          amountPendingConfirmation: true,
          documentPending: true,
          calendarSyncStatus: 'FAILED',
        }),
      ],
    })
    await page.goto(CALENDARIO_URL)

    const event = page
      .getByRole('button', { name: /Internet corporativa/ })
      .first()
    await expect(event).toBeVisible()

    // Os quatro ícones renderizam dentro do evento (permanece legível).
    await expect(event.getByTestId('expense-marker-recurring')).toBeVisible()
    await expect(event.getByTestId('expense-marker-document')).toBeVisible()
    await expect(event.getByTestId('expense-marker-amount')).toBeVisible()
    await expect(event.getByTestId('expense-marker-calendar')).toBeVisible()

    // O aria-label concatena os quatro rótulos (nenhum estado depende de cor).
    const ariaLabel = (await event.getAttribute('aria-label')) ?? ''
    expect(ariaLabel).toContain('Gerada por recorrência')
    expect(ariaLabel).toContain('Documento pendente')
    expect(ariaLabel).toContain('Valor estimado do mês anterior')
    expect(ariaLabel).toContain('Não foi possível enviar para o Google Agenda')
  })
})
