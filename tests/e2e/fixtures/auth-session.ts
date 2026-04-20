/**
 * Playwright auth fixture — storage-state-based session strategy
 *
 * Strategy: mock the /api/auth/user endpoint at the network level so no real
 * OIDC provider is required. This is the same technique used by auth.spec.ts
 * but lifted into a shared fixture so every spec that needs an authenticated
 * context can import it instead of re-implementing the mocking logic.
 *
 * Usage in a spec:
 *
 *   import { test, expect } from "./fixtures/auth-session";
 *   // `page` in `test(...)` is automatically authenticated.
 *
 * For specs that explicitly need the unauthenticated state, keep using
 * `@playwright/test` directly and set up page.route() manually (as auth.spec.ts does).
 */

import { test as base, expect, type Page } from '@playwright/test';

const BASE_PATH = process.env.SZL_BASE_PATH ?? '/';
const AUTH_USER_URL = '**/api/auth/user';
const ROLES_URL = '**/api/auth/my-roles';

export const MOCK_ADMIN_USER = {
  user: {
    id: 1,
    displayName: 'E2E Test Admin',
    email: 'e2e-admin@szl.test',
    roles: ['admin'],
  },
};

export const MOCK_VIEWER_USER = {
  user: {
    id: 2,
    displayName: 'E2E Test Viewer',
    email: 'e2e-viewer@szl.test',
    roles: ['viewer'],
  },
};

async function mockAuthUser(page: Page, payload: typeof MOCK_ADMIN_USER) {
  await page.route(AUTH_USER_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    }),
  );
  await page.route(ROLES_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ roles: payload.user.roles }),
    }),
  );
}

export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await mockAuthUser(page, MOCK_VIEWER_USER);
    await page.goto(BASE_PATH, { waitUntil: 'domcontentloaded' });
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await mockAuthUser(page, MOCK_ADMIN_USER);
    await page.goto(BASE_PATH, { waitUntil: 'domcontentloaded' });
    await use(page);
  },
});

export { expect };
