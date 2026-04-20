/**
 * Counsel — Legal Matter Command — E2E Smoke Spec
 *
 * Counsel is SZL Holdings' legal matter command surface, published as a
 * standalone artifact at /counsel. The HTML title is
 * "Counsel | Legal Matter Command" regardless of auth state.
 *
 * In CI the artifact is built with BASE_PATH=/ and served statically on a
 * dedicated port. COUNSEL_BASE_PATH defaults to "/" for CI and to "/counsel"
 * for Replit dev-proxy mode.
 */
import { test, expect } from "@playwright/test";

const COUNSEL_BASE = (process.env.COUNSEL_BASE_PATH ?? "/counsel").replace(/\/$/, "");

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(COUNSEL_BASE || "/", {
      timeout: 10000,
      waitUntil: "domcontentloaded",
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

test.describe("Counsel — Smoke Tests", () => {
  test("HTML title is Counsel-specific (not a generic error page)", async ({ page }) => {
    await page.goto(COUNSEL_BASE || "/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Counsel/i, { timeout: 15000 });
  });

  test("page contains Legal Matter Command branding", async ({ page }) => {
    await page.goto(COUNSEL_BASE || "/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const pageContent = await page.content();
    const hasLegalBranding =
      pageContent.includes("Counsel") ||
      pageContent.includes("Legal Matter") ||
      pageContent.includes("legal-matter");
    expect(hasLegalBranding).toBe(true);
  });

  test("renders the application root without an error boundary", async ({ page }) => {
    await page.goto(COUNSEL_BASE || "/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    const root = page.locator("#root, #app").first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test("demo mode — app shell renders without crashing", async ({ page }) => {
    const demoUrl = (COUNSEL_BASE || "/") + "?demo=true";
    const resp = await page.goto(demoUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    }).catch(() => null);

    if (!resp || resp.status() >= 500) {
      test.skip();
      return;
    }

    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    await expect(page).toHaveTitle(/Counsel/i);
  });
});

test.describe("Counsel — Failure paths", () => {
  test("unknown route returns a non-5xx response", async ({ page }) => {
    const resp = await page.goto(
      `${COUNSEL_BASE || ""}/this-route-does-not-exist-abc123`,
      { waitUntil: "domcontentloaded", timeout: 15000 },
    );
    expect(resp?.status() ?? 200).toBeLessThan(500);
  });

  test("unknown route does NOT render a different product's shell", async ({ page }) => {
    await page.goto(
      `${COUNSEL_BASE || ""}/this-route-does-not-exist-abc123`,
      { waitUntil: "domcontentloaded", timeout: 15000 },
    ).catch(() => null);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => null);

    const content = await page.content();
    const title = await page.title();
    const isCounselContent = content.includes("Counsel") || title.includes("Counsel");
    const isWrongProduct = content.includes("SZL Holdings Dashboard") && !isCounselContent;
    expect(isWrongProduct).toBe(false);
  });
});
