import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * E2E coverage for the expense report screen (task 09 QA — added for the P0/P1
 * public flows the delivery changed). The screen polls the backend summary on
 * every filter change and exports a ZIP, so the API is mocked with `page.route`
 * (same pattern as categories.spec.ts) to keep the suite runnable under the
 * Vite-only webServer.
 *
 * Covers: SMOKE-001 (screen half), TC-FUNC-001, TC-FUNC-003, TC-FUNC-004,
 * TC-FUNC-005, TC-FUNC-006, TC-UI-001.
 */

const REPORT_URL = 'http://localhost:5173/relatorios/despesas'

interface Summary {
  expenseCount: number
  totalAmount: number
  attachmentCount: number
  expensesWithoutAttachments: number
  exportLimit: number
  exceedsLimit: boolean
}

const EMPTY: Summary = {
  expenseCount: 0,
  totalAmount: 0,
  attachmentCount: 0,
  expensesWithoutAttachments: 0,
  exportLimit: 100,
  exceedsLimit: false,
}

/**
 * Routes the summary endpoint to a value derived from the query so a filter
 * change produces a visibly different summary. When `status=PAID` is present we
 * return a populated summary; otherwise the empty default.
 */
async function installReportMock(
  page: Page,
  opts: { populated?: Summary; overLimit?: boolean } = {}
): Promise<void> {
  await page.route('**/reports/expenses/summary**', async (route: Route) => {
    const url = new URL(route.request().url())
    const status = url.searchParams.get('status')
    let body: Summary = EMPTY
    if (opts.overLimit) {
      body = { ...EMPTY, expenseCount: 137, totalAmount: 50000, attachmentCount: 200, exceedsLimit: true }
    } else if (opts.populated && status === 'PAID') {
      body = opts.populated
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })

  await page.route('**/reports/expenses/export**', async (route: Route) => {
    // Minimal, valid empty ZIP (PK\x05\x06 end-of-central-directory record).
    const emptyZip = Buffer.from([
      0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ])
    await route.fulfill({
      status: 200,
      contentType: 'application/zip',
      headers: {
        'content-disposition': 'attachment; filename="resumo_contabilidade_08-2026.zip"',
        // The export is cross-origin (5173→3000); the browser only lets JS read
        // Content-Disposition when the server exposes it (regression for BUG-001).
        'access-control-expose-headers': 'Content-Disposition',
        'access-control-allow-origin': '*',
      },
      body: emptyZip,
    })
  })
}

test.describe('E2E: Relatório de Despesas', () => {
  test('TC-FUNC-001: abre com mês corrente e sem filtro de status', async ({ page }) => {
    await installReportMock(page)
    await page.goto(REPORT_URL)

    await expect(page.getByText('Relatório de Despesas')).toBeVisible()
    // Current month pre-filled: start is the first day of some month.
    await expect(page.getByTestId('filter-due-date-start')).toHaveValue(/^\d{4}-\d{2}-01$/)
    await expect(page.getByTestId('filter-due-date-end')).toHaveValue(/^\d{4}-\d{2}-\d{2}$/)
    // No status filter selected on open.
    await expect(page.getByTestId('filter-status')).toContainText('Todos os status')
  })

  test('TC-FUNC-005: seleção vazia desabilita a exportação com explicação', async ({ page }) => {
    await installReportMock(page)
    await page.goto(REPORT_URL)

    await expect(page.getByTestId('export-button')).toBeDisabled()
    await expect(page.getByTestId('export-explanation')).toBeVisible()
  })

  test('TC-FUNC-003: o resumo reflete a mudança de filtro', async ({ page }) => {
    const populated: Summary = {
      expenseCount: 12,
      totalAmount: 3400.5,
      attachmentCount: 20,
      expensesWithoutAttachments: 2,
      exportLimit: 100,
      exceedsLimit: false,
    }
    await installReportMock(page, { populated })
    await page.goto(REPORT_URL)

    // Starts empty (no status) → 0 expenses, export disabled.
    await expect(page.getByTestId('export-summary')).toContainText('0')
    await expect(page.getByTestId('export-button')).toBeDisabled()

    // Select the "Paga" status → mock returns the populated summary.
    await page.getByTestId('filter-status').click()
    await page.getByRole('option', { name: 'Paga' }).click()

    await expect(page.getByTestId('export-summary')).toContainText('12')
    await expect(page.getByTestId('export-button')).toBeEnabled()
  })

  test('TC-FUNC-004: acima do teto bloqueia exportação e informa a quantidade', async ({ page }) => {
    await installReportMock(page, { overLimit: true })
    await page.goto(REPORT_URL)

    await expect(page.getByTestId('limit-warning')).toBeVisible()
    await expect(page.getByTestId('limit-warning')).toContainText('137')
    await expect(page.getByTestId('export-button')).toBeDisabled()
  })

  test('TC-FUNC-006: o download usa o nome de arquivo do servidor', async ({ page }) => {
    const populated: Summary = {
      expenseCount: 3,
      totalAmount: 900,
      attachmentCount: 3,
      expensesWithoutAttachments: 0,
      exportLimit: 100,
      exceedsLimit: false,
    }
    await installReportMock(page, { populated })
    await page.goto(REPORT_URL)

    await page.getByTestId('filter-status').click()
    await page.getByRole('option', { name: 'Paga' }).click()
    await expect(page.getByTestId('export-button')).toBeEnabled()

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('export-button').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('resumo_contabilidade_08-2026.zip')
  })

  test('TC-UI-001: responsivo em 375px, 768px e 1280px', async ({ page }) => {
    await installReportMock(page)
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(REPORT_URL)
      await expect(page.getByTestId('report-filter-panel')).toBeVisible()
      await expect(page.getByTestId('export-button')).toBeVisible()
    }
  })
})
