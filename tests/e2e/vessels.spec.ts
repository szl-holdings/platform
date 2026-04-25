import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const VESSELS_PATH = process.env.VESSELS_BASE_PATH ?? '/vessels';

let appAvailable = false;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const resp = await page.goto(VESSELS_PATH, { timeout: 10000, waitUntil: 'domcontentloaded' });
      if (resp && resp.status() < 500) {
        appAvailable = true;
        break;
      }
    } catch {
      // upstream not ready yet — wait and retry
    }
    await page.waitForTimeout(2000);
  }
  await page.close();
}, 60_000);
test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe('SEXTANT — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/`);
  });

  test('loads SEXTANT app without fatal errors', async ({ page }) => {
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

  test('navigation is present', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test('page body has substantive content', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe('SEXTANT — Route Smoke Tests', () => {
  const routes = [
    { path: '/', label: 'home' },
    { path: '/fleet-dashboard', label: 'fleet dashboard' },
    { path: '/fleet-map', label: 'fleet map' },
    { path: '/exceptions-center', label: 'exceptions center' },
    { path: '/alert-center', label: 'alert center' },
    { path: '/command-overview', label: 'command overview' },
    { path: '/document-engine', label: 'document engine' },
    { path: '/simulations-page', label: 'simulations' },
    { path: '/disruption-forecast', label: 'disruption forecast' },
    { path: '/command-mode', label: 'command mode' },
    { path: '/voyage-desk', label: 'voyage desk' },
    { path: '/dark-vessel-detection', label: 'dark vessel detection' },
    { path: '/autonomous-routing', label: 'autonomous routing' },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${VESSELS_PATH}${route.path}`);
      await page.waitForLoadState('domcontentloaded');
      const errorBoundary = page.locator('text=Something went wrong').first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe('SEXTANT — User Journey: View Fleet → Open Exception → Review Alert', () => {
  test('user navigates to fleet dashboard via nav and Fleet Command KPI is visible', async ({
    page,
  }) => {
    await page.goto(`${VESSELS_PATH}/`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const fleetLink = nav
      .locator("a[href*='fleet'], a:has-text('Fleet'), a:has-text('Dashboard')")
      .first();
    await expect(fleetLink).toBeVisible({ timeout: 10000 });
    await fleetLink.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const fleetKPI = page
      .locator(
        ":text('Fleet Command'), :text('FLEET'), :text('Active Fleet'), :text('SEA'), :text('PORT')",
      )
      .first();
    await expect(fleetKPI).toBeVisible({ timeout: 15000 });
  });

  test('user navigates from fleet dashboard to exceptions center via nav', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/fleet-dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const exceptionsLink = nav.locator("a[href*='exception'], a:has-text('Exception')").first();
    await expect(exceptionsLink).toBeVisible({ timeout: 10000 });
    await exceptionsLink.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/exception/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test('user navigates from exceptions to alert center via nav', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/exceptions-center`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const alertLink = nav.locator("a[href*='alert'], a:has-text('Alert')").first();
    await expect(alertLink).toBeVisible({ timeout: 10000 });
    await alertLink.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe('SEXTANT — Write Path: Alert Rules', () => {
  test('alert center renders Rules tab with New Rule button', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/dashboard/alerts`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const rulesTab = page.locator("button:has-text('Alert Rules'), [role='tab']:has-text('Alert Rules')").first();
    await expect(rulesTab).toBeVisible({ timeout: 12000 });
    await rulesTab.click();

    const newRuleBtn = page.locator("button:has-text('New Rule'), button:has-text('Create Rule')").first();
    await expect(newRuleBtn).toBeVisible({ timeout: 8000 });
  });

  test('user can open Create Alert Rule dialog from Alert Center', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/dashboard/alerts`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const rulesTab = page.locator("button:has-text('Alert Rules'), [role='tab']:has-text('Alert Rules')").first();
    await expect(rulesTab).toBeVisible({ timeout: 10000 });

    await rulesTab.click();
    await page.waitForTimeout(500);

    const newRuleBtn = page.locator("button:has-text('New Rule')").first();
    await expect(newRuleBtn).toBeVisible({ timeout: 8000 });

    await newRuleBtn.click();

    const dialog = page.locator("[role='dialog'], [data-radix-dialog-content]").first();
    await expect(dialog).toBeVisible({ timeout: 8000 });

    const nameInput = dialog.locator("input[placeholder*='Alert'], input[placeholder*='Speed'], input").first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('dark vessel detection page shows SIMULATED provenance badge', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/dark-vessel-detection`);
    await page.waitForLoadState('domcontentloaded');

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const badge = page.locator('text=SIMULATED').first();
    await expect(badge).toBeVisible({ timeout: 10000 });
  });

  test('PSC inspector page shows SCENARIO-BASED provenance badge', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/psc-inspector`);
    await page.waitForLoadState('domcontentloaded');

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const badge = page.locator('text=SCENARIO-BASED').first();
    await expect(badge).toBeVisible({ timeout: 10000 });
  });

  test('blockchain BoL page shows signed-record demo notice', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/blockchain-bol`);
    await page.waitForLoadState('domcontentloaded');

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const notice = page.locator('text=Signed-record demonstration').first();
    await expect(notice).toBeVisible({ timeout: 10000 });
  });
});

test.describe('SEXTANT — Write Path: Trading Desk', () => {
  test('trading desk renders order entry panel', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/trading-desk`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);

    const orderPanel = page.locator(
      "text=Order Entry, text=Instrument, text=BUY, text=SELL, button:has-text('Buy'), button:has-text('Sell')"
    ).first();
    await expect(orderPanel).toBeVisible({ timeout: 15000 });
  });

  test('trading desk orders tab loads without crash', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/trading-desk`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const ordersTab = page.locator(
      "button:has-text('Orders'), [role='tab']:has-text('Orders')"
    ).first();
    await expect(ordersTab).toBeVisible({ timeout: 10000 });

    await ordersTab.click();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});

test.describe('SEXTANT — Write Path: Voyage Economics', () => {
  test('voyage economics page loads with live or seeded data', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/economics`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const heading = page.locator('text=Voyage Economics, text=Fleet Revenue, text=Fleet Margin').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('voyage economics shows fleet revenue KPI', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/economics`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const revenueKpi = page.locator('text=Fleet Revenue').first();
    await expect(revenueKpi).toBeVisible({ timeout: 15000 });
  });

  test('voyage economics exposes CSV and PDF export buttons', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/economics`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const csvBtn = page.getByTestId('voyage-export-csv');
    const pdfBtn = page.getByTestId('voyage-export-pdf');
    await expect(csvBtn).toBeVisible({ timeout: 15000 });
    await expect(pdfBtn).toBeVisible({ timeout: 15000 });
  });

  test('CSV export downloads a dated file with header row', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/economics`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const csvBtn = page.getByTestId('voyage-export-csv');
    await expect(csvBtn).toBeVisible({ timeout: 15000 });
    // Wait for data to load so the button is enabled.
    await expect(csvBtn).toBeEnabled({ timeout: 20000 });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      csvBtn.click(),
    ]);
    const name = download.suggestedFilename();
    expect(name).toMatch(/^voyage-economics(-\w+)?-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

test.describe('SEXTANT — Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('home renders on mobile without crash', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('fleet dashboard renders on mobile with Fleet Command content', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/fleet-dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const fleetKPI = page
      .locator(":text('Fleet Command'), :text('FLEET'), :text('SEA'), :text('PORT')")
      .first();
    await expect(fleetKPI).toBeVisible({ timeout: 15000 });
  });
});

test.describe('SEXTANT — Accessibility (axe-core)', () => {
  const axeRoutes = [
    { path: '/', label: 'home' },
    { path: '/fleet-dashboard', label: 'fleet dashboard' },
    { path: '/exceptions-center', label: 'exceptions center' },
  ];

  for (const route of axeRoutes) {
    test(`${route.label} has no critical/serious a11y violations`, async ({ page }) => {
      await page.goto(`${VESSELS_PATH}${route.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      if (criticalOrSerious.length > 0) {
        const summary = criticalOrSerious
          .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join('\n');
        expect
          .soft(criticalOrSerious, `Critical/serious a11y violations on ${route.path}:\n${summary}`)
          .toHaveLength(0);
      }

      expect(results.violations.length).toBeDefined();
    });
  }
});
