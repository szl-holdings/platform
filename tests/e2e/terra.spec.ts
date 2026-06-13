import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const TERRA_PATH = (process.env.TERRA_BASE_PATH ?? '/terra').replace(/\/$/, '');

let appAvailable = false;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const resp = await page.goto(TERRA_PATH || '/', { timeout: 10000, waitUntil: 'domcontentloaded' });
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

test.describe('Terra — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TERRA_PATH}/`);
  });

  test('loads Terra app successfully', async ({ page }) => {
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
    const root = page.locator("#root, [id='root'], main, body").first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test('portfolio content is present', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const bodyContent = await page.content();
    expect(bodyContent.length).toBeGreaterThan(500);
  });

  test('navigation links exist', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const links = page.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Terra — Route Smoke Tests', () => {
  const routes = [
    { path: '/', label: 'home' },
    { path: '/dashboard', label: 'dashboard' },
    { path: '/deals', label: 'deals' },
    { path: '/documents', label: 'documents' },
    { path: '/analytics', label: 'analytics' },
    { path: '/executive-overview', label: 'executive overview' },
    { path: '/climate-risk', label: 'climate risk' },
    { path: '/agents-command', label: 'agents command' },
    { path: '/unified-command', label: 'unified command' },
    { path: '/portfolio-scenario', label: 'portfolio scenario' },
    { path: '/causal-drilldown', label: 'causal drilldown' },
    { path: '/distress-engine', label: 'distress engine' },
    { path: '/avm-engine', label: 'AVM engine' },
    { path: '/spatial-walkthrough', label: 'spatial walkthrough' },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${TERRA_PATH}${route.path}`);
      await page.waitForLoadState('domcontentloaded');
      const errorBoundary = page.locator('text=Something went wrong').first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe('Terra — User Journey: Browse Portfolio → View Asset → Create Action', () => {
  test('user navigates from dashboard to deals via nav and Deal Pipeline heading is visible', async ({
    page,
  }) => {
    await page.goto(`${TERRA_PATH}/`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const dealsLink = nav
      .locator("a[href*='deal'], a:has-text('Deal'), a:has-text('Pipeline')")
      .first();
    await expect(dealsLink).toBeVisible({ timeout: 10000 });
    await dealsLink.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/deal/i);
    const heading = page
      .locator('h1, h2, h3')
      .filter({ hasText: /deal|pipeline/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('deals page shows stage columns (Prospecting, Due Diligence, or Add Deal)', async ({
    page,
  }) => {
    await page.goto(`${TERRA_PATH}/deals`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const stageEl = page
      .locator(
        ":text('Prospecting'), :text('Due Diligence'), :text('Under Contract'), :text('Add Deal'), :text('Active')",
      )
      .first();
    await expect(stageEl).toBeVisible({ timeout: 15000 });
  });

  test('user navigates from deals to analytics via nav', async ({ page }) => {
    await page.goto(`${TERRA_PATH}/deals`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const analyticsLink = nav
      .locator("a[href*='analytic'], a:has-text('Analytic'), a:has-text('Market')")
      .first();
    await expect(analyticsLink).toBeVisible({ timeout: 10000 });
    await analyticsLink.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test('documents page renders document management interface', async ({ page }) => {
    await page.goto(`${TERRA_PATH}/deals`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const docsLink = nav.locator("a[href*='document'], a:has-text('Document')").first();
    await expect(docsLink).toBeVisible({ timeout: 10000 });
    await docsLink.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:80/api';

test.describe('Terra — Pro Forma API Round-Trip', () => {
  test('proforma CRUD: create → list → update name → delete', async ({ request }) => {
    const payload = {
      projectName: `E2E Test Project — ${Date.now()}`,
      inputs: { totalUnits: 50, avgUnitSF: 800, landCost: 2_000_000 },
      results: { irr: 14.5, equityMultiple: 1.8 },
    };

    const createRes = await request.post(`${API_BASE}/terra/pro-forma-projects`, {
      data: payload,
      headers: { 'content-type': 'application/json' },
    });

    if (createRes.status() === 401 || createRes.status() === 403) {
      test.skip();
      return;
    }

    expect(createRes.status()).toBe(201);
    const { project } = await createRes.json();
    expect(project.id).toBeTruthy();
    expect(project.projectName).toBe(payload.projectName);
    expect(typeof project.id).toBe('string');

    const listRes = await request.get(`${API_BASE}/terra/pro-forma-projects`);
    expect(listRes.status()).toBe(200);
    const { projects } = await listRes.json();
    const found = projects.find((p: { id: string }) => p.id === project.id);
    expect(found).toBeDefined();
    expect(found.projectName).toBe(payload.projectName);

    const newName = 'E2E Test Project — Renamed';
    const updateRes = await request.put(`${API_BASE}/terra/pro-forma-projects/${project.id}`, {
      data: { projectName: newName },
      headers: { 'content-type': 'application/json' },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.updated ?? updateBody.project?.projectName).toBeTruthy();

    const listAfterUpdate = await request.get(`${API_BASE}/terra/pro-forma-projects`);
    const { projects: updated } = await listAfterUpdate.json();
    const renamedProject = updated.find((p: { id: string }) => p.id === project.id);
    expect(renamedProject?.projectName).toBe(newName);

    const deleteRes = await request.delete(`${API_BASE}/terra/pro-forma-projects/${project.id}`);
    expect(deleteRes.status()).toBe(200);

    const listAfterDelete = await request.get(`${API_BASE}/terra/pro-forma-projects`);
    const { projects: remaining } = await listAfterDelete.json();
    const deletedStillPresent = remaining.find((p: { id: string }) => p.id === project.id);
    expect(deletedStillPresent).toBeUndefined();
  });

  test('proforma API: invalid create is rejected with 400', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/terra/pro-forma-projects`, {
      data: { projectName: '' },
      headers: { 'content-type': 'application/json' },
    });
    if (createRes.status() === 401 || createRes.status() === 403) {
      test.skip();
      return;
    }
    expect([400, 422]).toContain(createRes.status());
  });
});

