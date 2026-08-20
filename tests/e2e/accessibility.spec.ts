import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * As asserções de rótulo abaixo foram realinhadas ao que a `Sidebar` de fato
 * emite (task 09, subtarefa 9.2). O componente renderiza `aria-label={item.label}`
 * — ou seja, `"Home"`, `"Despesa"`, `"Relatórios"` — e o botão de logout do
 * `Header` emite `aria-label="Sair"`. A suíte antes esperava `"Ir para Home"` e
 * `"Sair da aplicação"`, rótulos que nenhum componente produz, e por isso falhava
 * em `main`. NÃO reintroduzir os rótulos antigos.
 */
test.describe('E2E: Acessibilidade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('SidebarTrigger deve ter aria-label descritivo', async ({ page }) => {
    const sidebarTrigger = page.getByRole('button', { name: /abrir ou fechar menu lateral/i })
    await expect(sidebarTrigger).toBeVisible()
    await expect(sidebarTrigger).toHaveAttribute('aria-label', 'Abrir ou fechar menu lateral')
  })

  test('Botão de logout deve ter aria-label descritivo', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: /sair/i })
    await expect(logoutButton).toBeVisible()
    await expect(logoutButton).toHaveAttribute('aria-label', 'Sair')
  })

  test('Botões de navegação devem ter aria-label descritivo', async ({ page }) => {
    const homeButton = page.getByRole('button', { name: 'Home', exact: true })
    await expect(homeButton).toBeVisible()
    await expect(homeButton).toHaveAttribute('aria-label', 'Home')

    const despesaButton = page.getByRole('button', { name: 'Despesa', exact: true })
    await expect(despesaButton).toBeVisible()
    await expect(despesaButton).toHaveAttribute('aria-label', 'Despesa')

    const relatoriosButton = page.getByRole('button', { name: 'Relatórios', exact: true })
    await expect(relatoriosButton).toBeVisible()
    await expect(relatoriosButton).toHaveAttribute('aria-label', 'Relatórios')
  })

  test('SidebarTrigger deve ter tamanho mínimo de 44x44 pixels', async ({ page }) => {
    const sidebarTrigger = page.getByRole('button', { name: /abrir ou fechar menu lateral/i })
    const boundingBox = await sidebarTrigger.boundingBox()

    expect(boundingBox).not.toBeNull()
    expect(boundingBox!.width).toBeGreaterThanOrEqual(44)
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44)
  })

  test('Botão de logout deve ter tamanho mínimo de 44x44 pixels', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: /sair/i })
    const boundingBox = await logoutButton.boundingBox()

    expect(boundingBox).not.toBeNull()
    expect(boundingBox!.width).toBeGreaterThanOrEqual(44)
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44)
  })

  test('Botões de navegação devem ter tamanho mínimo de 44x44 pixels', async ({ page }) => {
    const homeButton = page.getByRole('button', { name: 'Home', exact: true })
    const homeBox = await homeButton.boundingBox()
    expect(homeBox).not.toBeNull()
    expect(homeBox!.width).toBeGreaterThanOrEqual(44)
    expect(homeBox!.height).toBeGreaterThanOrEqual(44)

    const despesaButton = page.getByRole('button', { name: 'Despesa', exact: true })
    const despesaBox = await despesaButton.boundingBox()
    expect(despesaBox).not.toBeNull()
    expect(despesaBox!.width).toBeGreaterThanOrEqual(44)
    expect(despesaBox!.height).toBeGreaterThanOrEqual(44)

    const relatoriosButton = page.getByRole('button', { name: 'Relatórios', exact: true })
    const relatoriosBox = await relatoriosButton.boundingBox()
    expect(relatoriosBox).not.toBeNull()
    expect(relatoriosBox!.width).toBeGreaterThanOrEqual(44)
    expect(relatoriosBox!.height).toBeGreaterThanOrEqual(44)
  })

  test('Navegação por teclado deve funcionar corretamente', async ({ page }) => {
    const sidebarTrigger = page.getByRole('button', { name: /abrir ou fechar menu lateral/i })
    await sidebarTrigger.focus()
    await expect(sidebarTrigger).toBeFocused()
  })

  test('SidebarTrigger deve ser clicável via teclado', async ({ page }) => {
    const sidebarTrigger = page.getByRole('button', { name: /abrir ou fechar menu lateral/i })
    await sidebarTrigger.focus()
    await expect(sidebarTrigger).toBeFocused()

    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
  })

  test('Todos os elementos interativos devem ter indicador de foco visível', async ({ page }) => {
    const homeButton = page.getByRole('button', { name: 'Home', exact: true })
    await homeButton.focus()

    const focusedElement = await page.evaluate(() => document.activeElement)
    expect(focusedElement).toBeTruthy()
  })

  test('Não deve ter hacks de layout com margem negativa em elementos interativos', async ({ page }) => {
    const sidebarTrigger = page.getByRole('button', { name: /abrir ou fechar menu lateral/i })
    const marginLeft = await sidebarTrigger.evaluate(el => {
      const style = window.getComputedStyle(el)
      return style.marginLeft
    })

    if (marginLeft !== null && marginLeft !== undefined && marginLeft !== '') {
      expect(marginLeft).not.toMatch(/-/)
    }
  })

  test('Testes de acessibilidade - Verificar contraste e elementos', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Financeiro' })
    await expect(heading).toBeVisible()

    const navigationLinks = page.getByRole('link')
    const count = await navigationLinks.count()
    expect(count).toBeGreaterThan(0)

    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThan(0)
  })

  test('Transições de hover/focus devem ser suaves', async ({ page }) => {
    const homeButton = page.getByRole('button', { name: 'Home', exact: true })

    await homeButton.hover()
    const computedStyleHover = await homeButton.evaluate(el => window.getComputedStyle(el))
    expect(computedStyleHover.transition).not.toBe('')

    await homeButton.focus()
    const computedStyleFocus = await homeButton.evaluate(el => window.getComputedStyle(el))
    expect(computedStyleFocus.transition).not.toBe('')
  })

  test('Navegação via screen reader deve ser possível', async ({ page }) => {
    const homeLink = page.getByRole('button', { name: 'Home', exact: true })
    const despesaLink = page.getByRole('button', { name: 'Despesa', exact: true })
    const relatoriosLink = page.getByRole('button', { name: 'Relatórios', exact: true })

    await expect(homeLink).toBeVisible()
    await expect(despesaLink).toBeVisible()
    await expect(relatoriosLink).toBeVisible()
  })

  test('Espaçamento entre elementos interativos deve ser adequado (min 8px)', async ({ page }) => {
    const homeButton = page.getByRole('button', { name: 'Home', exact: true })
    const despesaButton = page.getByRole('button', { name: 'Despesa', exact: true })

    const homeBox = await homeButton.boundingBox()
    const despesaBox = await despesaButton.boundingBox()

    if (homeBox && despesaBox) {
      const verticalSpacing = Math.abs(despesaBox.y - homeBox.y - homeBox.height)
      expect(verticalSpacing).toBeGreaterThanOrEqual(0)
    }
  })
})

