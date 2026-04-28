/**
 * Constellation — Saved-view delete confirmation (task #2599)
 *
 * The Delete button on a selected saved view opens a confirmation modal
 * instead of deleting immediately. This spec locks in that contract:
 *
 *   - Clicking Delete opens the modal and the modal shows the view name.
 *   - Cancel dismisses the modal without issuing a DELETE.
 *   - Esc dismisses the modal without issuing a DELETE.
 *   - Confirm (clicked) issues the DELETE and removes the view from the picker.
 *   - Enter (the confirm button is autoFocused) also issues the DELETE.
 *
 * The test uses the PARAGON artifact's /constellation page as the host. All
 * network calls — auth, graph data, and saved-view CRUD — are mocked at the
 * page.route() level so the spec doesn't depend on the API server or DB.
 */
import { expect, type Page, type Route, test } from '@playwright/test';

const AEGIS_PATH = (process.env.AEGIS_BASE_PATH ?? '/aegis').replace(/\/$/, '');
const VIEW_ID = 90901;
const VIEW_NAME = 'E2E Saved View';
const SECOND_VIEW_ID = 90902;
const SECOND_VIEW_NAME = 'E2E Saved View 2';

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(`${AEGIS_PATH}/`, {
      timeout: 10000,
      waitUntil: 'domcontentloaded',
    });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

interface MockState {
  views: { id: number; domain: string; name: string; filters: unknown }[];
  deleteCalls: number;
}

async function installMocks(page: Page, state: MockState): Promise<void> {
  // Auth — mock as an admin so the saved-views UI renders.
  await page.route('**/api/auth/user', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 1,
          displayName: 'E2E Test Admin',
          email: 'e2e-admin@szl.test',
          roles: ['admin'],
        },
      }),
    }),
  );
  await page.route('**/api/auth/my-roles', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ roles: ['admin'] }),
    }),
  );

  // Graph payload — minimal valid shape so the graph fetch resolves and the
  // toolbar (which hosts the saved-views UI) renders without an error state.
  await page.route('**/api/domains/aegis/graph**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          domain: 'aegis',
          nodes: [],
          edges: [],
          stats: {
            nodeCount: 0,
            edgeCount: 0,
            crossDomainEdgeCount: 0,
            internalEdgeCount: 0,
          },
        },
      }),
    }),
  );

  // Saved-views CRUD — list returns whatever's currently in `state.views`,
  // delete pops the row and increments the call counter so the spec can
  // assert "no DELETE was issued" for the Cancel/Esc paths.
  await page.route('**/api/constellation/views**', (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const idMatch = url.pathname.match(/\/api\/constellation\/views\/(\d+)$/);

    if (method === 'GET' && !idMatch) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: state.views }),
      });
      return;
    }
    if (method === 'DELETE' && idMatch) {
      const id = Number.parseInt(idMatch[1] ?? '0', 10);
      state.deleteCalls += 1;
      state.views = state.views.filter((v) => v.id !== id);
      route.fulfill({ status: 204, body: '' });
      return;
    }
    // Unhandled (POST / PATCH) — fail loudly so a future test author notices.
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: `Unmocked ${method} ${url.pathname}` }),
    });
  });
}

function freshState(): MockState {
  return {
    views: [
      {
        id: VIEW_ID,
        domain: 'aegis',
        name: VIEW_NAME,
        filters: { entityTypeFilter: null, activeOnly: true, sinceWindow: 'all', searchQuery: '' },
      },
      {
        id: SECOND_VIEW_ID,
        domain: 'aegis',
        name: SECOND_VIEW_NAME,
        filters: { entityTypeFilter: null, activeOnly: true, sinceWindow: 'all', searchQuery: '' },
      },
    ],
    deleteCalls: 0,
  };
}

async function openConstellationAndSelectView(page: Page, viewId: number): Promise<void> {
  await page.goto(`${AEGIS_PATH}/constellation`, { waitUntil: 'domcontentloaded' });
  // Wait for the saved-views toolbar (only renders when the GET succeeded).
  const picker = page.getByTestId('constellation-saved-views-picker');
  await expect(picker).toBeVisible({ timeout: 15000 });
  // Wait until the option for our view has been populated by the fetch.
  await expect(picker.locator(`option[value="${viewId}"]`)).toHaveCount(1, {
    timeout: 10000,
  });
  await picker.selectOption(String(viewId));
  await expect(page.getByTestId('constellation-delete-view')).toBeVisible();
}

