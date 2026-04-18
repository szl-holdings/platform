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

  // The valid productEntityUrl shapes any entity drill-through link in the
  // command artifact may take. Anything outside this set is treated as a
  // malformed link and FAILS the test (no pre-filtering).
  const VALID_ENTITY_HREF =
    /^\/(vessels\/vessels\/[^/?#]+|terra\/property\/[^/?#]+|carlota-jo\/inquiries(\/[^/?#]+|$|\?)|aegis(\/|\?|$)|operations\/prism(\/[^/?#]+|$|\?)|operations(\/[^/?#]+|$|\?))/;

  // Anchors whose href looks like a product/entity drill-through link (i.e.
  // points into another artifact via a top-level prefix). This intentionally
  // captures EVERY artifact-prefixed href so that malformed links can fail.
  const ARTIFACT_PREFIX =
    /^\/(vessels|terra|carlota-jo|aegis|operations|sentra|counsel|pulse|lyte|prism-counsel)\b/;

  test("command: cross-platform evidence registry renders entity links shaped like productEntityUrl(...)", async ({ page }, testInfo) => {
    if (!commandAvailable) testInfo.skip();
    const body = await navigateWithUpstreamRetry(page, `${COMMAND_BASE}/strategy/cross-platform/evidence`);
    if (/upstream not ready/i.test(body)) testInfo.skip();

    const errorBoundary = page.locator("text=Something went wrong").first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    // Pull EVERY artifact-prefixed href without pre-filtering to known-good
    // prefixes. Anything that points at another artifact must match the
    // productEntityUrl shape; anything else is a malformed link bug.
    const allArtifactHrefs = await page.locator("a[href]").evaluateAll((els) =>
      (els as HTMLAnchorElement[])
        .map((a) => a.getAttribute("href") ?? "")
        .filter((h) => h.startsWith("/") && !h.startsWith("//")),
    );
    const artifactHrefs = allArtifactHrefs.filter((h) => ARTIFACT_PREFIX.test(h));

    for (const href of artifactHrefs) {
      expect(href, `evidence registry rendered a malformed artifact link: ${href}`).toMatch(
        VALID_ENTITY_HREF,
      );
    }

    // Seeded-mode lower bound: the dev/preview environment ships with seed
    // evidence rows. If we can see registry rows at all, there must be at
    // least one entity drill-through link, otherwise something stripped them.
    const bodyText = await page.locator("body").innerText();
    const seededMode =
      /evidence|signal|correlation/i.test(bodyText) &&
      !/no evidence|empty|no correlations/i.test(bodyText);
    if (seededMode) {
      expect(
        artifactHrefs.length,
        `seeded evidence registry rendered no artifact drill-through links — productEntityUrl helper or registry rendering may be broken`,
      ).toBeGreaterThan(0);
    }

    // Click-through: pick the first vessels OR terra entity link, follow it
    // (the registry uses target="_blank", so handle the popup), and assert
    // the destination URL/page-content match. This is the true end-to-end
    // signal the reviewer asked for.
    const clickable = artifactHrefs.find(
      (h) => h.startsWith("/vessels/vessels/") || h.startsWith("/terra/property/"),
    );
    if (clickable) {
      const link = page.locator(`a[href="${clickable}"]`).first();
      const popupPromise = page.context().waitForEvent("page", { timeout: 5_000 }).catch(() => null);
      await link.click({ modifiers: [] });
      const popup = await popupPromise;
      const dest = popup ?? page;
      await dest.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => null);
      await dest.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => null);
      expect(dest.url(), `click-through landed on unexpected URL`).toContain(clickable);
      const destText = await dest.locator("body").innerText().catch(() => "");
      if (!/upstream not ready/i.test(destText)) {
        await assertNotGenericNotFound(dest as Page, testInfo, destText);
        const destDomain = clickable.startsWith("/vessels/")
          ? /vessel|fleet|imo|mmsi|voyage|return to fleet/i
          : /property|terra|portfolio|tower|leas|tenant/i;
        expect(
          destDomain.test(destText),
          `click-through destination ${dest.url()} lacks expected domain content. Body:\n${destText.slice(0, 500)}`,
        ).toBe(true);
      }
      if (popup) await popup.close().catch(() => null);
    }
  });

  test("command: cross-platform correlation page wires real product drill-through links", async ({ page }, testInfo) => {
    if (!commandAvailable) testInfo.skip();
    const body = await navigateWithUpstreamRetry(page, `${COMMAND_BASE}/strategy/cross-platform`);
    if (/upstream not ready/i.test(body)) testInfo.skip();

    const errorBoundary = page.locator("text=Something went wrong").first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    const hasContent =
      /correlation|cross-platform|signal|no correlations detected/i.test(body);
    expect(hasContent).toBe(true);

    // Same contract as evidence registry: every artifact-prefixed link must
    // be a valid productEntityUrl/productDashboardUrl shape — no pre-filter.
    const allArtifactHrefs = await page.locator("a[href]").evaluateAll((els) =>
      (els as HTMLAnchorElement[])
        .map((a) => a.getAttribute("href") ?? "")
        .filter((h) => h.startsWith("/") && !h.startsWith("//")),
    );
    const artifactHrefs = allArtifactHrefs.filter((h) => ARTIFACT_PREFIX.test(h));

    for (const href of artifactHrefs) {
      expect(href, `correlation page rendered a malformed artifact link: ${href}`).toMatch(
        VALID_ENTITY_HREF,
      );
    }

    // Seeded-mode lower bound for correlation cards too — if the page shows
    // any correlation rows, at least one card must wire a drill-through link.
    const seededMode =
      /correlation|signal/i.test(body) && !/no correlations detected|empty/i.test(body);
    if (seededMode) {
      expect(
        artifactHrefs.length,
        `seeded correlation page rendered no artifact drill-through links — card-link wiring or productEntityUrl may be broken`,
      ).toBeGreaterThan(0);
    }

    // Click-through one vessels or terra link from the correlation page.
    const clickable = artifactHrefs.find(
      (h) => h.startsWith("/vessels/vessels/") || h.startsWith("/terra/property/"),
    );
    if (clickable) {
      const link = page.locator(`a[href="${clickable}"]`).first();
      const popupPromise = page.context().waitForEvent("page", { timeout: 5_000 }).catch(() => null);
      await link.click({ modifiers: [] });
      const popup = await popupPromise;
      const dest = popup ?? page;
      await dest.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => null);
      await dest.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => null);
      expect(dest.url(), `correlation card click landed on unexpected URL`).toContain(clickable);
      const destText = await dest.locator("body").innerText().catch(() => "");
      if (!/upstream not ready/i.test(destText)) {
        await assertNotGenericNotFound(dest as Page, testInfo, destText);
      }
      if (popup) await popup.close().catch(() => null);
    }
  });
});
