import { test, expect } from '@playwright/test'

test.describe('E2E: Expense Form Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/despesa')
  })

  test('Modal: opens when clicking Nova Despesa button', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Nova Despesa' })).toBeVisible()
  })

  test('Tabs: renders both Dados and Documentos tabs', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    await expect(page.getByRole('tab', { name: 'Dados' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Documentos' })).toBeVisible()
  })

  test('Tabs: Dados tab is selected by default', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    const dadosTab = page.getByRole('tab', { name: 'Dados' })
    await expect(dadosTab).toHaveAttribute('data-state', 'active')
  })

  test('Tabs: can switch to Documentos tab', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    await page.click('role=tab[name="Documentos"]')
    
    const documentosTab = page.getByRole('tab', { name: 'Documentos' })
    await expect(documentosTab).toHaveAttribute('data-state', 'active')
  })

  test('Dados Tab: shows form fields', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    await expect(page.getByLabel(/descrição/i)).toBeVisible()
    await expect(page.getByLabel(/valor/i)).toBeVisible()
    await expect(page.getByLabel(/data de vencimento/i)).toBeVisible()
    await expect(page.getByLabel(/favorecido/i)).toBeVisible()
    await expect(page.getByLabel(/município/i)).toBeVisible()
  })

  test('Dados Tab: does not show Nota de Serviço text field', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    await expect(page.getByPlaceholder(/número da nota de serviço/i)).not.toBeVisible()
  })

  test('Documentos Tab: shows upload fields', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    await page.click('role=tab[name="Documentos"]')
    
    await expect(page.getByText('Nota de Serviço')).toBeVisible()
    await expect(page.getByText('Boleto')).toBeVisible()
    
    const dropZones = page.getByTestId('file-drop-zone')
    await expect(dropZones.first()).toBeVisible()
  })

  test('Documentos Tab: has two file upload areas', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    await page.click('role=tab[name="Documentos"]')
    
    const dropZones = page.getByTestId('file-drop-zone')
    await expect(dropZones).toHaveCount(2)
  })

  test('Form: data persists when switching tabs', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    await page.getByLabel(/descrição/i).fill('Test Expense Description')
    
    await page.click('role=tab[name="Documentos"]')
    
    await page.click('role=tab[name="Dados"]')
    
    await expect(page.getByLabel(/descrição/i)).toHaveValue('Test Expense Description')
  })

  test('Modal: closes when clicking Cancelar', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    await page.click('button:has-text("Cancelar")')
    
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('Modal: shows confirmation when closing with unsaved changes', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    await page.getByLabel(/descrição/i).fill('Test')
    
    await page.click('button:has-text("Cancelar")')
    
    await expect(page.getByText('Alterações não salvas')).toBeVisible()
  })

  test('Modal: can discard changes and close', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    await page.getByLabel(/descrição/i).fill('Test')
    
    await page.click('button:has-text("Cancelar")')
    
    await page.click('button:has-text("Descartar e Sair")')
    
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('Accessibility: tabs are keyboard navigable', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    const tablist = page.getByRole('tablist')
    await tablist.click()
    
    await page.keyboard.press('ArrowRight')
    
    const documentosTab = page.getByRole('tab', { name: 'Documentos' })
    await expect(documentosTab).toHaveAttribute('data-state', 'active')
  })

  test('Accessibility: form fields have proper labels', async ({ page }) => {
    await page.click('button:has-text("Nova Despesa")')
    
    const descriptionInput = page.getByLabel(/descrição/i)
    await expect(descriptionInput).toBeVisible()
    
    const amountInput = page.getByLabel(/valor/i)
    await expect(amountInput).toBeVisible()
  })
})

test.describe('E2E: File Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/despesa')
    await page.click('button:has-text("Nova Despesa")')
    await page.click('role=tab[name="Documentos"]')
  })

  test('File Upload: displays allowed file types', async ({ page }) => {
    const dropZones = page.getByTestId('file-drop-zone')
    const firstDropZone = dropZones.first()
    
    await expect(firstDropZone.getByText(/PDF/i)).toBeVisible()
    await expect(firstDropZone.getByText(/PNG/i)).toBeVisible()
    await expect(firstDropZone.getByText(/5MB/i)).toBeVisible()
  })
})

test.describe('E2E: Complete User Flow', () => {
  test('Complete Flow: navigate -> open modal -> switch tabs -> close', async ({ page }) => {
    await page.goto('/despesa')
    
    await expect(page.getByRole('heading', { name: 'Gerenciamento de Despesas' })).toBeVisible()
    
    await page.click('button:has-text("Nova Despesa")')
    
    await expect(page.getByRole('dialog')).toBeVisible()
    
    const dadosTab = page.getByRole('tab', { name: 'Dados' })
    await expect(dadosTab).toHaveAttribute('data-state', 'active')
    
    await page.click('role=tab[name="Documentos"]')
    
    const documentosTab = page.getByRole('tab', { name: 'Documentos' })
    await expect(documentosTab).toHaveAttribute('data-state', 'active')
    
    await expect(page.getByTestId('file-drop-zone').first()).toBeVisible()
    
    await page.click('role=tab[name="Dados"]')
    
    await expect(dadosTab).toHaveAttribute('data-state', 'active')
    
    await page.click('button:has-text("Cancelar")')
    
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
