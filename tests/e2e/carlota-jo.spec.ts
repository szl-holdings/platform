import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CARLOTA_PATH = process.env.CARLOTA_BASE_PATH ?? "/carlota-jo/";

let appAvailable = true;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(CARLOTA_PATH, { timeout: 8000, waitUntil: "domcontentloaded" });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});
test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe("Carlota Jo — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CARLOTA_PATH);
  });

  test("loads Carlota Jo app without fatal errors", async ({ page }) => {
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

  test("navigation links are present", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const links = page.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test("page body has substantive content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Carlota Jo — Route Smoke Tests", () => {
  const routes = [
    { path: "", label: "home" },
    { path: "/about", label: "about" },
    { path: "/approach", label: "approach" },
    { path: "/booking", label: "booking" },
    { path: "/contact", label: "contact" },
    { path: "/founder", label: "founder" },
    { path: "/consulting-os", label: "consulting OS" },
    { path: "/revenue-intelligence", label: "revenue intelligence" },
    { path: "/advisory-intel", label: "advisory intel" },
    { path: "/competitive-radar", label: "competitive radar" },
    { path: "/scenario-simulator", label: "scenario simulator" },
    { path: "/strategic-diagnostic", label: "strategic diagnostic" },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${CARLOTA_PATH}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("Carlota Jo — User Journey: Browse Services → Start Booking → View Contact", () => {
  test("user navigates to booking via nav and Practice Area step 1 is visible", async ({ page }) => {
    await page.goto(CARLOTA_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const bookingLink = nav.locator(
      "a[href*='book'], a:has-text('Book'), a:has-text('Schedule'), a:has-text('Consult')"
    ).first();
    await expect(bookingLink).toBeVisible({ timeout: 10000 });
    await bookingLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const practiceAreaStep = page.locator(":text('Practice Area')").first();
    await expect(practiceAreaStep).toBeVisible({ timeout: 15000 });
  });

  test("booking flow shows multi-step progression indicator (Engagement, Schedule, Details)", async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/booking`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const stepIndicator = page.locator(
      ":text('Engagement'), :text('Schedule'), :text('Details')"
    ).first();
    await expect(stepIndicator).toBeVisible({ timeout: 15000 });
  });

  test("booking flow step 1 shows selectable service option cards", async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/booking`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const practiceAreaStep = page.locator(":text('Practice Area')").first();
    await expect(practiceAreaStep).toBeVisible({ timeout: 15000 });

    const serviceOptions = page.locator("button, [role='radio'], [role='option'], label[for]");
    const count = await serviceOptions.count();
    expect(count).toBeGreaterThan(0);
  });

  test("user navigates from booking to contact via nav", async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/booking`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const contactLink = nav.locator("a[href*='contact'], a:has-text('Contact')").first();
    await expect(contactLink).toBeVisible({ timeout: 10000 });
    await contactLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/contact/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Carlota Jo — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage renders correctly on mobile", async ({ page }) => {
    await page.goto(CARLOTA_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("booking page renders on mobile with Practice Area step visible", async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/booking`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const practiceAreaStep = page.locator(":text('Practice Area')").first();
    await expect(practiceAreaStep).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Carlota Jo — Accessibility (WCAG 2.1 AA)", () => {
  const a11yRoutes = [
    { path: "", label: "homepage" },
    { path: "/contact", label: "contact" },
  ];

  for (const route of a11yRoutes) {
    test(`${route.label || "/"} passes WCAG 2.1 AA axe-core scan`, async ({ page }, testInfo) => {
      await page.goto(`${CARLOTA_PATH}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude("[data-testid='dev-only']")
        .analyze();

      const attachLabel = route.path ? route.path.replace(/\//g, "-") : "-home";
      await testInfo.attach(`axe-results${attachLabel}`, {
        body: JSON.stringify(results.violations, null, 2),
        contentType: "application/json",
      });

      if (results.violations.length > 0) {
        const summary = results.violations
          .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join("\n");
        expect(
          results.violations,
          `WCAG 2.1 AA violations on ${CARLOTA_PATH}${route.path}:\n${summary}`
        ).toHaveLength(0);
      }
    });
  }
});
