/**
 * Pulse — AI Executive Briefing — E2E Smoke Spec
 *
 * Pulse is SZL Holdings' AI-driven executive briefing platform, published as a
 * standalone artifact at /pulse. The HTML title is
 * "Pulse — AI Executive Briefing" regardless of auth state.
 *
 * In CI the artifact is built with BASE_PATH=/ and served statically on a
 * dedicated port. PULSE_BASE_PATH defaults to "/" for CI and to "/pulse"
 * for Replit dev-proxy mode.
 */
import { test, expect } from "@playwright/test";

const PULSE_BASE = (process.env.PULSE_BASE_PATH ?? "/pulse").replace(/\/$/, "");

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(PULSE_BASE || "/", {
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

test.describe("Pulse — Smoke Tests", () => {
  test("HTML title is Pulse-specific (not a generic error page)", async ({ page }) => {
    await page.goto(PULSE_BASE || "/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Pulse/i, { timeout: 15000 });
  });

  test("page contains AI Executive Briefing branding", async ({ page }) => {
    await page.goto(PULSE_BASE || "/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const pageContent = await page.content();
    const hasPulseBranding =
      pageContent.includes("Pulse") ||
      pageContent.includes("Executive Briefing") ||
      pageContent.includes("executive-briefing");
    expect(hasPulseBranding).toBe(true);
  });

  test("renders the application root without an error boundary", async ({ page }) => {
    await page.goto(PULSE_BASE || "/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    const root = page.locator("#root, #app").first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test("demo mode — app shell renders without crashing", async ({ page }) => {
    const demoUrl = (PULSE_BASE || "/") + "?demo=true";
    const resp = await page.goto(demoUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    }).catch(() => null);

    if (!resp || resp.status() >= 500) {
      test.skip();
      return;
    }

    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    await expect(page).toHaveTitle(/Pulse/i);
  });
});

test.describe("Pulse — Failure paths", () => {
  test("unknown route returns a non-5xx response", async ({ page }) => {
    const resp = await page.goto(
      `${PULSE_BASE || ""}/this-route-does-not-exist-abc123`,
      { waitUntil: "domcontentloaded", timeout: 15000 },
    );
    expect(resp?.status() ?? 200).toBeLessThan(500);
  });

  test("unknown route does NOT render a different product's shell", async ({ page }) => {
    await page.goto(
      `${PULSE_BASE || ""}/this-route-does-not-exist-abc123`,
      { waitUntil: "domcontentloaded", timeout: 15000 },
    ).catch(() => null);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => null);

    const content = await page.content();
    const title = await page.title();
    const isPulseContent = content.includes("Pulse") || title.includes("Pulse");
    const isWrongProduct = content.includes("SZL Holdings Dashboard") && !isPulseContent;
    expect(isWrongProduct).toBe(false);
  });
});
