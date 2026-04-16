import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const BASE_PATH = process.env.SZL_BASE_PATH ?? "/";

const CRITICAL_PUBLIC_ROUTES = [
  { path: "/", label: "homepage" },
  { path: "/about", label: "about" },
  { path: "/contact", label: "contact" },
  { path: "/trust-center", label: "trust center" },
  { path: "/ecosystem", label: "ecosystem" },
];

test.describe("Accessibility — SZL Holdings Public Routes", () => {
  for (const route of CRITICAL_PUBLIC_ROUTES) {
    test(`${route.label} (${route.path}) has no critical a11y violations`, async ({ page }) => {
      const url = `${BASE_URL}${BASE_PATH}${route.path}`.replace(/\/\//g, "/").replace(":/", "://");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude("[data-testid='dev-only']")
        .analyze();

      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      if (criticalOrSerious.length > 0) {
        const summary = criticalOrSerious
          .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join("\n");
        expect.soft(criticalOrSerious, `Critical/serious a11y violations:\n${summary}`).toHaveLength(0);
      }

      expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
    });
  }

  test("homepage document has a title", async ({ page }) => {
    await page.goto(`${BASE_URL}${BASE_PATH}`, { waitUntil: "domcontentloaded" });
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test("homepage has a main landmark", async ({ page }) => {
    await page.goto(`${BASE_URL}${BASE_PATH}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);
    const main = page.locator("main, [role='main']").first();
    await expect(main).toBeVisible({ timeout: 10000 });
  });

  test("interactive elements on homepage have accessible names", async ({ page }) => {
    await page.goto(`${BASE_URL}${BASE_PATH}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);

    const results = await new AxeBuilder({ page })
      .withRules(["button-name", "link-name", "image-alt", "label"])
      .analyze();

    const violations = results.violations;
    if (violations.length > 0) {
      const summary = violations
        .map((v) => `${v.id}: ${v.description} (${v.nodes.length} node(s))`)
        .join("\n");
      expect(violations, `Interactive element a11y violations:\n${summary}`).toHaveLength(0);
    }
  });
});
