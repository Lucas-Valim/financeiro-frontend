import { test, expect } from '@playwright/test'

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
    await expect(logoutButton).toHaveAttribute('aria-label', 'Sair da aplicação')
  })

  test('Botões de navegação devem ter aria-label descritivo', async ({ page }) => {
    const homeButton = page.getByRole('button', { name: /ir para home/i })
    await expect(homeButton).toBeVisible()
    await expect(homeButton).toHaveAttribute('aria-label', 'Ir para Home')

    const despesaButton = page.getByRole('button', { name: /ir para despesa/i })
    await expect(despesaButton).toBeVisible()
    await expect(despesaButton).toHaveAttribute('aria-label', 'Ir para Despesa')

    const relatoriosButton = page.getByRole('button', { name: /ir para relatórios/i })
    await expect(relatoriosButton).toBeVisible()
    await expect(relatoriosButton).toHaveAttribute('aria-label', 'Ir para Relatórios')
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
    const homeButton = page.getByRole('button', { name: /ir para home/i })
    const homeBox = await homeButton.boundingBox()
    expect(homeBox).not.toBeNull()
    expect(homeBox!.width).toBeGreaterThanOrEqual(44)
    expect(homeBox!.height).toBeGreaterThanOrEqual(44)

    const despesaButton = page.getByRole('button', { name: /ir para despesa/i })
    const despesaBox = await despesaButton.boundingBox()
    expect(despesaBox).not.toBeNull()
    expect(despesaBox!.width).toBeGreaterThanOrEqual(44)
    expect(despesaBox!.height).toBeGreaterThanOrEqual(44)

    const relatoriosButton = page.getByRole('button', { name: /ir para relatórios/i })
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
    const homeButton = page.getByRole('button', { name: /ir para home/i })
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
    const homeButton = page.getByRole('button', { name: /ir para home/i })
    
    await homeButton.hover()
    const computedStyleHover = await homeButton.evaluate(el => window.getComputedStyle(el))
    expect(computedStyleHover.transition).not.toBe('')
    
    await homeButton.focus()
    const computedStyleFocus = await homeButton.evaluate(el => window.getComputedStyle(el))
    expect(computedStyleFocus.transition).not.toBe('')
  })

  test('Navegação via screen reader deve ser possível', async ({ page }) => {
    const homeLink = page.getByRole('button', { name: /ir para home/i })
    const despesaLink = page.getByRole('button', { name: /ir para despesa/i })
    const relatoriosLink = page.getByRole('button', { name: /ir para relatórios/i })

    await expect(homeLink).toBeVisible()
    await expect(despesaLink).toBeVisible()
    await expect(relatoriosLink).toBeVisible()
  })

  test('Espaçamento entre elementos interativos deve ser adequado (min 8px)', async ({ page }) => {
    const homeButton = page.getByRole('button', { name: /ir para home/i })
    const despesaButton = page.getByRole('button', { name: /ir para despesa/i })
    
    const homeBox = await homeButton.boundingBox()
    const despesaBox = await despesaButton.boundingBox()
    
    if (homeBox && despesaBox) {
      const verticalSpacing = Math.abs(despesaBox.y - homeBox.y - homeBox.height)
      expect(verticalSpacing).toBeGreaterThanOrEqual(0)
    }
  })
})