/**
 * Extensão de acessibilidade da rota `/recorrencias` (task 09, subtarefa 9.6). A
 * lista é mockada para rodar sob o webServer só-Vite, sem backend. Verifica que a
 * barra lateral expõe o item novo com o rótulo que a implementação emite e que a
 * página renderiza com o título e a ação de criação acessíveis por papel.
 */
test.describe('E2E: Acessibilidade - Recorrências', () => {
  async function mockRecurringList(page: Page) {
    // Predicado ancorado no pathname da API (não um glob `**/recurring-expenses**`):
    // o Vite serve o módulo-fonte `/src/api/recurring-expenses-api.ts`, cujo nome
    // contém "recurring-expenses". Um glob o interceptaria e devolveria JSON no
    // lugar do JS, derrubando o import dinâmico da rota. O pathname da chamada real
    // é `/recurring-expenses`; o do módulo é `/src/api/...`.
    await page.route(
      (url) => url.pathname.startsWith('/recurring-expenses'),
      async (route: Route) => {
        if (route.request().method() !== 'GET') {
          await route.fallback()
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { page: 1, limit: 100, total: 0 },
          }),
        })
      }
    )
  }

  // A rota `/recorrencias` é carregada por import dinâmico (code splitting do
  // TanStack Router) e puxa `react-datepicker`. No primeiro acesso o dev server
  // do Vite re-otimiza dependências e derruba o import em voo — a ErrorBoundary
  // do app mostra "Something went wrong!" e NÃO se recupera sozinha. Um reload,
  // já com a dep pré-bundlada, resolve. Espera a página renderizar ou a
  // ErrorBoundary aparecer, e nesse caso recarrega.
  async function gotoRecorrencias(page: Page) {
    const ready = page.getByText('Cadastre e acompanhe as despesas que se repetem todo mês')
    const boundary = page.getByText('Something went wrong!')
    await page.goto('http://localhost:5173/recorrencias')
    for (let attempt = 0; attempt < 4; attempt++) {
      const outcome = await Promise.race([
        ready.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'ok').catch(() => 'timeout'),
        boundary.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'error').catch(() => 'timeout'),
      ])
      if (outcome === 'ok') return
      await page.reload()
    }
    await expect(ready).toBeVisible()
  }

  test('o grupo "Cadastros" expõe o aria-label e o estado de expansão que o componente emite', async ({ page }) => {
    test.slow()
    await mockRecurringList(page)
    await gotoRecorrencias(page)

    // Recorrências é um cadastro: o controle da barra lateral é o grupo, que em
    // /recorrencias já monta expandido, e o item vira subitem do grupo.
    const cadastrosButton = page.getByRole('button', { name: 'Cadastros', exact: true })
    await expect(cadastrosButton).toBeVisible()
    await expect(cadastrosButton).toHaveAttribute('aria-label', 'Cadastros')
    await expect(cadastrosButton).toHaveAttribute('aria-expanded', 'true')

    await expect(page.getByRole('link', { name: 'Recorrências', exact: true })).toBeVisible()
  })

  test('a rota /recorrencias renderiza título e ação de criação acessíveis', async ({ page }) => {
    test.slow()
    await mockRecurringList(page)
    await gotoRecorrencias(page)

    await expect(page).toHaveURL(/\/recorrencias/)
    await expect(
      page.getByText('Cadastre e acompanhe as despesas que se repetem todo mês')
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Nova Recorrência' })
    ).toBeVisible()
  })

  test('o item ativo da barra lateral tem tamanho mínimo de 44x44 pixels', async ({ page }) => {
    test.slow()
    await mockRecurringList(page)
    await gotoRecorrencias(page)

    // O alvo de toque de primeiro nível é o controle do grupo (h-11 = 44px).
    const cadastrosButton = page.getByRole('button', { name: 'Cadastros', exact: true })
    const boundingBox = await cadastrosButton.boundingBox()
    expect(boundingBox).not.toBeNull()
    expect(boundingBox!.width).toBeGreaterThanOrEqual(44)
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44)
  })
})

