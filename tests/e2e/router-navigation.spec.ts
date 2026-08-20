import { test, expect, type Page } from '@playwright/test'

// webkit + the Vite dev server can abort a fresh document navigation with
// "Frame load interrupted", rolling the URL back to "/" before the app boots.
// Re-navigate until the expected URL (post client-side redirect) lands.
async function gotoResilient(page: Page, targetUrl: string, expectedUrl = targetUrl) {
  await expect(async () => {
    await page.goto(targetUrl, { waitUntil: 'commit' }).catch(() => {})
    await expect(page).toHaveURL(expectedUrl, { timeout: 3000 })
  }).toPass({ timeout: 20000 })
}

test.describe('E2E: Navegação com TanStack Router', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('deve carregar a página inicial (Home)', async ({ page }) => {
    await expect(page).toHaveTitle('Evoluire - Financeiro')
    await expect(page).toHaveURL('http://localhost:5173/')
    await expect(page.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeVisible()
  })

  test('deve ter todos os itens de navegação visíveis', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Despesa' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Relatórios' })).toBeVisible()
  })

  test('deve navegar para Despesa ao clicar no link', async ({ page }) => {
    await page.getByRole('link', { name: 'Despesa' }).click()
    await expect(page).toHaveURL('http://localhost:5173/despesa')
    await expect(page.getByText('Gerenciamento de Despesas')).toBeVisible()
  })

  test('deve navegar para Relatórios ao clicar no link', async ({ page }) => {
    await page.getByRole('button', { name: 'Relatórios' }).click()
    await page.getByRole('link', { name: 'Despesas' }).click()
    await expect(page).toHaveURL('http://localhost:5173/relatorios/despesas')
    await expect(page.getByText('Relatório de Despesas')).toBeVisible()
  })

  test('deve navegar para Home ao clicar no link', async ({ page }) => {
    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL('http://localhost:5173/')
    await expect(page.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeVisible()
  })

  test('deve carregar página correta ao usar deep linking - Despesa', async ({ page }) => {
    await gotoResilient(page, 'http://localhost:5173/despesa')
    await expect(page.getByText('Gerenciamento de Despesas')).toBeVisible()
  })

  test('deve carregar página correta ao usar deep linking - Relatórios', async ({ page }) => {
    await gotoResilient(
      page,
      'http://localhost:5173/relatorios',
      'http://localhost:5173/relatorios/despesas'
    )
    await expect(page.getByText('Relatório de Despesas')).toBeVisible()
  })

  test('deve funcionar navegação back do browser', async ({ page }) => {
    await page.getByRole('link', { name: 'Despesa' }).click()
    await expect(page).toHaveURL('http://localhost:5173/despesa')

    await page.goBack()
    await expect(page).toHaveURL('http://localhost:5173/')
    await expect(page.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeVisible()
  })

  test('deve funcionar navegação forward do browser', async ({ page }) => {
    await page.getByRole('link', { name: 'Despesa' }).click()
    await expect(page).toHaveURL('http://localhost:5173/despesa')

    await page.goBack()
    await expect(page).toHaveURL('http://localhost:5173/')

    await page.goForward()
    await expect(page).toHaveURL('http://localhost:5173/despesa')
    await expect(page.getByText('Gerenciamento de Despesas')).toBeVisible()
  })

  test('deve manter histórico de navegação entre múltiplas páginas', async ({ page }) => {
    await page.getByRole('link', { name: 'Despesa' }).click()
    await expect(page).toHaveURL('http://localhost:5173/despesa')

    await page.getByRole('button', { name: 'Relatórios' }).click()
    await page.getByRole('link', { name: 'Despesas' }).click()
    await expect(page).toHaveURL('http://localhost:5173/relatorios/despesas')

    await page.goBack()
    await expect(page).toHaveURL('http://localhost:5173/despesa')

    await page.goBack()
    await expect(page).toHaveURL('http://localhost:5173/')
    await expect(page.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeVisible()
  })

  test('deve indicar página ativa na sidebar', async ({ page }) => {
    await gotoResilient(page, 'http://localhost:5173/')
    const homeButton = page.getByRole('link', { name: 'Home' }).locator('button')
    await expect(homeButton).toHaveAttribute('data-active', 'true')

    await gotoResilient(page, 'http://localhost:5173/despesa')
    const despesaButton = page.getByRole('link', { name: 'Despesa' }).locator('button')
    await expect(despesaButton).toHaveAttribute('data-active', 'true')

    await gotoResilient(page, 'http://localhost:5173/relatorios/despesas')
    const despesasSubItem = page.getByRole('link', { name: 'Despesas' })
    await expect(despesasSubItem).toHaveAttribute('data-active', 'true')
  })

  test('deve ter links navegáveis para todas as páginas', async ({ page }) => {
    // Primeiro nível: Home, Calendário e Despesa. Cadastros e Relatórios são
    // controles de expansão (button), e seus subitens só entram na contagem
    // quando o grupo está aberto.
    const links = page.getByRole('list').getByRole('link')
    await expect(links).toHaveCount(3)
    const count = await links.count()

    for (let i = 0; i < count; i++) {
      const link = links.nth(i)
      const href = await link.getAttribute('href')
      expect(href).toBeTruthy()
    }
  })

  test('deve atualizar URL corretamente ao navegar', async ({ page }) => {
    const currentUrl = page.url()
    expect(currentUrl).toBe('http://localhost:5173/')

    await page.getByRole('link', { name: 'Despesa' }).click()
    const newUrl = page.url()
    expect(newUrl).toBe('http://localhost:5173/despesa')

    await page.getByRole('button', { name: 'Relatórios' }).click()
    await page.getByRole('link', { name: 'Despesas' }).click()
    const finalUrl = page.url()
    expect(finalUrl).toBe('http://localhost:5173/relatorios/despesas')
  })
})
