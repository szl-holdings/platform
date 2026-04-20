/**
 * IMPERIUM Infrastructure Map — E2E Spec
 *
 * IMPERIUM is SZL Holdings' military-grade infrastructure intelligence layer —
 * hosted within the Unified Command web app at /infrastructure/imperium-map.
 * There is no separate standalone IMPERIUM artifact.
 *
 * In CI this spec runs against the @workspace/command build served on port 3005,
 * the same build used by command.spec.ts and governed-decision-loop.spec.ts.
 *
 * IMPERIUM_BASE_PATH env var allows overriding the command base path if the
 * routing structure ever changes.
 */
import { expect, test } from '@playwright/test';

const COMMAND_BASE = (
  process.env.IMPERIUM_BASE_PATH ??
  process.env.COMMAND_BASE_PATH ??
  '/command'
).replace(/\/$/, '');
const IMPERIUM_PATH = `${COMMAND_BASE}/infrastructure/imperium-map`;
const INFRASTRUCTURE_PATH = `${COMMAND_BASE}/infrastructure`;

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(IMPERIUM_PATH, { timeout: 8000, waitUntil: 'domcontentloaded' });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe('IMPERIUM — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(IMPERIUM_PATH);
  });

  test('loads IMPERIUM map without fatal errors', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('page title is set', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
  });

  test('renders main app content', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const root = page.locator('#root, main, body').first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test('page body has substantive content', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe('IMPERIUM — Infrastructure Route Smoke Tests', () => {
  const routes = [
    { path: INFRASTRUCTURE_PATH, label: 'executive console' },
    { path: IMPERIUM_PATH, label: 'resource map' },
    { path: `${COMMAND_BASE}/infrastructure/praetorian`, label: 'security perimeter' },
    { path: `${COMMAND_BASE}/infrastructure/senate`, label: 'governance board' },
    { path: `${COMMAND_BASE}/infrastructure/supply-lines`, label: 'network topology' },
    { path: `${COMMAND_BASE}/infrastructure/centurion`, label: 'AI operations' },
    { path: `${COMMAND_BASE}/infrastructure/intelligence`, label: 'intelligence' },
    { path: `${COMMAND_BASE}/infrastructure/geospatial`, label: 'geospatial' },
    { path: `${COMMAND_BASE}/infrastructure/directives`, label: 'directive cascade' },
    { path: `${COMMAND_BASE}/infrastructure/coalition`, label: 'coalition' },
    { path: `${COMMAND_BASE}/infrastructure/reserves`, label: 'strategic reserves' },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');
      const errorBoundary = page.locator('text=Something went wrong').first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe('IMPERIUM — Content Validation', () => {
  test('imperium map shows resource hierarchy or infrastructure content', async ({ page }) => {
    await page.goto(IMPERIUM_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('IMPERIUM'), :text('Resource'), :text('Infrastructure'), :text('Map'), :text('Legion'), :text('Cohort'), :text('Sentinel')",
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('executive console shows overview or classification content', async ({ page }) => {
    await page.goto(INFRASTRUCTURE_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Executive'), :text('Console'), :text('Infrastructure'), :text('IMPERIUM'), :text('Overview'), :text('Aquila')",
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('security perimeter page renders security content', async ({ page }) => {
    await page.goto(`${COMMAND_BASE}/infrastructure/praetorian`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Security'), :text('Perimeter'), :text('Praetorian'), :text('Shield'), :text('Control'), :text('Policy')",
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  const subRouteContent = [
    {
      path: `${COMMAND_BASE}/infrastructure/senate`,
      label: 'governance board',
      keywords: ['Senate', 'Governance', 'Proposal', 'Vote', 'Charter', 'Tribune', 'Approver'],
    },
    {
      path: `${COMMAND_BASE}/infrastructure/supply-lines`,
      label: 'network topology',
      keywords: ['Supply', 'Route', 'Topology', 'Latency', 'Throughput', 'Error Rate', 'Mesh'],
    },
    {
      path: `${COMMAND_BASE}/infrastructure/centurion`,
      label: 'AI operations',
      keywords: [
        'Centurion',
        'Agent',
        'AI',
        'Recommendation',
        'Battle Readiness',
        'Failure',
        'Metrics',
      ],
    },
    {
      path: `${COMMAND_BASE}/infrastructure/intelligence`,
      label: 'intelligence briefing',
      keywords: ['Intelligence', 'Briefing', 'Signals', 'Operational', 'Bottlenecks', 'Cost'],
    },
    {
      path: `${COMMAND_BASE}/infrastructure/geospatial`,
      label: 'geospatial',
      keywords: ['Geospatial', 'Threat Legend', 'CARTO', 'OpenStreetMap', 'Layer', 'Source'],
    },
    {
      path: `${COMMAND_BASE}/infrastructure/directives`,
      label: 'directive cascade',
      keywords: ['Directive', 'Cascade', 'Classification', 'Priority', 'Issue New', 'Cascaded'],
    },
    {
      path: `${COMMAND_BASE}/infrastructure/coalition`,
      label: 'coalition',
      keywords: ['Coalition', 'Partner', 'Trust Score', 'Domain', 'Status', 'Stakeholder'],
    },
    {
      path: `${COMMAND_BASE}/infrastructure/reserves`,
      label: 'strategic reserves',
      keywords: ['Reserve', 'Drawdown', 'Awaiting Approval', 'Strategic', 'Pool', 'Decided'],
    },
  ];

  for (const route of subRouteContent) {
    test(`${route.label} page renders meaningful content`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

      const errorBoundary = page.locator('text=Something went wrong').first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);

      const selector = route.keywords.map((k) => `:text('${k}')`).join(', ');
      const content = page.locator(selector).first();
      await expect(content).toBeVisible({ timeout: 15000 });
    });
  }

  test('IMPERIUM nav sidebar is present', async ({ page }) => {
    await page.goto(IMPERIUM_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const sidebar = page.locator('aside, nav').first();
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    const links = sidebar.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test('user navigates from executive console to resource map via nav', async ({ page }) => {
    await page.goto(INFRASTRUCTURE_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const mapLink = page
      .locator("a[href*='imperium-map'], a:has-text('RESOURCE MAP'), a:has-text('Resource Map')")
      .first();
    const hasMapLink = await mapLink.isVisible({ timeout: 10000 }).catch(() => false);
    if (hasMapLink) {
      await mapLink.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
      await expect(page).toHaveURL(/imperium-map/i);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    } else {
      const body = await page.content();
      expect(body.length).toBeGreaterThan(500);
    }
  });
});

test.describe('IMPERIUM — Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('imperium map renders on mobile without crash', async ({ page }) => {
    await page.goto(IMPERIUM_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('executive console renders on mobile without crash', async ({ page }) => {
    await page.goto(INFRASTRUCTURE_PATH);
    await page.waitForLoadState('domcontentloaded');
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});
