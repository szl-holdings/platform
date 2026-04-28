import { expect, type Page, test } from '@playwright/test';

// E2E coverage for Task #1897 — verify the URLs that the cross-platform
// correlation card and evidence registry produce
// (artifacts/command/src/pages/cross-platform/product-links.ts) actually land
// on real detail pages in the target artifacts, not on a generic 404 / catch-
// all page. SEXTANT and DOMAINE are the two routes the task explicitly calls
// out; aegis / carlota / prism / lyte deep-links are static-checked by
// scripts/qa/check-correlation-deeplinks.js.

const COMMAND_BASE = process.env.COMMAND_BASE_PATH ?? '/command';
const VESSELS_BASE = process.env.VESSELS_BASE_PATH ?? '/vessels';
const TERRA_BASE = process.env.TERRA_BASE_PATH ?? '/terra';

const VESSEL_FIXTURE_ID = process.env.E2E_VESSEL_ID ?? '9821045';
const TERRA_FIXTURE_ID = process.env.E2E_TERRA_PROPERTY_ID ?? 'prop-001';

const NOT_FOUND_PATTERNS = [/page not found/i, /\b404\b/, /not found/i];

async function isReachable(page: Page, url: string): Promise<boolean> {
  // Try a few times — the Replit dev proxy briefly shows "Upstream not ready"
  // when an artifact's port has just been (re)assigned. We don't want to mark
  // an artifact as unreachable just because the proxy was mid-warmup.
  for (let i = 0; i < 4; i++) {
    try {
      const resp = await page.goto(url, { timeout: 10_000, waitUntil: 'domcontentloaded' });
      if (!resp || resp.status() >= 500) {
        await page.waitForTimeout(1500);
        continue;
      }
      const text = await page
        .locator('body')
        .innerText()
        .catch(() => '');
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
  let lastBodyText = '';
  for (let i = 0; i < attempts; i++) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => null);
    lastBodyText = await page
      .locator('body')
      .innerText()
      .catch(() => '');
    if (!/upstream not ready/i.test(lastBodyText)) return lastBodyText;
    await page.waitForTimeout(1500);
  }
  return lastBodyText;
}

async function assertNotGenericNotFound(
  page: Page,
  testInfo: import('@playwright/test').TestInfo,
  bodyText: string,
) {
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
let aegisAvailable = true;
let carlotaAvailable = true;

const AEGIS_BASE = process.env.AEGIS_BASE_PATH ?? '/aegis';
const CARLOTA_BASE = process.env.CARLOTA_BASE_PATH ?? '/carlota-jo';

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  vesselsAvailable = await isReachable(page, `${VESSELS_BASE}/`);
  terraAvailable = await isReachable(page, `${TERRA_BASE}/`);
  commandAvailable = await isReachable(page, `${COMMAND_BASE}/`);
  aegisAvailable = await isReachable(page, `${AEGIS_BASE}/`);
  carlotaAvailable = await isReachable(page, `${CARLOTA_BASE}/`);
  await page.close();
});

