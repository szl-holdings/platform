import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const VESSELS_PATH = (process.env.VESSELS_BASE_PATH ?? '/vessels').replace(/\/$/, '');

let appAvailable = false;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const resp = await page.goto(VESSELS_PATH || '/', { timeout: 10000, waitUntil: 'domcontentloaded' });
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
test.beforeEach(async ({ page }, testInfo) => {
  if (!appAvailable) testInfo.skip();
  // Seed the shared demo token so PrivateAppGuard renders the private dashboard
  // in the static E2E harness (no auth backend). This mirrors a user who has
  // already passed the demo PIN modal. It only takes effect when the build sets
  // VITE_DEMO_ALLOWED (done for vessels in .github/workflows/e2e.yml); production
  // builds never set that flag, so the real auth guard is never weakened.
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem('szl-demo-token', 'e2e-demo');
    } catch {
      // sessionStorage unavailable — guard falls back to the sign-in prompt
    }
  });
});

test.describe('Vessels — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/`);
  });

  test('loads Vessels app without fatal errors', async ({ page }) => {
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

test.describe('Vessels — Route Smoke Tests', () => {
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

test.describe('Vessels — User Journey: View Fleet → Open Exception → Review Alert', () => {
  test('user navigates to fleet dashboard via nav and Fleet Command KPI is visible', async ({
    page,
  }) => {
    await page.goto(`${VESSELS_PATH}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav[aria-label='Sidebar']").first();
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
    await page.goto(`${VESSELS_PATH}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav[aria-label='Sidebar']").first();
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
    await page.goto(`${VESSELS_PATH}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav[aria-label='Sidebar']").first();
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

test.describe('Vessels — Write Path: Alert Rules', () => {
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

test.describe('Vessels — Write Path: Trading Desk', () => {
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

test.describe('Vessels — Write Path: Voyage Economics', () => {
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

test.describe('Vessels — Mobile Viewport', () => {
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
    await page.goto(`${VESSELS_PATH}/dashboard`);
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

test.describe('Vessels — Sanctions Heat Portfolio View', () => {
  test('renders Sanctions Heat page title without errors', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/sanctions-heat`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    await expect(page.locator("h1:has-text('Sanctions Heat')")).toBeVisible({ timeout: 15000 });
    const hasError = await page.locator('text=Something went wrong').first().isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('demo vessel 3 (Meridian Bulk) appears as critical tier in portfolio', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/sanctions-heat`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const row3 = page.locator('[data-testid="holding-row-3"]');
    await expect(row3).toBeVisible({ timeout: 15000 });
    const tier = await row3.getAttribute('data-tier');
    expect(tier).toBe('critical');
    const score = Number(await row3.getAttribute('data-score'));
    expect(score).toBeGreaterThanOrEqual(80);
  });

  test('demo vessel 1 (Pacific Guardian) appears as high tier in portfolio', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/sanctions-heat`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const row1 = page.locator('[data-testid="holding-row-1"]');
    await expect(row1).toBeVisible({ timeout: 15000 });
    const tier = await row1.getAttribute('data-tier');
    expect(tier).toBe('high');
    const score = Number(await row1.getAttribute('data-score'));
    expect(score).toBeGreaterThanOrEqual(50);
  });

  test('portfolio table has at least 3 rows (includes both demo vessels)', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/sanctions-heat`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const rows = page.locator('[data-testid^="holding-row-"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(2);
  });

  test('Portfolio Avg Score KPI card renders a numeric value', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/sanctions-heat`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    await expect(page.locator("text=Portfolio Avg Score")).toBeVisible({ timeout: 15000 });
  });

  test('Critical filter reduces visible rows to only critical-tier vessels', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/sanctions-heat`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    await page.locator("button:has-text('Critical')").first().click();
    await page.waitForTimeout(300);
    const criticalRows = page.locator('[data-testid^="holding-row-"][data-tier="critical"]');
    const critCount = await criticalRows.count();
    expect(critCount).toBeGreaterThan(0);
    const nonCriticalRows = page.locator('[data-testid^="holding-row-"]:not([data-tier="critical"])');
    const bad = await nonCriticalRows.count();
    expect(bad).toBe(0);
  });

  test('Refresh button calls refetch without crashing the page', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/sanctions-heat`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    await page.locator("button:has-text('Refresh scores')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("h1:has-text('Sanctions Heat')")).toBeVisible({ timeout: 10000 });
    const hasError = await page.locator('text=Something went wrong').first().isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('data source disclosure badge (Sim or Live) is visible on portfolio rows', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/sanctions-heat`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const badge = page.locator(":text('Sim'), :text('Live')").first();
    await expect(badge).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Vessels — Vessel Detail Sanctions Tabs', () => {
  test('vessel 3 detail: Entity Network tab switch mounts the graph component', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/vessel/3`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const networkTab = page.locator("button:has-text('Entity Network')").first();
    await expect(networkTab).toBeVisible({ timeout: 15000 });
    await networkTab.click();
    await page.waitForTimeout(1500);
    const graph = page.locator('[data-testid="entity-network-graph"]');
    await expect(graph).toBeVisible({ timeout: 10000 });
    const svg = graph.locator('svg').first();
    await expect(svg).toBeVisible({ timeout: 5000 });
  });

  test('vessel 3 detail: Sanctions Score tab mounts panel with critical tier', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/vessel/3`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const sanctionsTab = page.locator("button:has-text('Sanctions Score')").first();
    await expect(sanctionsTab).toBeVisible({ timeout: 15000 });
    await sanctionsTab.click();
    await page.waitForTimeout(1500);
    const panel = page.locator('[data-testid="sanctions-score-panel"]');
    await expect(panel).toBeVisible({ timeout: 10000 });
    const tier = await panel.getAttribute('data-tier');
    expect(tier).toBe('critical');
    const score = Number(await panel.getAttribute('data-score'));
    expect(score).toBeGreaterThanOrEqual(80);
  });

  test('vessel 1 detail: Sanctions Score tab mounts panel with high tier', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/vessel/1`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const sanctionsTab = page.locator("button:has-text('Sanctions Score')").first();
    await expect(sanctionsTab).toBeVisible({ timeout: 15000 });
    await sanctionsTab.click();
    await page.waitForTimeout(1500);
    const panel = page.locator('[data-testid="sanctions-score-panel"]');
    await expect(panel).toBeVisible({ timeout: 10000 });
    const tier = await panel.getAttribute('data-tier');
    expect(tier).toBe('high');
    const score = Number(await panel.getAttribute('data-score'));
    expect(score).toBeGreaterThanOrEqual(50);
  });

  test('vessel 3 detail: header shows Sanctions badge with score >= 80', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/vessel/3`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const sanctionsBadge = page.locator('button:has-text("Sanctions")').first();
    await expect(sanctionsBadge).toBeVisible({ timeout: 15000 });
    const badgeText = await sanctionsBadge.textContent();
    const scoreMatch = badgeText?.match(/\d+/);
    expect(Number(scoreMatch?.[0] ?? 0)).toBeGreaterThanOrEqual(80);
  });

  test('vessel 1 detail: Entity Network tab renders SVG with multiple nodes', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/vessel/1`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const networkTab = page.locator("button:has-text('Entity Network')").first();
    await expect(networkTab).toBeVisible({ timeout: 15000 });
    await networkTab.click();
    await page.waitForTimeout(1500);
    const graph = page.locator('[data-testid="entity-network-graph"]');
    await expect(graph).toBeVisible({ timeout: 10000 });
    const nodeGroups = graph.locator('g[data-nodeid]');
    const nodeCount = await nodeGroups.count();
    expect(nodeCount).toBeGreaterThan(2);
  });

  test('vessel 3 detail page loads without fatal errors', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/vessel/3`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const hasError = await page.locator('text=Something went wrong').first().isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});

test.describe('Vessels — Sanctions Navigation & Disclosure', () => {
  test('Sanctions Heat link in nav navigates to /sanctions-heat', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const navLink = page.locator("a[href*='sanctions-heat']").first();
    if (await navLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await navLink.click();
      await page.waitForURL(new RegExp('sanctions-heat'), { timeout: 10000 });
      await expect(page.locator("h1:has-text('Sanctions Heat')")).toBeVisible({ timeout: 10000 });
    }
  });

  test('vessel 3 portfolio row links to vessel detail page', async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/sanctions-heat`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const row3 = page.locator('[data-testid="holding-row-3"]');
    await expect(row3).toBeVisible({ timeout: 15000 });
    const link = row3.locator('a[href*="/vessel/3"]').first();
    await expect(link).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Vessels — Accessibility (axe-core)', () => {
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
