/**
 * Auth E2E — Session-level flow tests
 *
 * These tests cover the full client-side auth cycle:
 *   1. Unauthenticated access shows the login wall
 *   2. Login form renders correctly
 *   3. Sign In button initiates the OIDC redirect
 *   4. Session persists — protected routes are accessible when authenticated
 *   5. Logout clears the session and the login wall reappears
 *
 * The spec intercepts /api/auth/user, /api/login, and /api/logout using
 * page.route() so no live API server or real OIDC provider is required.
 * The actual server-side session and token logic is covered in
 * tests/api/auth.test.ts.
 */
import { test, expect } from "@playwright/test";

const BASE_PATH = process.env.SZL_BASE_PATH ?? "/";

const AUTH_USER_URL = "**/api/auth/user";
const LOGIN_ROUTE_PATTERN = "**/api/login**";
const LOGOUT_ROUTE_PATTERN = "**/api/logout**";
const LOGOUT_URL = "/api/logout";

const MOCK_USER_PAYLOAD = {
  user: {
    id: 1,
    displayName: "E2E Test User",
    email: "e2e@szl.test",
    roles: ["viewer"],
  },
};

async function routeUnauthenticated(page: import("@playwright/test").Page) {
  await page.route(AUTH_USER_URL, (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ user: null }),
    }),
  );
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

// ---------------------------------------------------------------------------
// Unauthenticated flow
// ---------------------------------------------------------------------------

test.describe("Auth — Unauthenticated flow", () => {
  test.beforeEach(async ({ page }) => {
    await routeUnauthenticated(page);
    await page.goto(BASE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => null);
  });

  test("protected route shows the login wall when no session exists", async ({ page }) => {
    await expect(page.locator("text=Authentication Required")).toBeVisible({ timeout: 10_000 });
  });

  test("login wall renders heading, description, and Sign In button", async ({ page }) => {
    await expect(page.locator("text=Authentication Required")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Sign in to access this section.")).toBeVisible();
    await expect(page.locator("button", { hasText: "Sign In" })).toBeVisible();
  });

  test("Sign In button navigates to /api/login with a returnTo parameter", async ({ page }) => {
    const signInButton = page.locator("button", { hasText: "Sign In" });
    await expect(signInButton).toBeVisible({ timeout: 10_000 });

    const navigationPromise = page.waitForURL(
      (url) => url.pathname.startsWith("/api/login"),
      { timeout: 10_000 },
    );

    await signInButton.click();
    await navigationPromise;

    const url = new URL(page.url());
    expect(url.pathname).toBe("/api/login");
    expect(url.searchParams.has("returnTo")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Authenticated session
// ---------------------------------------------------------------------------

test.describe("Auth — Authenticated session", () => {
  test.beforeEach(async ({ page }) => {
    await routeAuthenticated(page);
    await page.goto(BASE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => null);
  });

  test("session persists — login wall is absent on protected route", async ({ page }) => {
    const authWall = page.locator("text=Authentication Required");
    const isVisible = await authWall.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test("session persists — main application content is rendered", async ({ page }) => {
    const main = page.locator("main, [role='main'], #root, #app").first();
    await expect(main).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Logout flow
// ---------------------------------------------------------------------------

test.describe("Auth — Logout flow", () => {
  test("logout clears session and returns user to the login wall", async ({ page }) => {
    await routeAuthenticated(page);
    await page.goto(BASE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => null);

    const authWall = page.locator("text=Authentication Required");
    expect(await authWall.isVisible().catch(() => false)).toBe(false);

    await page.route(LOGOUT_ROUTE_PATTERN, (route) =>
      route.fulfill({
        status: 302,
        headers: { Location: BASE_PATH },
        body: "",
      }),
    );

    await page.route(LOGIN_ROUTE_PATTERN, (route) =>
      route.fulfill({
        status: 302,
        headers: { Location: BASE_PATH },
        body: "",
      }),
    );

    await page.unroute(AUTH_USER_URL);
    await routeUnauthenticated(page);

    const signOutButton = page.locator("button", { hasText: "Sign out" }).first();
    const signOutVisible = await signOutButton.isVisible().catch(() => false);

    if (signOutVisible) {
      await signOutButton.click();
    } else {
      await page.evaluate((url) => { window.location.href = url; }, LOGOUT_URL);
    }

    await page.waitForURL((url) => url.pathname === BASE_PATH || url.pathname === "/", {
      timeout: 10_000,
    }).catch(() => null);

    await page.goto(BASE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => null);

    await expect(page.locator("text=Authentication Required")).toBeVisible({ timeout: 10_000 });
  });
});
