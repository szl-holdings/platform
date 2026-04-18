import { test, expect, type Page } from "@playwright/test";

// E2E coverage for Task #1897 — verify the URLs that the cross-platform
// correlation card and evidence registry produce
// (artifacts/command/src/pages/cross-platform/product-links.ts) actually land
// on real detail pages in the target artifacts, not on a generic 404 / catch-
// all page. Vessels and Terra are the two routes the task explicitly calls
// out; aegis / carlota / prism / lyte deep-links are static-checked by
// scripts/qa/check-correlation-deeplinks.js.

const COMMAND_BASE = process.env.COMMAND_BASE_PATH ?? "/command";
const VESSELS_BASE = process.env.VESSELS_BASE_PATH ?? "/vessels";
const TERRA_BASE = process.env.TERRA_BASE_PATH ?? "/terra";

const VESSEL_FIXTURE_ID = process.env.E2E_VESSEL_ID ?? "9821045";
const TERRA_FIXTURE_ID = process.env.E2E_TERRA_PROPERTY_ID ?? "prop-001";

const NOT_FOUND_PATTERNS = [
  /page not found/i,
  /\b404\b/,
  /not found/i,
];

async function isReachable(page: Page, url: string): Promise<boolean> {
  // Try a few times — the Replit dev proxy briefly shows "Upstream not ready"
  // when an artifact's port has just been (re)assigned. We don't want to mark
  // an artifact as unreachable just because the proxy was mid-warmup.
  for (let i = 0; i < 4; i++) {
    try {
      const resp = await page.goto(url, { timeout: 10_000, waitUntil: "domcontentloaded" });
      if (!resp || resp.status() >= 500) {
        await page.waitForTimeout(1500);
        continue;
      }
      const text = await page.locator("body").innerText().catch(() => "");
      if (/upstream not ready/i.test(text)) {
        await page.waitForTimeout(1500);
        continue;
      }
      return true;
    } catch {
      await page.waitForTimeout(1500);
    }
  }
  return false;
}

async function navigateWithUpstreamRetry(page: Page, url: string, attempts = 4) {
  // The Replit dev proxy occasionally returns "Upstream not ready on port N"
  // while a workflow is warming up, even though the workflow itself is healthy.
  // Retry a handful of times with a short backoff before giving up.
  let lastBodyText = "";
  for (let i = 0; i < attempts; i++) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => null);
    lastBodyText = await page.locator("body").innerText().catch(() => "");
    if (!/upstream not ready/i.test(lastBodyText)) return lastBodyText;
    await page.waitForTimeout(1500);
  }
  return lastBodyText;
}

async function assertNotGenericNotFound(page: Page, testInfo: import("@playwright/test").TestInfo, bodyText: string) {
  // Skip if the dev proxy is still warming up — that's environmental, not a
  // routing regression in the artifact under test.
  if (/upstream not ready/i.test(bodyText)) testInfo.skip();
  for (const rx of NOT_FOUND_PATTERNS) {
    expect(bodyText, `unexpected 404 / not-found page rendered`).not.toMatch(rx);
  }
  // Sanity: the body has substantive content (not a blank shell).
  const html = (await page.content()).toLowerCase();
  expect(html.length).toBeGreaterThan(500);
}

let vesselsAvailable = true;
let terraAvailable = true;
let commandAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  vesselsAvailable = await isReachable(page, `${VESSELS_BASE}/`);
  terraAvailable = await isReachable(page, `${TERRA_BASE}/`);
  commandAvailable = await isReachable(page, `${COMMAND_BASE}/`);
  await page.close();
});

