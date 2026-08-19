import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * Cobertura E2E do cancelamento de despesa (`<final_check>` da demanda de
 * cancelamento). A tela é exercitada com o backend mockado via `page.route`
 * — mesmo padrão de `relatorios-despesas.spec.ts` e `categories.spec.ts` —
 * porque o webServer da suíte sobe apenas o Vite.
 *
 * O mock guarda o estado da despesa em memória: o DELETE muda o status para
 * CANCELLED, então o refetch disparado pela invalidação de cache devolve a
 * lista já sem a despesa aberta. É isso que comprova que a invalidação do
 * `useCancelExpense` realmente atualiza grid e cards.
 */

const DESPESA_URL = 'http://localhost:5173/despesa'

const OPEN_EXPENSE = {
  id: 'expense-open-1',
  organizationId: 'fca3c088-ba34-43a2-9b32-b2b1a1246915',
  categoryId: null,
  favorecidoId: null,
  description: 'Aluguel do escritório',
  amount: 1500,
  currency: 'BRL',
  dueDate: '2026-08-31T00:00:00.000Z',
  status: 'OPEN',
  paymentMethod: null,
  paymentProof: null,
  paymentProofUrl: null,
  paymentDate: null,
  receiver: 'Imobiliária Central',
  municipality: 'São Paulo',
  serviceInvoice: null,
  serviceInvoiceUrl: null,
  bankBillUrl: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
}

const PAID_EXPENSE = {
  ...OPEN_EXPENSE,
  id: 'expense-paid-1',
  description: 'Energia elétrica',
  status: 'PAID',
  paymentDate: '2026-08-10T00:00:00.000Z',
}

interface MockState {
  expenses: Array<Record<string, unknown>>
  deleteCalls: string[]
}

function summaryFor(expenses: Array<Record<string, unknown>>) {
  const bucket = (status: string) => {
    const matching = expenses.filter((expense) => expense.status === status)
    return {
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

/**
 * Instala o mock da API de despesas. O estado devolvido permite que o teste
 * inspecione as chamadas de cancelamento que chegaram ao backend.
 */
async function installExpensesMock(
  page: Page,
  initial: Array<Record<string, unknown>> = [OPEN_EXPENSE, PAID_EXPENSE]
): Promise<MockState> {
  const state: MockState = {
    expenses: initial.map((expense) => ({ ...expense })),
    deleteCalls: [],
  }

  // Registrado do menos para o mais específico: a última rota registrada tem
  // prioridade no Playwright, e `/expenses/summary` também casa com o padrão
  // de rota by-id.
  await page.route(
    (url) => url.pathname === '/expenses',
    async (route: Route) => {
      const status = new URL(route.request().url()).searchParams.get('status')
      const data = status
        ? state.expenses.filter((expense) => expense.status === status)
        : state.expenses

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data,
          pagination: { page: 1, limit: 10, total: data.length },
        }),
      })
    }
  )

  await page.route(
    (url) => /^\/expenses\/[^/]+$/.test(url.pathname),
    async (route: Route) => {
      if (route.request().method() !== 'DELETE') {
        await route.fallback()
        return
      }

      const id = new URL(route.request().url()).pathname.split('/').pop() as string
      state.deleteCalls.push(route.request().url())

      const expense = state.expenses.find((candidate) => candidate.id === id)
      if (!expense) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: `Expense with id ${id} not found` }),
        })
        return
      }

      expense.status = 'CANCELLED'
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(expense),
      })
    }
  )

  await page.route(
    (url) => url.pathname === '/expenses/summary',
    async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(summaryFor(state.expenses)),
      })
    }
  )

  return state
}

/**
 * O DataGrid renderiza tres variantes responsivas (table/tablet/mobile) do
 * mesmo dado, entao todo locator precisa ser escopado — senao o strict mode do
 * Playwright acusa multiplos matches.
 */
function grid(page: Page) {
  return page.getByTestId('expenses-table-container')
}

async function openActionsMenuFor(page: Page, description: string) {
  const row = grid(page)
    .getByRole('cell', { name: description })
    .locator('xpath=ancestor::tr[1]')
  await row.getByRole('button', { name: 'Open menu' }).click()
}