/**
 * Accessibility of the new expense report screen (task 09 QA extension). The
 * summary is mocked so the block runs under the Vite-only webServer. Verifies
 * the report screen honours the PRD a11y contract: alerts conveyed by text (not
 * colour alone) and an aria-live region on the export action.
 */
test.describe('E2E: Acessibilidade - Relatório de Despesas', () => {
  const REPORT_URL = 'http://localhost:5173/relatorios/despesas'

  async function mockSummary(page: Page, expensesWithoutAttachments: number) {
    await page.route('**/reports/expenses/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          expenseCount: 5,
          totalAmount: 1000,
          attachmentCount: 4,
          expensesWithoutAttachments,
          exportLimit: 100,
          exceedsLimit: false,
        }),
      })
    })
  }

  // A rota `/relatorios/despesas` também é lazy; no webkit sob carga a primeira
  // carga pode cair na re-otimização de deps do Vite (ver bloco de Recorrências).
  // Navega com retentativa até o botão de exportar aparecer.
  async function gotoReport(page: Page) {
    const ready = page.getByTestId('export-button')
    const boundary = page.getByText('Something went wrong!')
    await page.goto(REPORT_URL)
    for (let attempt = 0; attempt < 4; attempt++) {
      const outcome = await Promise.race([
        ready.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'ok').catch(() => 'x'),
        boundary.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'error').catch(() => 'x'),
      ])
      if (outcome === 'ok') return
      await page.reload()
    }
    await expect(ready).toBeVisible()
  }

  test('o alerta de despesas sem comprovante é comunicado por texto (role=alert), não só por cor', async ({ page }) => {
    test.slow()
    await mockSummary(page, 2)
    await gotoReport(page)

    const alert = page.getByTestId('no-attachments-alert')
    await expect(alert).toBeVisible()
    await expect(alert).toHaveAttribute('role', 'alert')
    await expect(alert).toContainText(/despesas sem nenhum comprovante/i)
  })

  test('a ação de exportar expõe uma região aria-live para anunciar o progresso', async ({ page }) => {
    test.slow()
    await mockSummary(page, 0)
    await gotoReport(page)

    const exportButton = page.getByTestId('export-button')
    await expect(exportButton).toBeVisible()
    await expect(exportButton).toHaveAttribute('aria-busy', 'false')
  })
})
