import { test, expect, type Page, type Route } from '@playwright/test';
import { LINKED_EXPENSES_ERROR_MESSAGE } from '../../src/constants/categories';

interface MockCategory {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MockState {
  categories: MockCategory[];
  linkedIds: Set<string>;
}

const ORGANIZATION_ID = 'fca3c088-ba34-43a2-9b32-b2b1a1246915';

const DUPLICATE_NAME_MESSAGE = 'Category name already exists in this organization';

function buildCategory(input: { name: string; description: string | null }): MockCategory {
  const now = new Date().toISOString();
  return {
    id: `cat-${Math.random().toString(36).slice(2, 11)}`,
    organizationId: ORGANIZATION_ID,
    name: input.name,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  };
}

async function installCategoriesMock(page: Page): Promise<MockState> {
  const state: MockState = {
    categories: [],
    linkedIds: new Set<string>(),
  };

  await page.route('**/categories**', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const segments = url.pathname.split('/').filter(Boolean);
    const isCollection = segments.length === 1 && segments[0] === 'categories';
    const targetId = !isCollection ? segments[segments.length - 1] : null;

    if (method === 'GET' && isCollection) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: state.categories }),
      });
      return;
    }

    if (method === 'POST' && isCollection) {
      const body = request.postDataJSON() as {
        name: string;
        description?: string | null;
        organizationId: string;
      };
      const duplicate = state.categories.find(
        (existing) => existing.name.toLowerCase() === body.name.toLowerCase()
      );
      if (duplicate) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: DUPLICATE_NAME_MESSAGE }),
        });
        return;
      }
      const created = buildCategory({
        name: body.name,
        description: body.description ?? null,
      });
      state.categories.push(created);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
      return;
    }

    if (method === 'PUT' && targetId) {
      const body = request.postDataJSON() as {
        name?: string;
        description?: string | null;
      };
      const target = state.categories.find((item) => item.id === targetId);
      if (!target) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Categoria não encontrada' }),
        });
        return;
      }
      if (typeof body.name === 'string') {
        const duplicate = state.categories.find(
          (item) => item.id !== targetId && item.name.toLowerCase() === body.name!.toLowerCase()
        );
        if (duplicate) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ message: DUPLICATE_NAME_MESSAGE }),
          });
          return;
        }
        target.name = body.name;
      }
      if (body.description !== undefined) {
        target.description = body.description;
      }
      target.updatedAt = new Date().toISOString();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target),
      });
      return;
    }

    if (method === 'DELETE' && targetId) {
      if (state.linkedIds.has(targetId)) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: LINKED_EXPENSES_ERROR_MESSAGE }),
        });
        return;
      }
      const index = state.categories.findIndex((item) => item.id === targetId);
      if (index === -1) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Categoria não encontrada' }),
        });
        return;
      }
      state.categories.splice(index, 1);
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fallback();
  });

  return state;
}

async function openCreateModal(page: Page) {
  await page.getByTestId('create-category-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nova Categoria' })).toBeVisible();
}

async function fillCategoryForm(
  page: Page,
  values: { name: string; description?: string }
) {
  await page.getByLabel('Nome').fill(values.name);
  if (values.description !== undefined) {
    await page.getByLabel('Descrição').fill(values.description);
  }
}

async function submitCategoryForm(page: Page) {
  await page.getByRole('button', { name: 'Salvar' }).click();
}

async function createCategoryViaUi(
  page: Page,
  values: { name: string; description?: string }
) {
  await openCreateModal(page);
  await fillCategoryForm(page, values);
  await submitCategoryForm(page);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(
    page.getByText('Categoria criada com sucesso').last()
  ).toBeVisible();
}

async function openFilterModal(page: Page) {
  await page.getByTestId('filter-button').click();
  await expect(page.getByRole('heading', { name: 'Filtrar Categorias' })).toBeVisible();
}