test.describe('Cancelamento de despesa', () => {
  test('mostra "Cancelar" no menu de uma despesa em aberto', async ({ page }) => {
    await installExpensesMock(page)
    await page.goto(DESPESA_URL)
    await expect(grid(page).getByText('Aluguel do escritório')).toBeVisible()

    await openActionsMenuFor(page, 'Aluguel do escritório')

    await expect(page.getByRole('menuitem', { name: 'Cancelar' })).toBeVisible()
  })

  test('não mostra "Cancelar" para uma despesa paga', async ({ page }) => {
    await installExpensesMock(page, [PAID_EXPENSE])
    // A tela abre com o filtro de abertas; esta rota (registrada depois, logo
    // com prioridade) devolve a despesa paga qualquer que seja o filtro.
    await page.route(
      (url) => url.pathname === '/expenses',
      async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [PAID_EXPENSE],
            pagination: { page: 1, limit: 10, total: 1 },
          }),
        })
      }
    )

    await page.goto(DESPESA_URL)
    await expect(grid(page).getByText('Energia elétrica')).toBeVisible()

    await openActionsMenuFor(page, 'Energia elétrica')

    await expect(page.getByRole('menuitem', { name: 'Ver Comprovante' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Cancelar' })).toHaveCount(0)
  })

  test('abre o diálogo de confirmação com a descrição da despesa', async ({ page }) => {
    await installExpensesMock(page)
    await page.goto(DESPESA_URL)
    await expect(grid(page).getByText('Aluguel do escritório')).toBeVisible()

    await openActionsMenuFor(page, 'Aluguel do escritório')
    await page.getByRole('menuitem', { name: 'Cancelar' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Cancelar Despesa')).toBeVisible()
    await expect(dialog).toContainText('Aluguel do escritório')
    await expect(dialog).toContainText('Esta ação não pode ser desfeita')
    // "Voltar" e não "Cancelar": o botão de dispensa não pode competir com a
    // própria ação destrutiva.
    await expect(dialog.getByRole('button', { name: 'Voltar' })).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: 'Confirmar Cancelamento' })
    ).toBeVisible()
  })

  test('"Voltar" fecha o diálogo sem chamar o backend', async ({ page }) => {
    const state = await installExpensesMock(page)
    await page.goto(DESPESA_URL)
    await expect(grid(page).getByText('Aluguel do escritório')).toBeVisible()

    await openActionsMenuFor(page, 'Aluguel do escritório')
    await page.getByRole('menuitem', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Voltar' }).click()

    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(state.deleteCalls).toHaveLength(0)
    await expect(grid(page).getByText('Aluguel do escritório')).toBeVisible()
  })

  test('confirma o cancelamento, avisa o usuário e some da lista de abertas', async ({
    page,
  }) => {
    const state = await installExpensesMock(page)
    await page.goto(DESPESA_URL)
    await expect(grid(page).getByText('Aluguel do escritório')).toBeVisible()

    await openActionsMenuFor(page, 'Aluguel do escritório')
    await page.getByRole('menuitem', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Confirmar Cancelamento' }).click()

    await expect(page.getByText('Despesa cancelada com sucesso')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // A invalidação de cache refaz o fetch; a despesa cancelada sai do filtro
    // padrão de abertas.
    await expect(grid(page).getByText('Aluguel do escritório')).toHaveCount(0)

    expect(state.deleteCalls).toHaveLength(1)
    expect(state.deleteCalls[0]).toContain('/expenses/expense-open-1')
    // O organizationId é injetado pelo interceptor do api-client, e o backend
    // passou a exigi-lo nas rotas by-id.
    expect(state.deleteCalls[0]).toContain('organizationId=')
  })

  test('mantém o diálogo aberto e mostra o erro em pt-BR quando o backend recusa', async ({
    page,
  }) => {
    await installExpensesMock(page)
    await page.route(
      (url) => url.pathname === '/expenses/expense-open-1',
      async (route: Route) => {
        if (route.request().method() !== 'DELETE') {
          await route.fallback()
          return
        }
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Cannot cancel expense with status PAID',
          }),
        })
      }
    )

    await page.goto(DESPESA_URL)
    await expect(grid(page).getByText('Aluguel do escritório')).toBeVisible()

    await openActionsMenuFor(page, 'Aluguel do escritório')
    await page.getByRole('menuitem', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Confirmar Cancelamento' }).click()

    await expect(
      page.getByText('Não é possível cancelar uma despesa paga ou já cancelada')
    ).toBeVisible()
    // O modal continua aberto para o usuário decidir se tenta de novo.
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
