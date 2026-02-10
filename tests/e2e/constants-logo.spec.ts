import { test, expect } from '@playwright/test'
import { PLACEHOLDER_USER, TODO_MESSAGES } from '@/constants'

test.describe('Constants and Logo E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display PLACEHOLDER_USER in Header', async ({ page }) => {
    const userSpan = page.getByText(PLACEHOLDER_USER).first()
    await expect(userSpan).toBeVisible()
  })

  test('should display PLACEHOLDER_USER in Home page', async ({ page }) => {
    await expect(page.getByText(`Bem-vindo ao sistema financeiro ${PLACEHOLDER_USER}`)).toBeVisible()
    await expect(page.getByText(`Você está conectado como ${PLACEHOLDER_USER}`)).toBeVisible()
  })

  test('should display PLACEHOLDER_USER in Sidebar', async ({ page }) => {
    const sidebarUser = page.getByText(PLACEHOLDER_USER)
    await expect(sidebarUser).toBeVisible()
  })

  test('should display EvoluireLogo in Sidebar', async ({ page }) => {
    const logo = page.locator('svg.lucide-sidebar')
    await expect(logo).toBeVisible()
    
    const rect = logo.locator('rect')
    await expect(rect).toHaveAttribute('width', '18')
    await expect(rect).toHaveAttribute('height', '18')
    await expect(rect).toHaveAttribute('x', '3')
    await expect(rect).toHaveAttribute('y', '3')
  })

  test('should handle logout with TODO message', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: 'Sair' })
    
    const logs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text())
      }
    })
    
    await logoutButton.click()
    
    expect(logs).toContain(TODO_MESSAGES.LOGOUT_PLACEHOLDER)
  })

  test('should have no hardcoded PNG images', async ({ page }) => {
    const images = page.locator('img[src$=".png"]')
    await expect(images).toHaveCount(0)
  })

  test('should have no debug images in repository', async () => {
    const response = await page.request.get('/desktop-sidebar-issue.png')
    expect(response.status()).toBe(404)
    
    const response2 = await page.request.get('/home-desktop.png')
    expect(response2.status()).toBe(404)
  })
})