async function closeFilterModal(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Fechar' })
    .click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

test.describe('E2E: Category Management', () => {
  let mockState: MockState;

  test.beforeEach(async ({ page }) => {
    mockState = await installCategoriesMock(page);
  });

  test('Scenario 1: Clicking "Categorias" in sidebar navigates to /categorias', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Categorias' }).click();

    await expect(page).toHaveURL('/categorias');
    await expect(
      page.getByText('Gerenciamento de Categorias')
    ).toBeVisible();
  });

  test('Scenario 2: Empty API response shows the empty-state message', async ({ page }) => {
    await page.goto('/categorias');

    await expect(page.getByTestId('categories-list-empty')).toBeVisible();
    await expect(
      page.getByText('Nenhuma categoria cadastrada', { exact: false })
    ).toBeVisible();
  });

  test('Scenario 3: Creating a category shows success toast and adds it to the list', async ({ page }) => {
    await page.goto('/categorias');

    await openCreateModal(page);
    await fillCategoryForm(page, {
      name: 'Marketing',
      description: 'Despesas com marketing digital',
    });
    await submitCategoryForm(page);

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByText('Categoria criada com sucesso')).toBeVisible();
    await expect(
      page.getByTestId('categories-list').getByText('Marketing', { exact: true })
    ).toBeVisible();
  });

  test('Scenario 4: Submitting empty name shows inline validation and no API call', async ({ page }) => {
    let postCalled = false;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/categories')) {
        postCalled = true;
      }
    });

    await page.goto('/categorias');
    await openCreateModal(page);
    await submitCategoryForm(page);

    await expect(page.getByText('O nome é obrigatório')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(postCalled).toBe(false);
  });

  test('Scenario 5: Creating a duplicate name surfaces the backend error via toast', async ({ page }) => {
    await page.goto('/categorias');
    await createCategoryViaUi(page, { name: 'Operacional' });

    await openCreateModal(page);
    await fillCategoryForm(page, { name: 'Operacional' });
    await submitCategoryForm(page);

    await expect(page.getByText(DUPLICATE_NAME_MESSAGE)).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Scenario 6: Editing a category updates the row name', async ({ page }) => {
    await page.goto('/categorias');
    await createCategoryViaUi(page, { name: 'Aluguel' });

    await page
      .getByRole('button', { name: 'Editar categoria Aluguel' })
      .click();

    await expect(page.getByRole('heading', { name: 'Editar Categoria' })).toBeVisible();

    const nameInput = page.getByLabel('Nome');
    await expect(nameInput).toHaveValue('Aluguel');
    await nameInput.fill('Aluguel Sede');
    await submitCategoryForm(page);

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByText('Categoria atualizada com sucesso')).toBeVisible();
    await expect(
      page.getByTestId('categories-list').getByText('Aluguel Sede', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByTestId('categories-list').getByText('Aluguel', { exact: true })
    ).toBeHidden();
  });

  test('Scenario 7: Deleting an unlinked category removes the entry from the list', async ({ page }) => {
    await page.goto('/categorias');
    await createCategoryViaUi(page, { name: 'Eventos' });

    await page
      .getByRole('button', { name: 'Excluir categoria Eventos' })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('Tem certeza que deseja excluir esta categoria?')
    ).toBeVisible();

    await dialog.getByRole('button', { name: 'Excluir' }).click();

    await expect(dialog).toBeHidden();
    await expect(
      page.getByTestId('categories-list').getByText('Eventos', { exact: true })
    ).toBeHidden();
  });

  test('Scenario 8: Deleting a linked category shows blocked dialog and keeps the row', async ({ page }) => {
    await page.goto('/categorias');
    await createCategoryViaUi(page, { name: 'Salários' });

    const linkedCategory = mockState.categories.find(
      (item) => item.name === 'Salários'
    );
    expect(linkedCategory).toBeDefined();
    mockState.linkedIds.add(linkedCategory!.id);

    await page
      .getByRole('button', { name: 'Excluir categoria Salários' })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Excluir' }).click();

    await expect(dialog.getByText(LINKED_EXPENSES_ERROR_MESSAGE)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Excluir' })).toBeHidden();
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeHidden();

    const closeButton = dialog.getByRole('button', { name: 'Fechar' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(dialog).toBeHidden();
    await expect(
      page.getByTestId('categories-list').getByText('Salários', { exact: true })
    ).toBeVisible();
  });

  test('Scenario 9: Filtering by partial name narrows the visible rows', async ({ page }) => {
    await page.goto('/categorias');
    await createCategoryViaUi(page, { name: 'Tecnologia' });
    await createCategoryViaUi(page, { name: 'Recursos Humanos' });

    await openFilterModal(page);
    await page.getByLabel('Nome').fill('Tec');
    await closeFilterModal(page);

    const list = page.getByTestId('categories-list');
    await expect(list.getByText('Tecnologia', { exact: true })).toBeVisible();
    await expect(list.getByText('Recursos Humanos', { exact: true })).toBeHidden();
    await expect(page.getByTestId('filter-badge')).toBeVisible();
  });

  test('Scenario 10: Clearing the filter restores the full list and hides the badge', async ({ page }) => {
    await page.goto('/categorias');
    await createCategoryViaUi(page, { name: 'Tecnologia' });
    await createCategoryViaUi(page, { name: 'Recursos Humanos' });

    await openFilterModal(page);
    await page.getByLabel('Nome').fill('Tec');
    await expect(page.getByTestId('filter-active-badge')).toBeVisible();

    await page.getByRole('button', { name: 'Limpar filtros' }).click();

    await expect(page.getByLabel('Nome')).toHaveValue('');
    await closeFilterModal(page);

    const list = page.getByTestId('categories-list');
    await expect(list.getByText('Tecnologia', { exact: true })).toBeVisible();
    await expect(list.getByText('Recursos Humanos', { exact: true })).toBeVisible();
    await expect(page.getByTestId('filter-badge')).toBeHidden();
  });
});
