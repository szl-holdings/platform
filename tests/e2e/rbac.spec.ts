/**
 * RBAC E2E — Admin-only access gate
 *
 * Covers the `RequireAdmin` component in artifacts/szl-holdings/src/App.tsx
 * (the "Access Restricted" wall shown to authenticated users who lack
 * the `admin` or `super_admin` role).
 *
 * Strategy:
 *   - Mock `/api/auth/user` so the user is authenticated (passes RequireAuth).
 *   - Mock `/api/auth/my-roles` to control the role set seen by useRole().
 *   - Navigate to an admin-gated route (`/admin/growth-command`).
 *   - Assert the wall is shown for non-admins and bypassed for admins.
 *
 * Server-side role enforcement is covered separately in tests/api/auth.test.ts.
 */
import { test, expect } from "@playwright/test";

const BASE_PATH = process.env.SZL_BASE_PATH ?? "/";
const ADMIN_ROUTE = "/admin/growth-command";

const AUTH_USER_URL = "**/api/auth/user";
const MY_ROLES_URL = "**/api/auth/my-roles";

const MOCK_USER_PAYLOAD = {
  user: {
    id: 1,
    displayName: "E2E RBAC User",
    email: "rbac@szl.test",
    roles: [],
  },
};

function joinBase(path: string): string {
  const base = BASE_PATH.endsWith("/") ? BASE_PATH.slice(0, -1) : BASE_PATH;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}` || "/";
}

async function routeAuthenticated(page: import("@playwright/test").Page) {
  await page.route(AUTH_USER_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER_PAYLOAD),
    }),
  );
}

async function routeRoles(
  page: import("@playwright/test").Page,
  roles: string[],
) {
  await page.route(MY_ROLES_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ roles }),
    }),
  );
}

// ---------------------------------------------------------------------------
// Non-admin authenticated user
// ---------------------------------------------------------------------------

test.describe("RBAC — Authenticated non-admin on admin route", () => {
  test.beforeEach(async ({ page }) => {
    await routeAuthenticated(page);
    await routeRoles(page, ["viewer"]);
    await page.goto(joinBase(ADMIN_ROUTE));
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => null);
  });

  test("shows the Access Restricted wall", async ({ page }) => {
    await expect(page.locator("text=Access Restricted")).toBeVisible({ timeout: 10_000 });
  });

  test("explains that admin or super admin role is required", async ({ page }) => {
    await expect(
      page.locator("text=Admin or Super Admin role required to access this area."),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("does not show the Authentication Required login wall", async ({ page }) => {
    const authWall = page.locator("text=Authentication Required");
    expect(await authWall.isVisible().catch(() => false)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Admin authenticated user
// ---------------------------------------------------------------------------

test.describe("RBAC — Authenticated admin on admin route", () => {
  test.beforeEach(async ({ page }) => {
    await routeAuthenticated(page);
    await routeRoles(page, ["admin"]);
    await page.goto(joinBase(ADMIN_ROUTE));
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => null);
  });

  test("does not show the Access Restricted wall", async ({ page }) => {
    const wall = page.locator("text=Access Restricted");
    expect(await wall.isVisible().catch(() => false)).toBe(false);
  });

  test("renders the protected admin page content", async ({ page }) => {
    // Route-specific marker: the AdminGrowthCommandPage renders an
    // <h1>Founder Command</h1> heading unique to /admin/growth-command.
    await expect(
      page.locator("h1", { hasText: "Founder Command" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Access Restricted")).toHaveCount(0);
    await expect(page.locator("text=Authentication Required")).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe("/admin/growth-command");
  });
});

// ---------------------------------------------------------------------------
// Super admin authenticated user
// ---------------------------------------------------------------------------

test.describe("RBAC — Authenticated super_admin on admin route", () => {
  test("super_admin role bypasses the Access Restricted wall", async ({ page }) => {
    await routeAuthenticated(page);
    await routeRoles(page, ["super_admin"]);
    await page.goto(joinBase(ADMIN_ROUTE));
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => null);

    const wall = page.locator("text=Access Restricted");
    expect(await wall.isVisible().catch(() => false)).toBe(false);
  });
});