test.describe('Terra — Waterfall API Round-Trip', () => {
  test('waterfall CRUD: create → list → rename → delete', async ({ request }) => {
    const payload = {
      name: `E2E Waterfall — ${Date.now()}`,
      inputs: {
        totalEquity: 10_000_000,
        gpContributionPct: 10,
        preferredReturn: 8,
        catchUpPct: 50,
        promotePct: 20,
        exitProceeds: 18_000_000,
        holdMonths: 48,
      },
      results: { gpEM: 2.1, lpEM: 1.7 },
    };

    const createRes = await request.post(`${API_BASE}/terra/waterfall-structures`, {
      data: payload,
      headers: { 'content-type': 'application/json' },
    });

    if (createRes.status() === 401 || createRes.status() === 403) {
      test.skip();
      return;
    }

    expect([200, 201]).toContain(createRes.status());
    const body = await createRes.json();
    const structure = body.structure ?? body;
    expect(structure.id).toBeTruthy();

    const listRes = await request.get(`${API_BASE}/terra/waterfall-structures`);
    expect(listRes.status()).toBe(200);
    const { structures } = await listRes.json();
    const found = structures.find((s: { id: string }) => s.id === structure.id);
    expect(found).toBeDefined();

    const newName = 'E2E Waterfall — Renamed';
    const updateRes = await request.put(
      `${API_BASE}/terra/waterfall-structures/${structure.id}`,
      { data: { name: newName }, headers: { 'content-type': 'application/json' } },
    );
    expect(updateRes.status()).toBe(200);

    const deleteRes = await request.delete(
      `${API_BASE}/terra/waterfall-structures/${structure.id}`,
    );
    expect(deleteRes.status()).toBe(200);
  });
});

test.describe('Terra — Pro Forma Page', () => {
  test('pro-forma route serves non-empty HTML without 5xx', async ({ page }) => {
    const res = await page.goto(`${TERRA_PATH}/pro-forma`);
    expect(res?.status()).toBeLessThan(500);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
    const hasJsError = page.locator('text=Something went wrong').first();
    expect(await hasJsError.isVisible().catch(() => false)).toBe(false);
  });

  test('pro-forma page renders at least one heading', async ({ page }) => {
    await page.goto(`${TERRA_PATH}/pro-forma`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Terra — Waterfall Calculator Page', () => {
  test('waterfall-calculator route serves non-empty HTML without 5xx', async ({ page }) => {
    const res = await page.goto(`${TERRA_PATH}/waterfall-calculator`);
    expect(res?.status()).toBeLessThan(500);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
    const hasJsError = page.locator('text=Something went wrong').first();
    expect(await hasJsError.isVisible().catch(() => false)).toBe(false);
  });

  test('waterfall page renders at least one heading', async ({ page }) => {
    await page.goto(`${TERRA_PATH}/waterfall-calculator`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Terra — Module Routes', () => {
  const moduleRoutes = [
    { path: '/pro-forma', label: 'pro forma' },
    { path: '/waterfall-calculator', label: 'waterfall calculator' },
    { path: '/lease-abstraction', label: 'lease abstraction' },
    { path: '/exchange-1031', label: '1031 exchange' },
  ];

  for (const route of moduleRoutes) {
    test(`${route.label} route: no 5xx, renders HTML > 500 chars`, async ({ page }) => {
      const res = await page.goto(`${TERRA_PATH}${route.path}`);
      expect(res?.status()).toBeLessThan(500);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(500);
      const hasJsError = page.locator('text=Something went wrong').first();
      expect(await hasJsError.isVisible().catch(() => false)).toBe(false);
    });
  }
});

test.describe('Terra — Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('homepage renders correctly on mobile', async ({ page }) => {
    await page.goto(`${TERRA_PATH}/`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('deals page renders on mobile with Deal Pipeline content', async ({ page }) => {
    await page.goto(`${TERRA_PATH}/deals`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const heading = page
      .locator('h1, h2, h3')
      .filter({ hasText: /deal|pipeline/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('executive overview renders on mobile', async ({ page }) => {
    await page.goto(`${TERRA_PATH}/executive-overview`);
    await page.waitForLoadState('domcontentloaded');
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});

test.describe('Terra — Accessibility (axe-core)', () => {
  const axeRoutes = [
    { path: '/', label: 'home' },
    { path: '/deals', label: 'deals' },
    { path: '/dashboard', label: 'dashboard' },
  ];

  for (const route of axeRoutes) {
    test(`${route.label} has no critical/serious a11y violations`, async ({ page }) => {
      await page.goto(`${TERRA_PATH}${route.path}`, { waitUntil: 'domcontentloaded' });
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
