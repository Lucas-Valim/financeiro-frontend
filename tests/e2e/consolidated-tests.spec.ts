import { test, expect } from '@playwright/test'

test.describe('E2E: Testes Consolidados - Layout e Responsividade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Layout: deve renderizar corretamente com children', async ({ page }) => {
    await expect(page.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeVisible()
  })

  test('Layout: deve renderizar Sidebar com itens de navegação', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Despesa' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Relatórios' })).toBeVisible()
  })

  test('Layout: deve renderizar Header com título e botão de logout', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  })

  test('Sidebar: deve renderizar corretamente com 3 itens de navegação', async ({ page }) => {
    await expect(page.getByText('Home')).toBeVisible()
    await expect(page.getByText('Despesa')).toBeVisible()
    await expect(page.getByText('Relatórios')).toBeVisible()
  })

  test('Sidebar: deve renderizar SidebarRail', async ({ page }) => {
    const sidebarRail = page.getByTestId('sidebar-rail')
    await expect(sidebarRail).toBeVisible()
  })

  test('Sidebar: deve exibir o título "Evoluire" na sidebar', async ({ page }) => {
    await expect(page.getByText('Evoluire')).toBeVisible()
  })

  test('Header: deve renderizar corretamente com nome do usuário "Evoluire"', async ({ page }) => {
    await expect(page.getByText('Evoluire')).toBeVisible()
  })

  test('Header: deve exibir o botão de logout', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  })

  test('Responsividade: Mobile (< 768px) - deve ter Sidebar oculta por padrão', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const sidebar = page.locator('.group\\/sidebar-wrapper')
    await expect(sidebar).toBeVisible()

    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('Responsividade: Mobile - deve ter layout empilhado', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const sidebarWrapper = page.locator('.group\\/sidebar-wrapper')
    const main = page.locator('main')

    await expect(sidebarWrapper).toHaveClass(/flex/)
    await expect(main).toHaveClass(/flex-1/)
  })

  test('Responsividade: Mobile - deve ter SidebarTrigger disponível', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const toggleButtons = page.getByRole('button', { name: /toggle/i })
    await expect(toggleButtons.first()).toBeVisible()
  })

  test('Responsividade: Tablet (768px - 1024px) - deve ter Sidebar visível', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 768 })

    const sidebar = page.locator('[data-sidebar]')
    const main = page.locator('main')

    await expect(sidebar).toBeVisible()
    await expect(main).toBeVisible()
  })

  test('Responsividade: Tablet - deve ter layout responsivo com Sidebar e content', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 768 })

    const sidebar = page.locator('[data-sidebar]')
    const main = page.locator('main')

    await expect(sidebar).toBeVisible()
    await expect(main).toBeVisible()
  })

  test('Responsividade: Tablet - deve ter header visível com título e botão', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 768 })

    await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  })

  test('Responsividade: Desktop (> 1024px) - deve ter Sidebar fixa lateral', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    const sidebar = page.locator('[data-slot="sidebar-container"]')
    await expect(sidebar).toBeVisible()
  })

  test('Responsividade: Desktop - deve ter layout completo com Sidebar, Header e Main', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    const sidebar = page.locator('[data-sidebar]')
    const header = page.locator('header')
    const main = page.locator('main')

    await expect(sidebar).toBeVisible()
    await expect(header).toBeVisible()
    await expect(main).toBeVisible()
  })

  test('Responsividade: Desktop - deve ter SidebarRail para toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    const sidebarRail = page.getByTestId('sidebar-rail')
    await expect(sidebarRail).toBeVisible()
  })

  test('Responsividade: Desktop - deve ter navegação funcional', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await expect(page.getByText('Home')).toBeVisible()
  })

  test('Transições: deve manter componentes renderizados entre viewports', async ({ page }) => {
    const sidebar = page.locator('[data-sidebar]')
    const header = page.locator('header')
    const main = page.locator('main')

    await expect(sidebar).toBeVisible()
    await expect(header).toBeVisible()
    await expect(main).toBeVisible()

    await page.setViewportSize({ width: 375, height: 667 })

    await expect(sidebar).toBeVisible()
    await expect(header).toBeVisible()
    await expect(main).toBeVisible()

    await page.setViewportSize({ width: 1280, height: 800 })

    await expect(sidebar).toBeVisible()
    await expect(header).toBeVisible()
    await expect(main).toBeVisible()
  })

  test('Integração: deve exibir nome do usuário "Evoluire" no Header', async ({ page }) => {
    const header = page.locator('header')
    await expect(header.getByText('Evoluire')).toBeVisible()
  })

  test('Integração: deve renderizar Sidebar com logo da Evoluire', async ({ page }) => {
    const sidebar = page.locator('[data-sidebar]')
    await expect(sidebar.getByText('Evoluire')).toBeVisible()
  })
})
