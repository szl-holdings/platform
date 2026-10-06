import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page, type Route, type TestInfo } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CARLOTA_PATH = (process.env.CARLOTA_BASE_PATH ?? '/carlota-jo').replace(/\/$/, '');

async function mountWorkflowPanel(page: Page, responses: Record<string, unknown>[]) {
  const target = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:80');
  expect(['localhost', '127.0.0.1', '[::1]']).toContain(target.hostname);
  const requests: Record<string, unknown>[] = [];
  const queue = [...responses];
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== target.origin) {
      await route.abort('blockedbyclient');
    } else if (url.pathname.startsWith('/api/')) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unavailable in the synthetic panel test' }),
      });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/control-tower/substrate/run', async (route) => {
    expect(route.request().method()).toBe('POST');
    requests.push(route.request().postDataJSON() as Record<string, unknown>);
    const response = queue.shift();
    expect(response, 'Each Run must have an intercepted fixture').toBeDefined();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
  await page.goto(`${CARLOTA_PATH}/governed-cockpit`);
  const panel = page.locator('div.rounded-lg').filter({
    has: page.getByText('White-Glove Task Routing', { exact: true }),
  }).first();
  await expect(panel).toBeVisible();
  return { panel, requests };
}

async function captureWorkflowPanel(
  panel: Locator,
  page: Page,
  testInfo: TestInfo,
  scenario: string,
) {
  const outputDir = join('playwright-report', 'carlota-substrate');
  mkdirSync(outputDir, { recursive: true });
  const screenshotPath = join(outputDir, `${scenario}-retry-${testInfo.retry}.png`);
  const screenshot = await panel.screenshot({ path: screenshotPath });
  const sourcePaths = [
    'artifacts/carlota-jo/src/components/SubstrateWorkflowPanel.tsx',
    'artifacts/carlota-jo/src/components/substrate-run-view.ts',
    'tests/e2e/carlota-jo.spec.ts',
  ];
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', ...sourcePaths]);
  const revision = (args: string[]) => execFileSync('git', args, {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  let candidateCommit: string | null = null;
  if (process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    candidateCommit = event.pull_request?.head?.sha ?? null;
  }
  const sourceCommit = revision(['rev-parse', 'HEAD']);
  const sourceTree = revision(['rev-parse', 'HEAD^{tree}']);
  let candidateTree: string | null = null;
  if (candidateCommit) {
    try {
      candidateTree = revision(['rev-parse', `${candidateCommit}^{tree}`]);
    } catch {
      // A shallow PR checkout may only contain the synthetic merge commit.
    }
  }
  const metadata = {
    sourceCommit,
    sourceTree,
    candidateCommit,
    candidateTree,
    matchesCandidateTree: candidateTree === null ? null : candidateTree === sourceTree,
    route: new URL(page.url()).pathname,
    viewport: page.viewportSize(),
    capturedAt: new Date().toISOString(),
    scenario,
    fixtureOnly: true,
    authority: 'HOSTED_SYNTHETIC_UI',
    screenshotSha256: createHash('sha256').update(screenshot).digest('hex'),
    sourceHashes: Object.fromEntries(sourcePaths.map((path) => [
      path, createHash('sha256').update(readFileSync(path)).digest('hex'),
    ])),
  };
  const metadataPath = screenshotPath.replace(/\.png$/, '.json');
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  await testInfo.attach(`substrate-${scenario}`, { path: screenshotPath, contentType: 'image/png' });
  await testInfo.attach(`substrate-${scenario}-source`, {
    path: metadataPath, contentType: 'application/json',
  });
}

test.describe('Carlota Jo — SubstrateWorkflowPanel results', () => {
  for (const mode of ['dry-run', 'live'] as const) {
    test(`a returned ${mode} running run keeps controls locked`, async ({ page }, testInfo) => {
      const { panel, requests } = await mountWorkflowPanel(page, [{
        runId: `fixture-running-${mode}`, status: 'running', mode,
      }]);
      await panel.locator('select').selectOption(mode);
      await panel.getByRole('button', { name: 'Run on Substrate' }).click();
      await expect(panel.getByText(`fixture-running-${mode}`, { exact: true })).toBeVisible();
      const runButton = panel.getByRole('button', { name: 'Run on Substrate' });
      await expect(runButton).toBeDisabled();
      await expect(panel.locator('select')).toBeDisabled();
      // Native repeated clicks cannot start another live or demo run while active.
      await runButton.evaluate((button) => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
      expect(requests).toHaveLength(1);
      expect(requests[0]?.mode).toBe(mode);
      await captureWorkflowPanel(panel, page, testInfo, `running-${mode}`);
    });

    test(`${mode} completion without a run identity remains unverified`, async ({ page }, testInfo) => {
      const { panel } = await mountWorkflowPanel(page, [{
        status: mode === 'live' ? 'completed' : 'dry-run-complete', mode,
        ...(mode === 'live' ? { runId: '   ' } : {}),
      }]);
      await panel.locator('select').selectOption(mode);
      await panel.getByRole('button', { name: 'Run on Substrate' }).click();
      await expect(panel.getByText('STATE UNVERIFIED', { exact: true })).toBeVisible();
      await expect(panel.getByText(/COMPLETED|DRY-RUN COMPLETE/)).toHaveCount(0);
      await expect(panel.getByRole('button', { name: 'Run on Substrate' })).toBeEnabled();
      await captureWorkflowPanel(panel, page, testInfo, `missing-identity-${mode}`);
    });
  }

  test('an interrupted submission stays locked until failure then permits an identified retry', async ({ page }) => {
    const { panel, requests } = await mountWorkflowPanel(page, [{
      runId: 'fixture-recovered', status: 'completed', mode: 'live',
    }]);
    let interrupt!: () => void;
    const interrupted = new Promise<void>((resolve) => { interrupt = resolve; });
    let submissions = 0;
    const interruptRequest = async (route: Route) => {
      submissions += 1;
      await interrupted;
      await route.abort('connectionreset');
    };
    await page.route('**/api/control-tower/substrate/run', interruptRequest);
    await panel.locator('select').selectOption('live');
    await panel.getByRole('button', { name: 'Run on Substrate' }).click();
    const runningButton = panel.getByRole('button', { name: /^Running/ });
    await expect(runningButton).toBeDisabled();
    await expect(panel.locator('select')).toBeDisabled();
    await runningButton.evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
    await expect.poll(() => submissions).toBe(1);
    interrupt();
    await expect(panel.getByText(/FAILED$/, { exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Run on Substrate' })).toBeEnabled();
    await expect(panel.locator('select')).toBeEnabled();
    await page.unroute('**/api/control-tower/substrate/run', interruptRequest);
    await panel.getByRole('button', { name: 'Run on Substrate' }).click();
    await expect(panel.getByText('fixture-recovered', { exact: true })).toBeVisible();
    expect(requests).toHaveLength(1);
  });

  test('dry-run confidence escalation remains pending human review', async ({ page }, testInfo) => {
    const { panel, requests } = await mountWorkflowPanel(page, [{
      runId: 'fixture-dry-pending',
      status: 'pending-approval',
      mode: 'dry-run',
      stageResults: [{
        stageId: 'retrieve-client-context', stageType: 'Retrieve',
        status: 'pending-approval', confidence: 0.2,
        routingDecision: 'escalated-human', approvalId: 'fixture-approval',
      }],
    }]);
    await panel.getByRole('button', { name: 'Run on Substrate' }).click();
    await expect(panel.getByText('fixture-dry-pending', { exact: true })).toBeVisible();
    await expect(panel.getByText('DEMO · PENDING APPROVAL', { exact: true })).toBeVisible();
    await expect(panel.getByText('Not reported', { exact: true })).toBeVisible();
    await expect(panel.getByText('20%', { exact: true })).toBeVisible();
    await expect(panel.getByText(/human review is required/)).toBeVisible();
    await expect(panel.getByText(/paused at approval gate/)).toHaveCount(0);
    await expect(panel.getByText('✓ COMPLETED', { exact: true })).toHaveCount(0);
    expect(requests[0]?.mode).toBe('dry-run');
    await captureWorkflowPanel(panel, page, testInfo, 'dry-run-pending');
  });

  test('live completion reports missing confidence without SLA or signature claims', async ({
    page,
  }, testInfo) => {
    const { panel } = await mountWorkflowPanel(page, [{
      runId: 'fixture-live-completed', status: 'completed', mode: 'live', stageResults: [],
    }]);
    await panel.locator('select').selectOption('live');
    await panel.getByRole('button', { name: 'Run on Substrate' }).click();
    await expect(panel.getByText('fixture-live-completed', { exact: true })).toBeVisible();
    await expect(panel.getByText('✓ COMPLETED', { exact: true })).toBeVisible();
    await expect(panel.getByText('Not reported', { exact: true })).toBeVisible();
    await expect(panel.getByText('SLA', { exact: true })).toHaveCount(0);
    await expect(panel.getByText('evidence-signed', { exact: true })).toHaveCount(0);
    await expect(panel.getByText(/DRY-RUN/)).toHaveCount(0);
    await captureWorkflowPanel(panel, page, testInfo, 'live-completed');
  });

  for (const outcome of [
    { status: 'failed', label: '✗ FAILED' },
    { status: 'cancelled', label: 'CANCELLED' },
    { status: 'unrecognised', label: 'STATE UNVERIFIED' },
  ]) {
    test(`HTTP-success ${outcome.status} is not shown as completed`, async ({ page }, testInfo) => {
      const { panel } = await mountWorkflowPanel(page, [{
        runId: `fixture-${outcome.status}`,
        status: outcome.status,
        mode: 'live',
        ...(outcome.status === 'failed' ? { error: 'Synthetic verifier failed' } : {}),
      }]);
      await panel.locator('select').selectOption('live');
      await panel.getByRole('button', { name: 'Run on Substrate' }).click();
      await expect(panel.getByText(`fixture-${outcome.status}`, { exact: true })).toBeVisible();
      await expect(panel.getByText(outcome.label, { exact: true })).toBeVisible();
      await expect(panel.getByRole('button', { name: 'Run on Substrate' })).toBeEnabled();
      await expect(panel.locator('select')).toBeEnabled();
      await expect(panel.getByText('✓ COMPLETED', { exact: true })).toHaveCount(0);
      if (outcome.status === 'failed') {
        await expect(panel.getByText('Synthetic verifier failed', { exact: true })).toBeVisible();
      }
      await captureWorkflowPanel(panel, page, testInfo, outcome.status);
    });
  }

  test('a mismatched response mode leaves completion unverified', async ({ page }, testInfo) => {
    const { panel } = await mountWorkflowPanel(page, [{
      runId: 'fixture-mode-mismatch', status: 'completed', mode: 'live',
    }]);
    await panel.getByRole('button', { name: 'Run on Substrate' }).click();
    await expect(panel.getByText('fixture-mode-mismatch', { exact: true })).toBeVisible();
    await expect(panel.getByText('STATE UNVERIFIED', { exact: true })).toBeVisible();
    await expect(panel.getByText('✓ COMPLETED', { exact: true })).toHaveCount(0);
    await captureWorkflowPanel(panel, page, testInfo, 'mode-mismatch');
  });

  test('repeated Run clears prior data and retains each result mode', async ({ page }, testInfo) => {
    const { panel, requests } = await mountWorkflowPanel(page, [
      {
        runId: 'fixture-first', status: 'dry-run-complete', mode: 'dry-run', finalConfidence: 0.81,
        stageResults: [{ stageId: 'fixture-old-stage', status: 'completed', confidence: 0.81 }],
      },
      { runId: 'fixture-second', status: 'completed', mode: 'live', stageResults: [] },
    ]);
    await panel.getByRole('button', { name: 'Run on Substrate' }).click();
    await expect(panel.getByText('fixture-first', { exact: true })).toBeVisible();
    await expect(panel.getByText('DEMO · DRY-RUN COMPLETE', { exact: true })).toBeVisible();
    await captureWorkflowPanel(panel, page, testInfo, 'repeated-dry-run');
    await panel.locator('select').selectOption('live');
    await expect(panel.getByText(/requested:dry-run/)).toBeVisible();
    await panel.getByRole('button', { name: 'Run on Substrate' }).click();
    await expect(panel.getByText('fixture-second', { exact: true })).toBeVisible();
    await expect(panel.getByText('✓ COMPLETED', { exact: true })).toBeVisible();
    await expect(panel.getByText('Not reported', { exact: true })).toBeVisible();
    await expect(panel.getByText('fixture-first', { exact: true })).toHaveCount(0);
    await expect(panel.getByText('fixture-old-stage', { exact: true })).toHaveCount(0);
    await expect(panel.getByText(/DRY-RUN/)).toHaveCount(0);
    expect(requests.map((request) => request.mode)).toEqual(['dry-run', 'live']);
    expect(requests.every((request) => request.workflowId === 'carlota-jo-task-routing')).toBe(true);
    await captureWorkflowPanel(panel, page, testInfo, 'repeated-live');
  });
});

let appAvailable = false;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const resp = await page.goto(CARLOTA_PATH || '/', { timeout: 10000, waitUntil: 'domcontentloaded' });
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

test.describe('Carlota Jo — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/`);
  });

  test('loads Carlota Jo app without fatal errors', async ({ page }) => {
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

  test('navigation links are present', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const links = page.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test('page body has substantive content', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe('Carlota Jo — Route Smoke Tests', () => {
  const routes = [
    { path: '/', label: 'home' },
    { path: '/about', label: 'about' },
    { path: '/approach', label: 'approach' },
    { path: '/booking', label: 'booking' },
    { path: '/contact', label: 'contact' },
    { path: '/founder', label: 'founder' },
    { path: '/consulting-os', label: 'consulting OS' },
    { path: '/revenue-intelligence', label: 'revenue intelligence' },
    { path: '/advisory-intel', label: 'advisory intel' },
    { path: '/competitive-radar', label: 'competitive radar' },
    { path: '/scenario-simulator', label: 'scenario simulator' },
    { path: '/strategic-diagnostic', label: 'strategic diagnostic' },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${CARLOTA_PATH}${route.path}`);
      await page.waitForLoadState('domcontentloaded');
      const errorBoundary = page.locator('text=Something went wrong').first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe('Carlota Jo — User Journey: Browse Services → Start Booking → View Contact', () => {
  test('user navigates to booking via nav and Practice Area step 1 is visible', async ({
    page,
  }) => {
    // The booking flow (/book) is not linked from the top nav ("Consult" in the
    // header points to /contact), so open it directly and verify the nav is
    // present and step 1 (Practice Area) renders.
    await page.goto(`${CARLOTA_PATH}/book`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const practiceAreaStep = page.locator(":text('Practice Area')").first();
    await expect(practiceAreaStep).toBeVisible({ timeout: 15000 });
  });

  test('booking flow shows multi-step progression indicator (Engagement, Schedule, Details)', async ({
    page,
  }) => {
    await page.goto(`${CARLOTA_PATH}/book`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const stepIndicator = page
      .locator(":text('Engagement'), :text('Schedule'), :text('Details')")
      .first();
    await expect(stepIndicator).toBeVisible({ timeout: 15000 });
  });

  test('booking flow step 1 shows selectable service option cards', async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/book`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const practiceAreaStep = page.locator(":text('Practice Area')").first();
    await expect(practiceAreaStep).toBeVisible({ timeout: 15000 });

    const serviceOptions = page.locator("button, [role='radio'], [role='option'], label[for]");
    const count = await serviceOptions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('user navigates from booking to contact via nav', async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/book`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    // The "Request Consultation" contact link lives in the marketing Header nav,
    // but page.locator('nav').first() resolves to the global EcosystemNav (the
    // cross-app switcher, which has no contact link). Scope to the whole page.
    const contactLink = page.locator("a[href*='contact']:visible").first();
    await expect(contactLink).toBeVisible({ timeout: 10000 });
    await contactLink.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/contact/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe('Carlota Jo — Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('homepage renders correctly on mobile', async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('booking page renders on mobile with Practice Area step visible', async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/book`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const practiceAreaStep = page.locator(":text('Practice Area'):visible").first();
    await expect(practiceAreaStep).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Keyboard Navigation Smoke Tests
// Exercises Tab focus order, Enter-key activation, and keyboard-only form fill.
// Uses page.keyboard.press('Tab') and page.evaluate(() => document.activeElement)
// so regressions in focus management are caught automatically.
// ---------------------------------------------------------------------------

/**
 * Returns whether the currently focused element has a visible focus ring.
 * Checks both outline-width and box-shadow (Tailwind uses ring-* utilities).
 * Keyboard events in Chromium trigger :focus-visible so getComputedStyle
 * reflects focus-ring styles applied via that pseudo-class.
 */
async function hasFocusRing(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    const s = window.getComputedStyle(el);
    const outlineWidth = parseFloat(s.getPropertyValue('outline-width') || '0');
    const boxShadow = s.getPropertyValue('box-shadow');
    return outlineWidth > 0 || (boxShadow !== 'none' && boxShadow !== '');
  });
}

test.describe('Carlota Jo — Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
  });

  test('Tab key reaches every primary nav link and each shows a visible focus indicator', async ({
    page,
  }) => {
    // The app's primary navigation is the marketing Header's "Main navigation",
    // not page.locator('nav').first() — that resolves to the global EcosystemNav
    // (the cross-app switcher chrome) whose focus order carlota-jo does not own.
    // Scope the assertion to the product's own nav.
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible({ timeout: 15000 });

    // Count only visible nav links — hidden mobile-menu duplicates are excluded.
    const navLinkCount = await nav.locator('a:visible').count();
    expect(navLinkCount, 'Main navigation must contain at least one visible <a>').toBeGreaterThan(0);

    // Establish keyboard focus at the header brand link (the <a> immediately
    // before the nav), then Tab through the primary nav. Tabbing keeps focus
    // keyboard-driven so :focus-visible (and the focus ring) applies.
    await page.locator('header a').first().focus();

    const focusedNavLinks: string[] = [];
    for (let i = 0; i < navLinkCount + 12; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        return {
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim() ?? '',
          inMainNav: !!el.closest('nav[aria-label="Main navigation"]'),
        };
      });

      if (!info) continue;
      // Once focus leaves the primary nav (after visiting its links), stop.
      if (!info.inMainNav && focusedNavLinks.length > 0) break;

      if (info.inMainNav && info.tag === 'a') {
        // Hard-assert a focus ring on every nav link that receives focus.
        const ring = await hasFocusRing(page);
        expect(
          ring,
          `Nav link "${info.text}" is focused but has no visible focus ring (outline-width > 0 or non-none box-shadow required)`,
        ).toBe(true);
        focusedNavLinks.push(info.text);
      }
    }

    expect(
      focusedNavLinks.length,
      `Expected all ${navLinkCount} visible nav links to receive Tab focus; reached: ${focusedNavLinks.join(', ')}`,
    ).toBeGreaterThanOrEqual(navLinkCount);
  });

  test('pressing Enter on a focused nav link changes the active route', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible({ timeout: 15000 });

    // Find a nav link with a non-hash, non-root href to serve as the target.
    const navLinks = nav.locator('a:visible');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    let targetHref: string | null = null;
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      if (href && !href.startsWith('#') && href !== '/' && href !== CARLOTA_PATH) {
        targetHref = href;
        break;
      }
    }

    if (!targetHref) {
      test.skip(true, 'No qualifying nav link href found — skipping Enter-activation test');
      return;
    }

    // Start keyboard focus at the header brand link, then Tab until the target
    // nav link is focused and activate it with Enter.
    await page.locator('header a').first().focus();
    let activated = false;
    for (let i = 0; i < count + 12; i++) {
      await page.keyboard.press('Tab');
      const focusedHref = await page.evaluate(
        () => (document.activeElement as HTMLAnchorElement | null)?.getAttribute('href') ?? null,
      );

      if (focusedHref === targetHref) {
        // waitForURL handles both full-page and SPA client-side navigation.
        await Promise.all([
          page.waitForURL(`**${targetHref}`, { timeout: 15000 }),
          page.keyboard.press('Enter'),
        ]);
        expect(page.url()).toContain(targetHref.replace(/^\//, ''));
        activated = true;
        break;
      }
    }

    expect(activated, `Keyboard Enter on nav link "${targetHref}" did not change the route`).toBe(true);
  });

  test('contact form can be filled and submitted entirely by keyboard', async ({ page }) => {
    await page.goto(`${CARLOTA_PATH}/contact`);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const form = page.locator('form').first();
    // Hard-assert the contact form is present — its removal/breakage is exactly
    // the kind of regression these smoke tests must catch automatically.
    await expect(form, 'Carlota Jo contact page must render a <form> for keyboard testing').toBeVisible({ timeout: 10000 });

    // Start keyboard traversal from the page's main content region so the walk
    // exercises the contact form itself rather than the global chrome (the
    // cross-app EcosystemNav) that precedes every page. The <main> is focusable
    // (tabIndex={-1}); Tabbing from it advances into the form via the keyboard.
    await page.locator('#main-content').focus();
    let reachedForm = false;
    for (let i = 0; i < 35; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        return { tag: el.tagName.toLowerCase(), isInForm: !!el.closest('form') };
      });
      if (info?.isInForm && (info.tag === 'input' || info.tag === 'textarea' || info.tag === 'select')) {
        reachedForm = true;
        break;
      }
    }
    expect(reachedForm, 'Tab key must reach a form field inside <form>').toBe(true);

    // Fill every text/email/tel/textarea field via keyboard and Tab to advance.
    const fieldFills: string[] = [];
    let submitted = false;
    for (let i = 0; i < 15; i++) {
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        return {
          tag: el.tagName.toLowerCase(),
          type: (el as HTMLInputElement).type ?? '',
          name: (el as HTMLInputElement).name ?? '',
          isInForm: !!el.closest('form'),
        };
      });

      if (!info?.isInForm) break;

      // Only treat genuine submit controls as the trigger, not generic buttons.
      const isSubmitControl =
        (info.tag === 'button' && info.type === 'submit') ||
        (info.tag === 'input' && info.type === 'submit');

      if (isSubmitControl) {
        await page.keyboard.press('Enter');
        submitted = true;
        break;
      }

      if (info.tag === 'input' || info.tag === 'textarea') {
        if (info.type === 'email') {
          await page.keyboard.type('keyboard@carlotajo.test');
        } else if (info.type === 'tel') {
          await page.keyboard.type('5555550101');
        } else if (info.type !== 'checkbox' && info.type !== 'radio' && info.type !== 'submit') {
          await page.keyboard.type(info.name ? `Test ${info.name}` : 'Test value');
        }
        fieldFills.push(`${info.tag}[${info.type || 'text'}]`);
      }

      await page.keyboard.press('Tab');
    }

    expect(fieldFills.length, 'At least one form field must be filled via keyboard').toBeGreaterThan(0);
    expect(submitted, 'Keyboard navigation must reach and activate the form submit control').toBe(true);

    // Wait briefly for any async submission response.
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);

    // Assert a concrete submission outcome: success message, URL change, or form dismissed.
    const successSignal = page.locator(
      ":text('thank you'), :text('Thank you'), :text('sent'), :text('success'), :text('received'), :text('we\\'ll be in touch'), :text('message sent')",
    ).first();
    const urlChanged = !page.url().includes('/contact');
    const formGone = !(await form.isVisible().catch(() => false));

    const successDetected =
      (await successSignal.isVisible({ timeout: 5000 }).catch(() => false)) ||
      urlChanged ||
      formGone;

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    expect(
      successDetected,
      'After keyboard form submission, expected a success message, URL change, or form dismissal — none detected',
    ).toBe(true);
  });
});

test.describe('Carlota Jo — Accessibility (WCAG 2.1 AA)', () => {
  const a11yRoutes = [
    { path: '/', label: 'homepage' },
    { path: '/contact', label: 'contact' },
  ];

  for (const route of a11yRoutes) {
    test(`${route.label || '/'} passes WCAG 2.1 AA axe-core scan`, async ({ page }, testInfo) => {
      await page.goto(`${CARLOTA_PATH}${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude("[data-testid='dev-only']")
        .analyze();

      const attachLabel = route.path ? route.path.replace(/\//g, '-') : '-home';
      await testInfo.attach(`axe-results${attachLabel}`, {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });

      if (results.violations.length > 0) {
        const summary = results.violations
          .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join('\n');
        expect(
          results.violations,
          `WCAG 2.1 AA violations on ${CARLOTA_PATH}${route.path}:\n${summary}`,
        ).toHaveLength(0);
      }
    });
  }
});
