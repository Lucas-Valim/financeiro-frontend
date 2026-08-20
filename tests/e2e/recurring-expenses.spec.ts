import { test, expect, type Page, type Route, type Locator } from '@playwright/test';
import { ORGANIZATION_ID } from '../../src/constants/expenses';
import {
  RECURRING_EXPENSE_STATUS_LABELS,
  RECURRENCE_AMOUNT_TYPE_LABELS,
} from '../../src/constants/recurring-expenses';

/**
 * Suíte E2E da funcionalidade de recorrências (task 09), cobrindo os dezesseis
 * cenários da tabela *Validação E2E (Playwright)* da TechSpec. Roda inteiramente
 * contra mocks de `page.route`, na convenção de `categories.spec.ts` e
 * `expense-cancel.spec.ts`: um instalador simula o CRUD em memória, cada teste faz
 * seu próprio `page.goto` e cria/observa dados sem backend. Nenhum registro real é
 * criado — a prova com dado real é responsabilidade da task 10.
 *
 * IMPORTANTE (ver task memory): os `page.route` usam predicado ancorado no
 * `pathname` da API, NUNCA um glob amplo. O Vite dev serve os
 * módulos-fonte (`/src/api/recurring-expenses-api.ts`) cujo nome contém o recurso;
 * um glob os interceptaria e devolveria JSON no lugar do JS, derrubando o import
 * dinâmico da rota.
 */

const FAVORECIDO_ID = '11111111-1111-4111-8111-111111111111';
const FAVORECIDO_NAME = 'Fornecedor Mensal';

const ISO = '2026-01-15T12:00:00.000Z';

const now = new Date();

/** Data de vencimento no mes corrente (o calendario abre na data de hoje). */
function dueDateThisMonth(day: number): string {
  return new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0).toISOString();
}

/* --------------------------------------------------------------- fixtures */

const FAVORECIDO = {
  id: FAVORECIDO_ID,
  organizationId: ORGANIZATION_ID,
  name: FAVORECIDO_NAME,
  document: '12345678000190',
  documentType: 'CNPJ',
  zipCode: null,
  street: null,
  number: null,
  city: null,
  state: null,
  phone: null,
  email: null,
  createdAt: ISO,
  updatedAt: ISO,
};

type Rec = Record<string, unknown>;

function buildRecurrence(overrides: Rec = {}): Rec {
  return {
    id: `rec-${Math.random().toString(36).slice(2, 10)}`,
    organizationId: ORGANIZATION_ID,
    description: 'Aluguel do escritório',
    favorecidoId: FAVORECIDO_ID,
    categoryId: null,
    amountType: 'FIXED',
    amount: 1500,
    paymentMethod: null,
    municipality: 'Porto Alegre',
    dueDay: 10,
    startDate: ISO,
    endDate: null,
    status: 'ACTIVE',
    terminationReason: null,
    terminatedAt: null,
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides,
  };
}

function buildExpense(overrides: Rec = {}): Rec {
  return {
    id: `exp-${Math.random().toString(36).slice(2, 10)}`,
    organizationId: ORGANIZATION_ID,
    categoryId: null,
    favorecidoId: FAVORECIDO_ID,
    description: 'Ocorrência gerada',
    amount: 1500,
    currency: 'BRL',
    dueDate: dueDateThisMonth(10),
    status: 'OPEN',
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: FAVORECIDO_NAME,
    municipality: 'Porto Alegre',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    recurringExpenseId: null,
    occurrenceMonth: null,
    amountPendingConfirmation: false,
    documentPending: false,
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides,
  };
}

function emptyBucket() {
  return { count: 0, total: 0, estimatedCount: 0, estimatedTotal: 0 };
}

function buildSummary(overrides: Record<string, Rec> = {}) {
  return {
    OPEN: emptyBucket(),
    OVERDUE: emptyBucket(),
    PAID: emptyBucket(),
    CANCELLED: emptyBucket(),
    ...overrides,
  };
}

/* ------------------------------------------------------------- mock state */

interface MockState {
  recurrences: Rec[];
  expenses: Rec[];
  summary: Record<string, Rec>;
  createRecurringCalls: number;
}

interface SeedOptions {
  recurrences?: Rec[];
  expenses?: Rec[];
  summary?: Record<string, Rec>;
}