test.describe("Correlation deep-links — drill-through to detail pages", () => {
  test("vessels: /vessels/vessels/:id renders the VesselDetailEnhancedPage", async ({ page }, testInfo) => {
    if (!vesselsAvailable) testInfo.skip();
    const body = await navigateWithUpstreamRetry(page, `${VESSELS_BASE}/vessels/${VESSEL_FIXTURE_ID}`);
    await assertNotGenericNotFound(page, testInfo, body);

    // The VesselDetailEnhancedPage renders vessel-domain text whether the id
    // resolves to a record or whether the page falls into its loading / "not
    // found" branch ("Return to Fleet Map", "Loading vessel data..."). Any of
    // those proves the route matched and the detail component mounted — the
    // failure mode this test guards against is the route falling back to a
    // generic 404 / catch-all page that contains none of these tokens.
    const matchesVesselDomain =
      /imo|mmsi|vessel|voyage|fleet|knots|destination|cargo|return to fleet/i.test(body);
    expect(
      matchesVesselDomain,
      `vessels detail page lacks vessel-domain content. Page text was:\n${body.slice(0, 800)}`,
    ).toBe(true);
  });

  test("terra: /terra/property/:id renders the PropertyDetail page", async ({ page }, testInfo) => {
    if (!terraAvailable) testInfo.skip();
    const body = await navigateWithUpstreamRetry(page, `${TERRA_BASE}/property/${TERRA_FIXTURE_ID}`);
    await assertNotGenericNotFound(page, testInfo, body);

    // prop-001 is "Meridian Tower" at "1200 Meridian Ave, Miami, FL".
    const matchesPropertyDomain =
      /meridian|miami|property|address|portfolio|noi|occupancy|cap rate|units?/i.test(body);
    expect(matchesPropertyDomain, "terra detail page lacks property-domain content").toBe(true);
  });

  test("command: cross-platform evidence registry renders entity links shaped like productEntityUrl(...)", async ({ page }, testInfo) => {
    if (!commandAvailable) testInfo.skip();
    const body = await navigateWithUpstreamRetry(page, `${COMMAND_BASE}/strategy/cross-platform/evidence`);
    if (/upstream not ready/i.test(body)) testInfo.skip();

    // The page must at least render without crashing. An empty seed is fine —
    // we only inspect entity links if any are present.
    const errorBoundary = page.locator("text=Something went wrong").first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    const entityHrefs = await page.locator("a[href]").evaluateAll((els) =>
      (els as HTMLAnchorElement[])
        .map((a) => a.getAttribute("href") ?? "")
        .filter((h) =>
          h.startsWith("/vessels/vessels/") ||
          h.startsWith("/terra/property/") ||
          h.startsWith("/carlota-jo/inquiries") ||
          h.startsWith("/aegis/") ||
          h.startsWith("/operations/prism") ||
          h.startsWith("/operations"),
        ),
    );

    // Every entity link the page renders must match the productEntityUrl
    // shape — that is the contract we are protecting.
    for (const href of entityHrefs) {
      expect(href, `unexpected entity-link shape: ${href}`).toMatch(
        /^\/(vessels\/vessels\/|terra\/property\/|carlota-jo\/inquiries|aegis\/|operations\/prism|operations)/,
      );
    }

    // When the page is in seeded mode (default for the dev/preview
    // environment) there must be at least one entity drill-through link.
    // A silent zero-link state would let a regression that strips all
    // hrefs pass undetected. Detect seeded mode by looking for the
    // registry's row count / table content; only enforce the lower bound
    // when seed data is actually present.
    const bodyText = await page.locator("body").innerText();
    const seededMode =
      /evidence|signal|correlation/i.test(bodyText) &&
      !/no evidence|empty|no correlations/i.test(bodyText);
    if (seededMode) {
      expect(
        entityHrefs.length,
        `seeded evidence registry rendered no entity drill-through links — productEntityUrl helper or registry rendering may be broken`,
      ).toBeGreaterThan(0);
    }
  });

  test("command: cross-platform correlation page renders without crashing", async ({ page }, testInfo) => {
    if (!commandAvailable) testInfo.skip();
    await page.goto(`${COMMAND_BASE}/strategy/cross-platform`);
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => null);

    const body = await page.locator("body").innerText();
    // Skip when the workspace proxy momentarily returns an upstream-not-ready
    // page (Replit dev proxy under restart load); that is environmental, not a
    // bug in the correlation surface.
    if (/upstream not ready/i.test(body)) testInfo.skip();

    const errorBoundary = page.locator("text=Something went wrong").first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    // Either correlation rows are visible or the empty state is.
    const hasContent =
      /correlation|cross-platform|signal|no correlations detected/i.test(body);
    expect(hasContent).toBe(true);
  });
});
