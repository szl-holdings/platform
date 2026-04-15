import { test, expect } from "@playwright/test";

const PRISM_PATH = process.env.PRISM_BASE_PATH ?? "/prism-counsel";

test.describe("PRISM Counsel — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRISM_PATH);
  });

  test("loads PRISM Counsel app without fatal errors", async ({ page }) => {
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("page title is set", async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
  });

  test("renders main app content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const root = page.locator("#root, main, body").first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test("navigation or sidebar is present", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("page body has substantive content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("PRISM Counsel — Route Smoke Tests", () => {
  const routes = [
    { path: "", label: "dashboard" },
    { path: "/pulse", label: "pulse" },
    { path: "/today", label: "today" },
    { path: "/matters", label: "matters" },
    { path: "/watchlist", label: "watchlist" },
    { path: "/deadlines", label: "deadlines" },
    { path: "/forecast", label: "forecast" },
    { path: "/playbooks", label: "playbooks" },
    { path: "/review-desk", label: "review desk" },
    { path: "/copilot", label: "copilot" },
    { path: "/portfolio", label: "portfolio" },
    { path: "/admin", label: "admin" },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${PRISM_PATH}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("PRISM Counsel — User Journey: Dashboard → Matters → Review Desk", () => {
  test("user navigates to matters via nav and matters page renders", async ({ page }) => {
    await page.goto(PRISM_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const mattersLink = nav
      .locator("a[href*='matter'], a:has-text('Matter'), a:has-text('Matters')")
      .first();
    await expect(mattersLink).toBeVisible({ timeout: 10000 });
    await mattersLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/matter/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("matters page shows matter list or pipeline content", async ({ page }) => {
    await page.goto(`${PRISM_PATH}/matters`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Matter'), :text('Case'), :text('Active'), :text('Status'), :text('Pipeline')"
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test("user navigates from matters to review desk via nav", async ({ page }) => {
    await page.goto(`${PRISM_PATH}/matters`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const reviewLink = nav
      .locator(
        "a[href*='review'], a:has-text('Review'), a:has-text('Review Desk')"
      )
      .first();
    await expect(reviewLink).toBeVisible({ timeout: 10000 });
    await reviewLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/review/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("deadlines page renders deadline or calendar content", async ({ page }) => {
    await page.goto(`${PRISM_PATH}/deadlines`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Deadline'), :text('Due'), :text('Date'), :text('Calendar'), :text('Upcoming')"
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test("copilot page renders AI assistant interface", async ({ page }) => {
    await page.goto(`${PRISM_PATH}/copilot`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("forecast page renders prediction or analytics content", async ({ page }) => {
    await page.goto(`${PRISM_PATH}/forecast`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Forecast'), :text('Predict'), :text('Settlement'), :text('Risk'), :text('Outlook')"
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});

test.describe("PRISM Counsel — Agentic & Intelligence Routes", () => {
  const agenticRoutes = [
    { path: "/agentic/contracts", label: "agentic contracts" },
    { path: "/agentic/litigation-prediction", label: "litigation prediction" },
    { path: "/predict/settlement", label: "settlement predictor" },
    { path: "/predict/judge-analytics", label: "judge analytics" },
  ];

  for (const route of agenticRoutes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${PRISM_PATH}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("PRISM Counsel — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("dashboard renders correctly on mobile", async ({ page }) => {
    await page.goto(PRISM_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("matters page renders on mobile without crash", async ({ page }) => {
    await page.goto(`${PRISM_PATH}/matters`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});