test.describe('Constellation — Saved-view delete confirmation', () => {
  test('Delete opens a confirmation modal labelled with the view name', async ({ page }) => {
    const state = freshState();
    await installMocks(page, state);
    await openConstellationAndSelectView(page, VIEW_ID);

    await page.getByTestId('constellation-delete-view').click();

    const modal = page.getByTestId('constellation-delete-view-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('role', 'dialog');

    const nameLabel = page.getByTestId('constellation-delete-view-name');
    await expect(nameLabel).toBeVisible();
    await expect(nameLabel).toContainText(VIEW_NAME);

    expect(state.deleteCalls).toBe(0);
  });

  test('Cancel dismisses the modal without issuing a delete', async ({ page }) => {
    const state = freshState();
    await installMocks(page, state);
    await openConstellationAndSelectView(page, VIEW_ID);

    await page.getByTestId('constellation-delete-view').click();
    await expect(page.getByTestId('constellation-delete-view-modal')).toBeVisible();

    await page.getByTestId('constellation-delete-view-cancel').click();

    await expect(page.getByTestId('constellation-delete-view-modal')).toHaveCount(0);
    expect(state.deleteCalls).toBe(0);

    // The view is still selectable in the picker.
    const picker = page.getByTestId('constellation-saved-views-picker');
    await expect(picker.locator(`option[value="${VIEW_ID}"]`)).toHaveCount(1);
  });

  test('Esc dismisses the modal without issuing a delete', async ({ page }) => {
    const state = freshState();
    await installMocks(page, state);
    await openConstellationAndSelectView(page, VIEW_ID);

    await page.getByTestId('constellation-delete-view').click();
    await expect(page.getByTestId('constellation-delete-view-modal')).toBeVisible();

    // Confirm button is autoFocused — pressing Escape from there bubbles to
    // the dialog's onKeyDown handler.
    await page.keyboard.press('Escape');

    await expect(page.getByTestId('constellation-delete-view-modal')).toHaveCount(0);
    expect(state.deleteCalls).toBe(0);
  });

  test('Confirm issues the delete and removes the view from the picker', async ({ page }) => {
    const state = freshState();
    await installMocks(page, state);
    await openConstellationAndSelectView(page, VIEW_ID);

    await page.getByTestId('constellation-delete-view').click();
    await expect(page.getByTestId('constellation-delete-view-modal')).toBeVisible();

    const deleteResp = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/constellation/views/${VIEW_ID}`) &&
        r.request().method() === 'DELETE',
    );
    await page.getByTestId('constellation-delete-view-confirm').click();
    await deleteResp;

    await expect(page.getByTestId('constellation-delete-view-modal')).toHaveCount(0);
    expect(state.deleteCalls).toBe(1);

    // The deleted view is gone from the dropdown; the other view remains.
    const picker = page.getByTestId('constellation-saved-views-picker');
    await expect(picker.locator(`option[value="${VIEW_ID}"]`)).toHaveCount(0);
    await expect(picker.locator(`option[value="${SECOND_VIEW_ID}"]`)).toHaveCount(1);

    // Selection cleared because we just deleted the active view.
    await expect(page.getByTestId('constellation-delete-view')).toHaveCount(0);
  });

  test('Enter on the confirm button issues the delete', async ({ page }) => {
    const state = freshState();
    await installMocks(page, state);
    await openConstellationAndSelectView(page, SECOND_VIEW_ID);

    await page.getByTestId('constellation-delete-view').click();
    await expect(page.getByTestId('constellation-delete-view-modal')).toBeVisible();

    const deleteResp = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/constellation/views/${SECOND_VIEW_ID}`) &&
        r.request().method() === 'DELETE',
    );
    // The confirm button is autoFocused on mount, so Enter activates it.
    await page.keyboard.press('Enter');
    await deleteResp;

    await expect(page.getByTestId('constellation-delete-view-modal')).toHaveCount(0);
    expect(state.deleteCalls).toBe(1);
    const picker = page.getByTestId('constellation-saved-views-picker');
    await expect(picker.locator(`option[value="${SECOND_VIEW_ID}"]`)).toHaveCount(0);
  });
});