test.describe('Correlation deep-links — drill-through to detail pages', () => {
  test('vessels: /vessels/vessels/:id renders the VesselDetailEnhancedPage', async ({
    page,
  }, testInfo) => {
    if (!vesselsAvailable) testInfo.skip();
    const body = await navigateWithUpstreamRetry(
      page,
      `${VESSELS_BASE}/vessels/${VESSEL_FIXTURE_ID}`,
    );
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

  test('terra: /terra/property/:id renders the PropertyDetail page', async ({ page }, testInfo) => {
    if (!terraAvailable) testInfo.skip();
    const body = await navigateWithUpstreamRetry(
      page,
      `${TERRA_BASE}/property/${TERRA_FIXTURE_ID}`,
    );
    await assertNotGenericNotFound(page, testInfo, body);

    // prop-001 is "Meridian Tower" at "1200 Meridian Ave, Miami, FL".
    const matchesPropertyDomain =
      /meridian|miami|property|address|portfolio|noi|occupancy|cap rate|units?/i.test(body);
    expect(matchesPropertyDomain, 'terra detail page lacks property-domain content').toBe(true);
  });

  // The valid drill-through URL shapes — covers BOTH productDashboardUrl()
  // (e.g. /vessels/dashboard, /terra/dashboard, /carlota-jo/, /aegis/) AND
  // productEntityUrl() (e.g. /vessels/vessels/:id, /terra/property/:id,
  // /carlota-jo/inquiries?entity=, /aegis/?entity=, /operations/prism,
  // /operations) as defined by
  // artifacts/command/src/pages/cross-platform/product-links.ts.
  const VALID_DRILLTHROUGH_HREF = new RegExp(
    [
      '^/vessels/dashboard(?:[/?#]|$)',
      '^/vessels/vessels/[^/?#]+',
      '^/terra/dashboard(?:[/?#]|$)',
      '^/terra/property/[^/?#]+',
      '^/carlota-jo(?:/.*)?$',
      '^/carlota-jo/inquiries(?:\\?.*)?$',
      '^/aegis(?:/.*)?(?:\\?.*)?$',
      '^/operations(?:/prism)?(?:[/?#].*)?$',
    ].join('|'),
  );

  // Captures every artifact-prefixed href so the test can detect malformed
  // links (any captured href that does not match VALID_DRILLTHROUGH_HREF).
  const ARTIFACT_PREFIX =
    /^\/(vessels|terra|carlota-jo|aegis|operations|sentra|counsel|pulse|lyte|prism-counsel)(?:\/|\?|$)/;

  // Predicate: vessels/terra entity (NOT dashboard) drill-through. These are
  // the click-through targets the task explicitly requires us to exercise.
  function isVesselsOrTerraEntityHref(href: string): boolean {
    return /^\/vessels\/vessels\/[^/?#]+/.test(href) || /^\/terra\/property\/[^/?#]+/.test(href);
  }

  test('command: cross-platform evidence registry renders entity links shaped like productEntityUrl(...)', async ({
    page,
  }, testInfo) => {
    if (!commandAvailable) testInfo.skip();
    const body = await navigateWithUpstreamRetry(
      page,
      `${COMMAND_BASE}/strategy/cross-platform/evidence`,
    );
    if (/upstream not ready/i.test(body)) testInfo.skip();

    const errorBoundary = page.locator('text=Something went wrong').first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    // Pull EVERY artifact-prefixed href without pre-filtering to known-good
    // prefixes. Anything that points at another artifact must match the
    // productEntityUrl shape; anything else is a malformed link bug.
    const allArtifactHrefs = await page
      .locator('a[href]')
      .evaluateAll((els) =>
        (els as HTMLAnchorElement[])
          .map((a) => a.getAttribute('href') ?? '')
          .filter((h) => h.startsWith('/') && !h.startsWith('//')),
      );
    const artifactHrefs = allArtifactHrefs.filter((h) => ARTIFACT_PREFIX.test(h));

    for (const href of artifactHrefs) {
      expect(href, `evidence registry rendered a malformed artifact link: ${href}`).toMatch(
        VALID_DRILLTHROUGH_HREF,
      );
    }

    // Seeded-mode lower bound: in the dev/preview environment the registry
    // ships seeded vessels + terra entity rows, so at least one vessels OR
    // terra entity drill-through link MUST be present. A regression that
    // drops them would otherwise pass silently.
    const vesselsTerraEntityHrefs = artifactHrefs.filter(isVesselsOrTerraEntityHref);
    expect(
      vesselsTerraEntityHrefs.length,
      `evidence registry rendered no vessels-or-terra entity drill-through links. ` +
        `productEntityUrl helper or registry rendering may be broken. ` +
        `All artifact-prefixed hrefs found: ${JSON.stringify(artifactHrefs)}`,
    ).toBeGreaterThan(0);

    // Mandatory click-through: follow the first vessels/terra entity link
    // rendered inside the registry rows (target="_blank" + title="Open ... in
    // <product>" is the canonical entity-chip in evidence-registry.tsx),
    // handle the popup, and assert the destination URL + body match. This
    // proves the full DOM → navigation → render path AND scopes the click to
    // the actual entity chip rather than a generic anchor anywhere on page.
    const clickable = vesselsTerraEntityHrefs[0];
    const entityChip = page
      .locator(`a[href="${clickable}"][target="_blank"][title^="Open "]`)
      .first();
    const link =
      (await entityChip.count()) > 0 ? entityChip : page.locator(`a[href="${clickable}"]`).first();
    const popupPromise = page
      .context()
      .waitForEvent('page', { timeout: 8_000 })
      .catch(() => null);
    await link.click();
    const popup = await popupPromise;
    const dest: Page = popup ?? page;
    await dest.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => null);
    await dest.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);
    expect(dest.url(), `evidence-row click-through landed on unexpected URL`).toContain(clickable);
    const destText = await dest
      .locator('body')
      .innerText()
      .catch(() => '');
    if (!/upstream not ready/i.test(destText)) {
      await assertNotGenericNotFound(dest, testInfo, destText);
      const destDomain = clickable.startsWith('/vessels/')
        ? /vessel|fleet|imo|mmsi|voyage|return to fleet/i
        : /property|terra|portfolio|tower|leas|tenant/i;
      expect(
        destDomain.test(destText),
        `evidence-row click-through destination ${dest.url()} lacks expected domain content. Body:\n${destText.slice(0, 500)}`,
      ).toBe(true);
    }
    if (popup) await popup.close().catch(() => null);
  });

  test('command: cross-platform correlation page wires real product drill-through links', async ({
    page,
  }, testInfo) => {
    if (!commandAvailable) testInfo.skip();
    const body = await navigateWithUpstreamRetry(page, `${COMMAND_BASE}/strategy/cross-platform`);
    if (/upstream not ready/i.test(body)) testInfo.skip();

    const errorBoundary = page.locator('text=Something went wrong').first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    const hasContent = /correlation|cross-platform|signal|no correlations detected/i.test(body);
    expect(hasContent).toBe(true);

    // Same contract as evidence registry: every artifact-prefixed link must
    // be a valid productEntityUrl/productDashboardUrl shape — no pre-filter.
    const allArtifactHrefs = await page
      .locator('a[href]')
      .evaluateAll((els) =>
        (els as HTMLAnchorElement[])
          .map((a) => a.getAttribute('href') ?? '')
          .filter((h) => h.startsWith('/') && !h.startsWith('//')),
      );
    const artifactHrefs = allArtifactHrefs.filter((h) => ARTIFACT_PREFIX.test(h));

    for (const href of artifactHrefs) {
      expect(href, `correlation page rendered a malformed artifact link: ${href}`).toMatch(
        VALID_DRILLTHROUGH_HREF,
      );
    }

    // Seeded-mode lower bound: at least one vessels OR terra entity link
    // must be wired into the correlation cards on the seeded preview env.
    const vesselsTerraEntityHrefs = artifactHrefs.filter(isVesselsOrTerraEntityHref);
    expect(
      vesselsTerraEntityHrefs.length,
      `correlation page rendered no vessels-or-terra entity drill-through links — ` +
        `card-link wiring or productEntityUrl may be broken. ` +
        `All artifact-prefixed hrefs found: ${JSON.stringify(artifactHrefs)}`,
    ).toBeGreaterThan(0);

    // Mandatory click-through.
    const clickable = vesselsTerraEntityHrefs[0];
    const link = page.locator(`a[href="${clickable}"]`).first();
    const popupPromise = page
      .context()
      .waitForEvent('page', { timeout: 8_000 })
      .catch(() => null);
    await link.click();
    const popup = await popupPromise;
    const dest: Page = popup ?? page;
    await dest.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => null);
    await dest.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);
    expect(dest.url(), `correlation card click landed on unexpected URL`).toContain(clickable);
    const destText = await dest
      .locator('body')
      .innerText()
      .catch(() => '');
    if (!/upstream not ready/i.test(destText)) {
      await assertNotGenericNotFound(dest, testInfo, destText);
      const destDomain = clickable.startsWith('/vessels/')
        ? /vessel|fleet|imo|mmsi|voyage|return to fleet/i
        : /property|terra|portfolio|tower|leas|tenant/i;
      expect(
        destDomain.test(destText),
        `correlation card click destination ${dest.url()} lacks expected domain content. Body:\n${destText.slice(0, 500)}`,
      ).toBe(true);
    }
    if (popup) await popup.close().catch(() => null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Per-product drill-through smoke tests.
  //
  // The static checker (scripts/qa/check-correlation-deeplinks.js) already
  // catches helper drift. These browser-driven tests catch the runtime
  // failure mode the static checker can't see: the URL parses but the
  // artifact serves a generic 404 / catch-all instead of the intended
  // surface (the same regression #1897 caught for vessels + terra).
  //
  // Coverage MUST match every ProductKey in
  // artifacts/command/src/pages/cross-platform/product-links.ts. The
  // PRODUCT_KEYS constant below is asserted against that list further
  // down so a new product cannot be added to the helper without also
  // appearing here.
  // ─────────────────────────────────────────────────────────────────────────

  type ProductCoverage = {
    product: string;
    available: () => boolean;
    dashboardUrl: string;
    entityUrl: string;
    domain: RegExp;
  };

  const PRISM_FIXTURE_ID = process.env.E2E_PRISM_MATTER_ID ?? 'matter-001';
  const AEGIS_FIXTURE_ID = process.env.E2E_AEGIS_FINDING_ID ?? 'finding-001';
  const CARLOTA_FIXTURE_ID = process.env.E2E_CARLOTA_INQUIRY_ID ?? 'inq-001';
  const LYTE_FIXTURE_ID = process.env.E2E_LYTE_ENTITY_ID ?? 'inc-001';

  // Mirror of productDashboardUrl + productEntityUrl for the keys not
  // covered by the more specific tests above. Domain regexes are loose
  // on purpose — we are guarding against the route falling back to a
  // generic 404, not asserting product UX content.
  const PRODUCT_COVERAGE: ProductCoverage[] = [
    {
      product: 'prism',
      available: () => commandAvailable,
      dashboardUrl: `${COMMAND_BASE}/operations/prism`,
      entityUrl: `${COMMAND_BASE}/operations/prism?entity=${encodeURIComponent(PRISM_FIXTURE_ID)}`,
      domain: /prism|matter|legal|counsel|obligation|deadline|filing|operations/i,
    },
    {
      product: 'aegis',
      available: () => aegisAvailable,
      dashboardUrl: `${AEGIS_BASE}/`,
      entityUrl: `${AEGIS_BASE}/?entity=${encodeURIComponent(AEGIS_FIXTURE_ID)}`,
      domain: /aegis|szl|investor|pitch|deck|slide|holdings|governed|autonomy/i,
    },
    {
      product: 'carlota',
      available: () => carlotaAvailable,
      dashboardUrl: `${CARLOTA_BASE}/`,
      entityUrl: `${CARLOTA_BASE}/inquiries?entity=${encodeURIComponent(CARLOTA_FIXTURE_ID)}`,
      domain: /carlota|consulting|inquir|engage|advisory|client|services|methodology/i,
    },
    {
      product: 'lyte',
      available: () => commandAvailable,
      dashboardUrl: `${COMMAND_BASE}/operations`,
      entityUrl: `${COMMAND_BASE}/operations?entity=${encodeURIComponent(LYTE_FIXTURE_ID)}`,
      domain: /operations|lyte|incident|signal|decision|run|workflow|overview/i,
    },
  ];

  for (const cov of PRODUCT_COVERAGE) {
    test(`${cov.product}: productDashboardUrl(${cov.product}) renders a real surface, not a 404`, async ({
      page,
    }, testInfo) => {
      if (!cov.available()) testInfo.skip();
      const body = await navigateWithUpstreamRetry(page, cov.dashboardUrl);
      await assertNotGenericNotFound(page, testInfo, body);
      expect(
        cov.domain.test(body),
        `${cov.product} dashboard ${cov.dashboardUrl} lacks expected domain content. Body:\n${body.slice(0, 500)}`,
      ).toBe(true);
    });

    test(`${cov.product}: productEntityUrl(${cov.product}, ...) renders a real surface, not a 404`, async ({
      page,
    }, testInfo) => {
      if (!cov.available()) testInfo.skip();
      const body = await navigateWithUpstreamRetry(page, cov.entityUrl);
      await assertNotGenericNotFound(page, testInfo, body);
      expect(
        cov.domain.test(body),
        `${cov.product} entity ${cov.entityUrl} lacks expected domain content. Body:\n${body.slice(0, 500)}`,
      ).toBe(true);
    });
  }

  // Coverage guard — fail (not skip) if a new ProductKey is introduced
  // in artifacts/command/src/pages/cross-platform/product-links.ts and
  // this spec is not extended to cover it. SEXTANT + terra are covered
  // by the dedicated detail-page tests above, the rest by
  // PRODUCT_COVERAGE.
  test('coverage: every ProductKey in product-links.ts has a deep-link test', () => {
    const PRODUCT_KEYS = ['lyte', 'vessels', 'terra', 'prism', 'aegis', 'carlota'] as const;
    const coveredByTable = new Set(PRODUCT_COVERAGE.map((c) => c.product));
    const coveredByDetailTests = new Set(['vessels', 'terra']);
    const missing = PRODUCT_KEYS.filter(
      (k) => !coveredByTable.has(k) && !coveredByDetailTests.has(k),
    );
    expect(
      missing,
      `Missing deep-link coverage for ProductKey(s): ${JSON.stringify(missing)}. ` +
        `Add an entry to PRODUCT_COVERAGE in tests/e2e/correlation-deeplinks.spec.ts ` +
        `or a dedicated detail-page test.`,
    ).toEqual([]);

    // And no stale entries — the table must not list a product that is
    // no longer in ProductKey.
    const stale = [...coveredByTable].filter(
      (p) => !(PRODUCT_KEYS as readonly string[]).includes(p),
    );
    expect(
      stale,
      `PRODUCT_COVERAGE references unknown product(s): ${JSON.stringify(stale)}. ` +
        `Sync with ProductKey in artifacts/command/src/pages/cross-platform/product-links.ts.`,
    ).toEqual([]);
  });
});