/**
 * Instalador único do mock. Segura, em memória, recorrências, despesas geradas e o
 * resumo de status, além de favorecidos e categorias que o formulário carrega. A
 * criação de recorrência "materializa" ocorrências (empurra as despesas geradas),
 * o `confirm-amount` trava o valor da ocorrência e o encerramento cancela as
 * despesas em aberto — o suficiente para exercitar as superfícies sem backend.
 */
async function installMock(page: Page, seed: SeedOptions = {}): Promise<MockState> {
  const state: MockState = {
    recurrences: (seed.recurrences ?? []).map((r) => ({ ...r })),
    expenses: (seed.expenses ?? []).map((e) => ({ ...e })),
    summary: seed.summary ?? buildSummary(),
    createRecurringCalls: 0,
  };

  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  // Favorecidos (o combobox do formulário).
  await page.route(
    (url) => url.pathname.startsWith('/favorecidos'),
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await json(route, 200, {
        data: [FAVORECIDO],
        pagination: { page: 1, limit: 100, total: 1 },
      });
    },
  );

  // Categorias (opcional no formulário — devolvemos vazio).
  await page.route(
    (url) => url.pathname.startsWith('/categories'),
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await json(route, 200, { data: [], pagination: { page: 1, limit: 100, total: 0 } });
    },
  );

  // Recorrências.
  await page.route(
    (url) => url.pathname.startsWith('/recurring-expenses'),
    async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());
      const path = url.pathname;

      if (method === 'GET' && path === '/recurring-expenses') {
        return json(route, 200, {
          data: state.recurrences,
          pagination: { page: 1, limit: 100, total: state.recurrences.length },
        });
      }

      if (method === 'GET' && path === '/recurring-expenses/duplicate-check') {
        const favorecidoId = url.searchParams.get('favorecidoId');
        const amount = Number(url.searchParams.get('amount'));
        const dueDay = Number(url.searchParams.get('dueDay'));
        const duplicates = state.recurrences.filter(
          (r) => r.favorecidoId === favorecidoId && r.amount === amount && r.dueDay === dueDay,
        );
        return json(route, 200, { duplicates });
      }

      if (method === 'POST' && path === '/recurring-expenses') {
        state.createRecurringCalls += 1;
        const body = request.postDataJSON() as Rec;
        const recurrence = buildRecurrence({
          ...body,
          startDate: (body.startDate as string) ?? ISO,
          endDate: (body.endDate as string) ?? null,
        });
        state.recurrences.push(recurrence);

        const isVariable = recurrence.amountType === 'VARIABLE';
        const occurrence = buildExpense({
          description: recurrence.description as string,
          amount: recurrence.amount as number,
          dueDate: dueDateThisMonth(recurrence.dueDay as number),
          occurrenceMonth: dueDateThisMonth(1),
          recurringExpenseId: recurrence.id as string,
          amountPendingConfirmation: isVariable,
          documentPending: true,
        });
        state.expenses.push(occurrence);

        const generatedOccurrences = [
          {
            id: occurrence.id,
            recurringExpenseId: recurrence.id,
            description: recurrence.description,
            amount: recurrence.amount,
            dueDate: occurrence.dueDate,
            occurrenceMonth: occurrence.occurrenceMonth,
            status: 'OPEN',
            amountPendingConfirmation: isVariable,
          },
        ];
        return json(route, 201, { recurrence, generatedOccurrences });
      }

      const idMatch = path.match(/^\/recurring-expenses\/([^/]+)$/);
      if (method === 'PUT' && idMatch) {
        const id = idMatch[1];
        const body = request.postDataJSON() as Rec;
        const target = state.recurrences.find((r) => r.id === id);
        if (!target) return json(route, 404, { message: 'Recorrência não encontrada' });
        Object.assign(target, body, { updatedAt: new Date().toISOString() });
        return json(route, 200, target);
      }

      const previewMatch = path.match(/^\/recurring-expenses\/([^/]+)\/termination-preview$/);
      if (method === 'GET' && previewMatch) {
        const id = previewMatch[1];
        const effectiveDate = new Date(url.searchParams.get('effectiveDate') as string);
        const cancellable = state.expenses
          .filter((e) => e.recurringExpenseId === id && e.status === 'OPEN')
          .filter((e) => new Date(e.dueDate as string) >= effectiveDate)
          .map((e) => ({
            id: e.id,
            description: e.description,
            amount: e.amount,
            dueDate: e.dueDate,
            occurrenceMonth: e.occurrenceMonth,
            status: e.status,
          }));
        return json(route, 200, {
          effectiveDate: effectiveDate.toISOString(),
          cancellableExpenses: cancellable,
        });
      }

      const terminationMatch = path.match(/^\/recurring-expenses\/([^/]+)\/termination$/);
      if (method === 'POST' && terminationMatch) {
        const id = terminationMatch[1];
        const body = request.postDataJSON() as Rec;
        const effectiveDate = new Date(body.effectiveDate as string);
        const recurrence = state.recurrences.find((r) => r.id === id);
        if (!recurrence) return json(route, 404, { message: 'Recorrência não encontrada' });
        const cancelledExpenseIds: string[] = [];
        state.expenses
          .filter((e) => e.recurringExpenseId === id && e.status === 'OPEN')
          .filter((e) => new Date(e.dueDate as string) >= effectiveDate)
          .forEach((e) => {
            e.status = 'CANCELLED';
            cancelledExpenseIds.push(e.id as string);
          });
        recurrence.status = 'ENDED';
        recurrence.terminatedAt = new Date().toISOString();
        recurrence.terminationReason = (body.reason as string) ?? null;
        return json(route, 200, { recurrence, cancelledExpenseIds });
      }

      return route.fallback();
    },
  );

  // Despesas (superfícies dos marcadores, pagamento, confirmação e cards).
  await page.route(
    (url) => url.pathname.startsWith('/expenses'),
    async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());
      const path = url.pathname;

      if (method === 'GET' && path === '/expenses') {
        const status = url.searchParams.get('status');
        const data = status
          ? state.expenses.filter((e) => e.status === status)
          : state.expenses;
        return json(route, 200, {
          data,
          pagination: { page: 1, limit: 10, total: data.length },
        });
      }

      if (method === 'GET' && path === '/expenses/summary') {
        return json(route, 200, state.summary);
      }

      const confirmMatch = path.match(/^\/expenses\/([^/]+)\/confirm-amount$/);
      if (method === 'POST' && confirmMatch) {
        const id = confirmMatch[1];
        const target = state.expenses.find((e) => e.id === id);
        if (target) target.amountPendingConfirmation = false;
        return json(route, 200, { ...(target ?? {}), amountPendingConfirmation: false });
      }

      const payMatch = path.match(/^\/expenses\/([^/]+)\/pay$/);
      if (method === 'POST' && payMatch) {
        const id = payMatch[1];
        const target = state.expenses.find((e) => e.id === id);
        if (target) {
          target.status = 'PAID';
          target.paymentDate = new Date().toISOString();
        }
        return json(route, 200, { id, status: 'PAID' });
      }

      return route.fallback();
    },
  );

  return state;
}

