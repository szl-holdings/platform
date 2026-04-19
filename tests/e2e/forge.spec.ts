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

/**
 * Forge — Mutation E2E Coverage
 *
 * Closes the Sev 2 gap from docs/TESTING_MATRIX.md §7 ("No mutation API E2E
 * coverage for Forge"). The Submit Execution panel on /forge/overview is the
 * canonical browser-driven write surface for /api/forge/submit. These tests
 * load that page in a browser, fill the form, and intercept the POST via
 * page.route() to assert the request contract AND the visible UI response on
 * success / validation / 4xx / 5xx error paths.
 */
const FORGE_OVERVIEW_PATH = (() => {
  const base = SZL_PATH.endsWith("/") ? SZL_PATH.slice(0, -1) : SZL_PATH;
  const path = `${base}/forge/overview`;
  return path.startsWith("/") ? path : `/${path}`;
})();

test.describe("Forge — Submit Execution Mutation E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Stub the overview GET so the page renders deterministically without a
    // live API server. The submit panel is mounted independent of overview
    // data, but stubbing avoids a noisy error banner during the form test.
    await page.route("**/api/forge/overview", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            totals: { agents: 0, executions: 0, promotions: 0, drift: 0, rollbacks: 0 },
            byEnv: {},
            byRisk: {},
            driftStatus: { healthy: 0, drifting: 0, critical: 0 },
            promotionQueue: [],
            recentFailures: [],
            recentRollbacks: [],
          },
        }),
      }),
    );
    // CSRF preflight fired by apiRequest for any POST.
    await page.route("**/api/csrf-token", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: '{"token":"test"}' }),
    );
    await page.goto(FORGE_OVERVIEW_PATH);
    await page.waitForLoadState("domcontentloaded");
    // Verify the submit form rendered. If it didn't, the test must fail loudly
    // — silent skips would mask future regressions.
    await expect(page.getByTestId("form-forge-submit")).toBeVisible({ timeout: 15000 });
  });

  test("submits valid payload, intercepts POST /api/forge/submit, and shows success state", async ({ page }) => {
    let captured: { method: string; body: unknown; contentType: string | null; url: string } | null = null;
    await page.route("**/api/forge/submit", async (route) => {
      const req = route.request();
      captured = {
        method: req.method(),
        body: req.postDataJSON(),
        contentType: req.headers()["content-type"] ?? null,
        url: req.url(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { executionId: "exec_e2e_001", status: "queued" } }),
      });
    });

    await page.getByTestId("input-forge-agent-slug").fill("legal-risk-v3");
    await page.getByTestId("select-forge-env-tier").selectOption("staging");
    await page.getByTestId("input-forge-input-json").fill('{"matterId":"mat_001","task":"risk-scan"}');
    await page.getByTestId("button-forge-submit").click();

    await expect(page.getByTestId("text-forge-submit-success")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("text-forge-submit-success")).toContainText("exec_e2e_001");
    await expect(page.getByTestId("text-forge-submit-success")).toContainText("queued");

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toContain("/api/forge/submit");
    expect(captured!.contentType).toContain("application/json");
    expect(captured!.body).toMatchObject({
      agentSlug: "legal-risk-v3",
      envTier: "staging",
      input: { matterId: "mat_001", task: "risk-scan" },
    });
  });

  test("client-side validation blocks POST when agent slug is empty", async ({ page }) => {
    let posted = false;
    await page.route("**/api/forge/submit", async (route) => {
      posted = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true,"data":{}}' });
    });

    await page.getByTestId("input-forge-agent-slug").fill("");
    await page.getByTestId("button-forge-submit").click();

    await expect(page.getByTestId("text-forge-submit-error")).toContainText(/agent slug is required/i);
    expect(posted).toBe(false);
  });

  test("client-side validation blocks POST when input is not valid JSON", async ({ page }) => {
    let posted = false;
    await page.route("**/api/forge/submit", async (route) => {
      posted = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true,"data":{}}' });
    });

    await page.getByTestId("input-forge-agent-slug").fill("legal-risk-v3");
    await page.getByTestId("input-forge-input-json").fill("{not valid json");
    await page.getByTestId("button-forge-submit").click();

    await expect(page.getByTestId("text-forge-submit-error")).toContainText(/valid json/i);
    expect(posted).toBe(false);
  });

  test("surfaces server 400 validation error to the user", async ({ page }) => {
    await page.route("**/api/forge/submit", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "INVALID_PAYLOAD", message: "agentSlug not registered" }),
      }),
    );

    await page.getByTestId("input-forge-agent-slug").fill("ghost-agent");
    await page.getByTestId("input-forge-input-json").fill("{}");
    await page.getByTestId("button-forge-submit").click();

    await expect(page.getByTestId("text-forge-submit-error")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("text-forge-submit-error")).toContainText("400");
  });

  test("surfaces 5xx runtime failures and re-enables the submit button", async ({ page }) => {
    await page.route("**/api/forge/submit", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "RUNTIME_UNAVAILABLE" }),
      }),
    );

    await page.getByTestId("input-forge-agent-slug").fill("legal-risk-v3");
    await page.getByTestId("input-forge-input-json").fill("{}");
    await page.getByTestId("button-forge-submit").click();

    await expect(page.getByTestId("text-forge-submit-error")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("text-forge-submit-error")).toContainText("503");
    await expect(page.getByTestId("button-forge-submit")).toBeEnabled({ timeout: 5000 });
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
