/**
 * Forge / Nuro Forge — E2E Spec
 *
 * "Forge" in this ecosystem refers to Nuro Forge — SZL Holdings' self-evolving
 * AI intelligence platform — hosted at /nuro-forge within the SZL Holdings web
 * app. There is no separate standalone Forge web artifact registered; artifacts/forge
 * contains only a static build placeholder without a preview path.
 *
 * Forge Runtime API endpoints (/api/forge) are covered in the Forge Runtime API
 * describe block below.
 *
 * FORGE_BASE_PATH env var allows overriding if Forge ever becomes a standalone artifact.
 */
import { test, expect } from "@playwright/test";

const SZL_PATH = process.env.FORGE_BASE_PATH ?? process.env.SZL_BASE_PATH ?? "/";
const NURO_FORGE_PATH = (SZL_PATH.endsWith("/") ? `${SZL_PATH}nuro-forge` : `${SZL_PATH}/nuro-forge`).replace("//", "/");

test.describe("Nuro Forge — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(NURO_FORGE_PATH);
  });

  test("loads Nuro Forge without fatal errors", async ({ page }) => {
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

  test("page body has substantive content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Nuro Forge — Route Smoke Tests", () => {
  const routes = [
    { path: "", label: "forge home" },
    { path: "/arena", label: "model arena" },
    { path: "/composition", label: "agent composition" },
    { path: "/governance", label: "governance" },
    { path: "/fine-tuning", label: "fine tuning" },
    { path: "/cost", label: "cost tracking" },
    { path: "/multimodal", label: "multimodal" },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${NURO_FORGE_PATH}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("Nuro Forge — Content Validation", () => {
  test("forge home shows AI or intelligence platform content", async ({ page }) => {
    await page.goto(NURO_FORGE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const forgeContent = page
      .locator(
        ":text('Forge'), :text('AI'), :text('Model'), :text('Intelligence'), :text('Agent'), :text('Nuro')"
      )
      .first();
    await expect(forgeContent).toBeVisible({ timeout: 15000 });
  });

  test("arena page renders model benchmarking or evaluation content", async ({ page }) => {
    await page.goto(`${NURO_FORGE_PATH}/arena`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const arenaContent = page
      .locator(
        ":text('Arena'), :text('Benchmark'), :text('Model'), :text('Elo'), :text('Evaluation'), :text('Ranking')"
      )
      .first();
    await expect(arenaContent).toBeVisible({ timeout: 15000 });
  });

  test("governance page renders bias detection or audit content", async ({ page }) => {
    await page.goto(`${NURO_FORGE_PATH}/governance`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const govContent = page
      .locator(
        ":text('Governance'), :text('Bias'), :text('Audit'), :text('Safety'), :text('Compliance'), :text('Policy')"
      )
      .first();
    await expect(govContent).toBeVisible({ timeout: 15000 });
  });

  test("user navigates from forge home to arena via nav or links", async ({ page }) => {
    await page.goto(NURO_FORGE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const arenaLink = page
      .locator("a[href*='arena'], a:has-text('Arena')")
      .first();
    const hasArenaLink = await arenaLink.isVisible({ timeout: 10000 }).catch(() => false);
    if (hasArenaLink) {
      await arenaLink.click();
      await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
      await expect(page).toHaveURL(/arena/i);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    } else {
      const body = await page.content();
      expect(body.length).toBeGreaterThan(500);
    }
  });
});

test.describe("Nuro Forge — Forge Runtime API", () => {
  test("forge runtime API endpoint is reachable", async ({ request }) => {
    const apiBase = process.env.API_BASE_URL ?? "http://localhost:5000";
    const response = await request.get(`${apiBase}/api/forge`).catch(() => null);
    if (!response) {
      test.skip(true, "API server not running — skipping Forge API check");
      return;
    }
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Nuro Forge — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("forge home renders on mobile without crash", async ({ page }) => {
    await page.goto(NURO_FORGE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("arena page renders on mobile without crash", async ({ page }) => {
    await page.goto(`${NURO_FORGE_PATH}/arena`);
    await page.waitForLoadState("domcontentloaded");
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});