/* --------------------------------------------------------------- helpers */

function recurringGrid(page: Page): Locator {
  return page.getByTestId('recurring-expenses-table-container');
}

function expensesGrid(page: Page): Locator {
  return page.getByTestId('expenses-table-container');
}

/**
 * Navega para `/recorrencias` de forma resiliente. Se a ErrorBoundary aparecer
 * (import dinâmico derrubado por re-otimização de deps do Vite no primeiro
 * acesso), recarrega — depois de pré-bundlada, o acesso funciona.
 */
async function gotoRecorrencias(page: Page) {
  const ready = page.getByText('Cadastre e acompanhe as despesas que se repetem todo mês');
  const boundary = page.getByText('Something went wrong!');
  await page.goto('http://localhost:5173/recorrencias');
  for (let attempt = 0; attempt < 4; attempt++) {
    const outcome = await Promise.race([
      ready.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'ok').catch(() => 'x'),
      boundary.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'error').catch(() => 'x'),
    ]);
    if (outcome === 'ok') return;
    await page.reload();
  }
  await expect(ready).toBeVisible();
}

async function openCreateModal(page: Page) {
  await page.getByRole('button', { name: 'Nova Recorrência' }).click();
  await expect(page.getByRole('heading', { name: 'Nova recorrência' })).toBeVisible();
}

/**
 * Abre um Radix Select pelo nome acessível do gatilho (`combobox`) e escolhe a
 * opção (renderizada em portal, por isso buscada em `page`).
 */
async function selectDropdown(page: Page, dialog: Locator, comboboxName: string, optionName: string) {
  await dialog.getByRole('combobox', { name: comboboxName }).click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

/** Escolhe o favorecido no Combobox (Popover + Command). */
async function selectFavorecido(page: Page, dialog: Locator) {
  await dialog.getByText('Selecione um favorecido').click();
  await page.getByRole('option', { name: FAVORECIDO_NAME }).click();
}

/** Seleciona um dia no popup do `react-datepicker` já aberto. */
async function selectDay(page: Page, day: number) {
  const cls = String(day).padStart(3, '0');
  await page
    .locator(`.react-datepicker__day--${cls}:not(.react-datepicker__day--outside-month)`)
    .first()
    .click();
}

interface FormValues {
  description: string;
  amountDigits: string;
  dueDay: number;
  amountType?: 'FIXED' | 'VARIABLE';
  startDay?: number;
}

/** Preenche todos os campos obrigatórios do formulário de recorrência. */
async function fillRecurringForm(page: Page, values: FormValues) {
  const dialog = page.getByRole('dialog');
  const variable = values.amountType === 'VARIABLE';

  await dialog.getByLabel('Descrição').fill(values.description);

  if (variable) {
    await selectDropdown(page, dialog, 'Tipo de valor', RECURRENCE_AMOUNT_TYPE_LABELS.VARIABLE);
  }

  const amountLabel = variable ? 'Valor de referência' : 'Valor da despesa';
  await dialog.getByLabel(amountLabel).fill(values.amountDigits);
  await dialog.getByLabel('Dia do vencimento').fill(String(values.dueDay));

  await selectFavorecido(page, dialog);
  await selectDropdown(page, dialog, 'Município', 'Porto Alegre');

  await dialog.getByRole('button', { name: 'Data de início' }).click();
  await selectDay(page, values.startDay ?? 15);
}

/** Fluxo completo de criação pela interface, encerrando na tela de ocorrências. */
async function createRecurringViaUi(page: Page, values: FormValues) {
  await openCreateModal(page);
  await fillRecurringForm(page, values);
  await page.getByRole('button', { name: 'Criar Recorrência' }).click();
  await expect(page.getByRole('heading', { name: 'Recorrência criada' })).toBeVisible();
  await page.getByRole('button', { name: 'Concluir' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

/** Abre o menu de ações de uma linha da grade de recorrências pela descrição. */
async function openRecurringActions(page: Page, description: string) {
  const row = recurringGrid(page)
    .getByRole('cell', { name: description })
    .locator('xpath=ancestor::tr[1]');
  await row.getByRole('button', { name: 'Open menu' }).click();
}

/** Abre o menu de ações de uma linha da grade de despesas pela descrição. */
async function openExpenseActions(page: Page, description: string) {
  const row = expensesGrid(page)
    .getByRole('cell', { name: description })
    .locator('xpath=ancestor::tr[1]');
  await row.getByRole('button', { name: 'Open menu' }).click();
}

/* --------------------------------------------------------------- cenários */

test.describe('E2E: Recorrências', () => {
  // A rota puxa `react-datepicker` por import dinâmico; a primeira carga pode
  // exigir o reload da `gotoRecorrencias`, então damos folga de tempo.
  test.slow();

  test('Cenário 1: clicar em "Recorrências" na barra lateral leva a /recorrencias', async ({ page }) => {
    await installMock(page);
    await page.goto('http://localhost:5173/');

    // Recorrências vive no grupo "Cadastros", recolhido fora das suas rotas.
    await page.getByRole('button', { name: 'Cadastros', exact: true }).click();
    await page.getByRole('link', { name: 'Recorrências' }).click();

    // A navegação client-side também importa a rota dinamicamente; recupera do
    // eventual erro de import recarregando.
    const ready = page.getByText('Cadastre e acompanhe as despesas que se repetem todo mês');
    const boundary = page.getByText('Something went wrong!');
    for (let attempt = 0; attempt < 4; attempt++) {
      const outcome = await Promise.race([
        ready.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'ok').catch(() => 'x'),
        boundary.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'error').catch(() => 'x'),
      ]);
      if (outcome === 'ok') break;
      await page.reload();
    }

    await expect(page).toHaveURL(/\/recorrencias/);
    await expect(ready).toBeVisible();
  });

  test('Cenário 2: página sem recorrências exibe a mensagem de lista vazia', async ({ page }) => {
    await installMock(page);
    await gotoRecorrencias(page);

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByText('Nenhuma recorrência encontrada')).toBeVisible();
  });

  test('Cenário 3: criar recorrência de valor fixo mostra ocorrências, linha e toast', async ({ page }) => {
    await installMock(page);
    await gotoRecorrencias(page);

    await openCreateModal(page);
    await fillRecurringForm(page, {
      description: 'Assinatura de software',
      amountDigits: '150000',
      dueDay: 10,
    });
    await page.getByRole('button', { name: 'Criar Recorrência' }).click();

    await expect(page.getByRole('heading', { name: 'Recorrência criada' })).toBeVisible();
    await expect(page.getByTestId('generated-occurrences-list')).toBeVisible();
    await expect(page.getByTestId('generated-occurrence-item').first()).toBeVisible();
    await expect(page.getByText('Recorrência criada com sucesso')).toBeVisible();

    await page.getByRole('button', { name: 'Concluir' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(
      recurringGrid(page).getByText('Assinatura de software'),
    ).toBeVisible();
  });

  test('Cenário 4: alternar para "Valor variável" muda o rótulo do campo de valor', async ({ page }) => {
    await installMock(page);
    await gotoRecorrencias(page);

    await openCreateModal(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Valor da despesa')).toBeVisible();

    await selectDropdown(page, dialog, 'Tipo de valor', RECURRENCE_AMOUNT_TYPE_LABELS.VARIABLE);

    await expect(dialog.getByText('Valor de referência')).toBeVisible();
    await expect(dialog.getByTestId('amount-help')).toContainText('cada mês pode ser confirmado');
  });

  test('Cenário 5: dia de vencimento 32 exibe erro inline e não chama a API', async ({ page }) => {
    const state = await installMock(page);
    await gotoRecorrencias(page);

    await openCreateModal(page);
    await page.getByRole('dialog').getByLabel('Dia do vencimento').fill('32');
    await page.getByRole('button', { name: 'Criar Recorrência' }).click();

    await expect(
      page.getByText('O dia de vencimento deve estar entre 1 e 31'),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(state.createRecurringCalls).toBe(0);
  });

  test('Cenário 6: data-fim anterior à data de início exibe erro inline e não chama a API', async ({ page }) => {
    const state = await installMock(page);
    await gotoRecorrencias(page);

    await openCreateModal(page);
    // A validação de período é uma `refine` de objeto (Zod só a roda com os demais
    // campos válidos), então preenchemos tudo e deixamos apenas a data-fim inválida.
    await fillRecurringForm(page, {
      description: 'Aluguel anual',
      amountDigits: '150000',
      dueDay: 10,
      startDay: 15,
    });
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Data-fim' }).click();
    await selectDay(page, 10);

    await page.getByRole('button', { name: 'Criar Recorrência' }).click();

    await expect(
      page.getByText('A data-fim deve ser posterior à data de início'),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(state.createRecurringCalls).toBe(0);
  });

  test('Cenário 7: segunda recorrência com mesmos dados dispara aviso de duplicidade', async ({ page }) => {
    await installMock(page);
    await gotoRecorrencias(page);

    await createRecurringViaUi(page, {
      description: 'Aluguel matriz',
      amountDigits: '250000',
      dueDay: 5,
    });

    await openCreateModal(page);
    await fillRecurringForm(page, {
      description: 'Aluguel matriz (2)',
      amountDigits: '250000',
      dueDay: 5,
    });
    await page.getByRole('button', { name: 'Criar Recorrência' }).click();

    await expect(
      page.getByRole('heading', { name: 'Recorrências parecidas encontradas' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Criar mesmo assim' }).click();
    await expect(page.getByRole('heading', { name: 'Recorrência criada' })).toBeVisible();
  });

  test('Cenário 8: ocorrência variável exibe os marcadores na lista de despesas', async ({ page }) => {
    await installMock(page, {
      expenses: [
        buildExpense({
          description: 'Energia elétrica (recorrente)',
          recurringExpenseId: 'rec-var-1',
          amountPendingConfirmation: true,
          documentPending: true,
        }),
      ],
    });
    await page.goto('http://localhost:5173/despesa');

    const row = expensesGrid(page)
      .getByRole('cell', { name: 'Energia elétrica (recorrente)' })
      .locator('xpath=ancestor::tr[1]');
    await expect(row.getByTestId('expense-marker-recurring')).toBeVisible();
    await expect(row.getByTestId('expense-marker-document')).toBeVisible();
    await expect(row.getByTestId('expense-marker-amount')).toBeVisible();
  });

  test('Cenário 9: o evento do calendário exibe os mesmos marcadores em forma compacta', async ({ page }) => {
    await installMock(page, {
      expenses: [
        buildExpense({
          description: 'Internet corporativa',
          dueDate: dueDateThisMonth(15),
          recurringExpenseId: 'rec-var-2',
          amountPendingConfirmation: true,
          documentPending: true,
        }),
      ],
    });
    await page.goto('http://localhost:5173/calendario');

    const event = page
      .getByRole('button', { name: /Internet corporativa.*Gerada por recorrência/ })
      .first();
    await expect(event).toBeVisible();
  });

  test('Cenário 10: "Pagar" na ocorrência variável abre bloqueado e conclui após confirmar', async ({ page }) => {
    await installMock(page, {
      expenses: [
        buildExpense({
          description: 'Serviço de limpeza',
          recurringExpenseId: 'rec-var-3',
          amountPendingConfirmation: true,
          documentPending: true,
        }),
      ],
    });
    await page.goto('http://localhost:5173/despesa');
    await expect(expensesGrid(page).getByText('Serviço de limpeza')).toBeVisible();

    await openExpenseActions(page, 'Serviço de limpeza');
    await page.getByRole('menuitem', { name: 'Pagar' }).click();

    await expect(page.getByTestId('amount-confirmation-state')).toBeVisible();
    await expect(page.getByTestId('amount-confirmation-reason')).toBeVisible();

    await page.getByTestId('confirm-amount-button').click();

    // O mesmo modal transiciona para o formulário de pagamento.
    await expect(page.getByTestId('amount-confirmation-state')).toBeHidden();
    await page.getByRole('button', { name: 'Data do Pagamento' }).click();
    await selectDay(page, 1);
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('Pagamento registrado com sucesso!')).toBeVisible();
  });

  test('Cenário 11: "Confirmar valor" pelo menu dispara toast e remove o marcador', async ({ page }) => {
    await installMock(page, {
      expenses: [
        buildExpense({
          description: 'Manutenção predial',
          recurringExpenseId: 'rec-var-4',
          amountPendingConfirmation: true,
          documentPending: true,
        }),
      ],
    });
    await page.goto('http://localhost:5173/despesa');
    const row = expensesGrid(page)
      .getByRole('cell', { name: 'Manutenção predial' })
      .locator('xpath=ancestor::tr[1]');
    await expect(row.getByTestId('expense-marker-amount')).toBeVisible();

    await openExpenseActions(page, 'Manutenção predial');
    await page.getByRole('menuitem', { name: 'Confirmar valor' }).click();

    await expect(page.getByText('Valor confirmado com sucesso')).toBeVisible();
    await expect(
      expensesGrid(page)
        .getByRole('cell', { name: 'Manutenção predial' })
        .locator('xpath=ancestor::tr[1]')
        .getByTestId('expense-marker-amount'),
    ).toHaveCount(0);
  });

  test('Cenário 12: card exibe o total completo e a sublinha de estimado', async ({ page }) => {
    await installMock(page, {
      summary: buildSummary({
        OPEN: { count: 3, total: 1500, estimatedCount: 1, estimatedTotal: 500 },
      }),
    });
    await page.goto('http://localhost:5173/despesa');

    await expect(page.getByTestId('status-total-open')).toContainText('R$');
    const estimated = page.getByTestId('status-estimated-open');
    await expect(estimated).toBeVisible();
    await expect(estimated).toContainText('estimado');
  });

  test('Cenário 13: editar o valor da recorrência mantém o valor antigo nas despesas geradas', async ({ page }) => {
    await installMock(page, {
      recurrences: [
        buildRecurrence({ id: 'rec-edit-1', description: 'Contabilidade', amount: 1500 }),
      ],
      expenses: [
        buildExpense({
          description: 'Contabilidade',
          amount: 1500,
          recurringExpenseId: 'rec-edit-1',
        }),
      ],
    });
    await gotoRecorrencias(page);

    await openRecurringActions(page, 'Contabilidade');
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar recorrência' })).toBeVisible();

    await page.getByRole('dialog').getByLabel('Valor da despesa').fill('200000');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();

    await expect(page.getByText('Recorrência atualizada com sucesso')).toBeVisible();
    await expect(recurringGrid(page).getByText('R$ 2.000,00')).toBeVisible();

    await page.goto('http://localhost:5173/despesa');
    await expect(expensesGrid(page).getByText('R$ 1.500,00')).toBeVisible();
  });

  test('Cenário 14: informar a data de efeito lista as despesas e alterá-la muda a lista', async ({ page }) => {
    await installMock(page, {
      recurrences: [buildRecurrence({ id: 'rec-term-1', description: 'Vigilância' })],
      expenses: [
        buildExpense({
          description: 'Vigilância — jan',
          dueDate: dueDateThisMonth(10),
          recurringExpenseId: 'rec-term-1',
        }),
        buildExpense({
          description: 'Vigilância — fev',
          dueDate: dueDateThisMonth(20),
          recurringExpenseId: 'rec-term-1',
        }),
      ],
    });
    await gotoRecorrencias(page);

    await openRecurringActions(page, 'Vigilância');
    await page.getByRole('menuitem', { name: 'Encerrar' }).click();
    await expect(page.getByRole('heading', { name: 'Encerrar recorrência' })).toBeVisible();

    const dialog = page.getByRole('dialog');
    const dateButton = dialog.getByRole('button').filter({ hasText: /\d{2}\/\d{2}\/\d{4}/ });

    // Data de efeito no dia 5: ambas as despesas (10 e 20) serão canceladas.
    await dateButton.click();
    await selectDay(page, 5);
    await expect(dialog.getByTestId('termination-preview-item')).toHaveCount(2);

    // Movendo para o dia 15: apenas a do dia 20 permanece.
    await dateButton.click();
    await selectDay(page, 15);
    await expect(dialog.getByTestId('termination-preview-item')).toHaveCount(1);
  });

  test('Cenário 15: confirmar o encerramento muda o estado e cancela as despesas', async ({ page }) => {
    await installMock(page, {
      recurrences: [buildRecurrence({ id: 'rec-term-2', description: 'Locação de impressora' })],
      expenses: [
        buildExpense({
          description: 'Locação de impressora — mês',
          dueDate: dueDateThisMonth(20),
          recurringExpenseId: 'rec-term-2',
        }),
      ],
    });
    await gotoRecorrencias(page);

    await openRecurringActions(page, 'Locação de impressora');
    await page.getByRole('menuitem', { name: 'Encerrar' }).click();
    const dialog = page.getByRole('dialog');

    const dateButton = dialog.getByRole('button').filter({ hasText: /\d{2}\/\d{2}\/\d{4}/ });
    await dateButton.click();
    await selectDay(page, 1);
    await expect(dialog.getByTestId('termination-preview-item')).toHaveCount(1);

    await dialog.getByRole('button', { name: /^Encerrar e cancelar/ }).click();
    await expect(dialog).toBeHidden();

    await expect(
      recurringGrid(page).getByText(RECURRING_EXPENSE_STATUS_LABELS.ENDED),
    ).toBeVisible();

    // A despesa da prévia sai da lista padrão (filtro de abertas) por ter sido cancelada.
    await page.goto('http://localhost:5173/despesa');
    await expect(
      expensesGrid(page).getByText('Locação de impressora — mês'),
    ).toHaveCount(0);
  });

  test('Cenário 16: abrir a edição de uma recorrência encerrada mostra o formulário somente-leitura', async ({ page }) => {
    await installMock(page, {
      recurrences: [
        buildRecurrence({
          id: 'rec-ended-1',
          description: 'Consultoria encerrada',
          status: 'ENDED',
          terminatedAt: ISO,
          terminationReason: 'Contrato finalizado',
        }),
      ],
    });
    await gotoRecorrencias(page);

    await openRecurringActions(page, 'Consultoria encerrada');
    await page.getByRole('menuitem', { name: 'Ver detalhes' }).click();

    await expect(page.getByRole('heading', { name: 'Detalhes da recorrência' })).toBeVisible();
    await expect(page.getByText('Visualize os dados da recorrência.')).toBeVisible();
    await expect(page.getByRole('dialog').getByLabel('Descrição')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Fechar' })).toBeVisible();
  });
});
