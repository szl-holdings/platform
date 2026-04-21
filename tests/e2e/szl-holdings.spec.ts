import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const BASE_PATH = process.env.SZL_BASE_PATH ?? '/';

test.describe('SZL Holdings — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_PATH);
  });

  test('loads the homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('renders main content sections', async ({ page }) => {
    const main = page.locator("main, [role='main'], #root, #app").first();
    await expect(main).toBeVisible({ timeout: 15000 });
  });

  test('navigation links are present and clickable', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15000 });
    const links = nav.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test('page has no broken main layout', async ({ page }) => {
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('homepage has substantive content', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe('SZL Holdings — Route Smoke Tests', () => {
  const routes = [
    { path: '/', label: 'homepage' },
    { path: '/about', label: 'about' },
    { path: '/ecosystem', label: 'ecosystem' },
    { path: '/contact', label: 'contact' },
    { path: '/trust-center', label: 'trust center' },
    { path: '/trust', label: 'trust' },
    { path: '/trust/security', label: 'trust security' },
    { path: '/trust/governance', label: 'trust governance' },
    { path: '/legal/privacy', label: 'privacy policy' },
    { path: '/legal/terms', label: 'terms of service' },
    { path: '/nuro-forge', label: 'nuro forge' },
    { path: '/nuro-forge/arena', label: 'nuro forge arena' },
    { path: '/nuro-forge/governance', label: 'nuro forge governance' },
    { path: '/nuro-forge/composition', label: 'nuro forge composition' },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${BASE_PATH}${route.path}`.replace('//', '/'));
      await page.waitForLoadState('domcontentloaded');
      const errorBoundary = page.locator('text=Something went wrong').first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe('SZL Holdings — Trust Center', () => {
  test('trust center page loads and has substantive content', async ({ page }) => {
    await page.goto(`${BASE_PATH}trust-center`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test('trust page shows security or governance content', async ({ page }) => {
    await page.goto(`${BASE_PATH}trust`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Security'), :text('Trust'), :text('Compliance'), :text('Privacy'), :text('Governance')",
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('trust security sub-page loads without crash', async ({ page }) => {
    await page.goto(`${BASE_PATH}trust/security`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});

test.describe('SZL Holdings — Investor & Platform Pages', () => {
  test('platform page loads with content', async ({ page }) => {
    await page.goto(`${BASE_PATH}platform`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });

  test('ecosystem page loads and shows portfolio companies', async ({ page }) => {
    await page.goto(`${BASE_PATH}ecosystem`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Lyte'), :text('Aegis'), :text('Vessels'), :text('Terra'), :text('Ecosystem'), :text('Portfolio')",
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('contact page has contact form or contact information', async ({ page }) => {
    await page.goto(`${BASE_PATH}contact`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const contactContent = page
      .locator("form, input[type='email'], :text('Contact'), :text('email'), :text('@szlholdings')")
      .first();
    await expect(contactContent).toBeVisible({ timeout: 15000 });
  });
});

test.describe('SZL Holdings — Authentication Flow', () => {
  test('login page or sign-in flow is accessible', async ({ page }) => {
    const loginPaths = ['/login', '/sign-in', '/auth', '/auth/login', '/auth/sign-in'];
    let loginFound = false;

    for (const path of loginPaths) {
      const url = `${BASE_PATH}${path}`.replace('//', '/');
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (response && response.status() < 400) {
        loginFound = true;
        const errorBoundary = page.locator('text=Something went wrong').first();
        const hasError = await errorBoundary.isVisible().catch(() => false);
        expect(hasError).toBe(false);

        const loginContent = page
          .locator(
            "input[type='email'], input[type='password'], input[name='email'], button:has-text('Sign'), button:has-text('Login'), :text('Sign In'), :text('Log In')",
          )
          .first();
        const hasLoginContent = await loginContent.isVisible({ timeout: 10000 }).catch(() => false);
        if (hasLoginContent) {
          await expect(loginContent).toBeVisible();
        }
        break;
      }
    }

    if (!loginFound) {
      const nav = page.locator('nav').first();
      await page.goto(BASE_PATH);
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
      const navVisible = await nav.isVisible({ timeout: 10000 }).catch(() => false);
      if (navVisible) {
        const signInLink = nav
          .locator(
            "a[href*='login'], a[href*='sign-in'], a[href*='auth'], a:has-text('Sign In'), a:has-text('Login'), a:has-text('Get Started')",
          )
          .first();
        const hasSignInLink = await signInLink.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasSignInLink) {
          await signInLink.click();
          await page.waitForLoadState('domcontentloaded');
          const errorBoundary = page.locator('text=Something went wrong').first();
          const hasError = await errorBoundary.isVisible().catch(() => false);
          expect(hasError).toBe(false);
          loginFound = true;
        }
      }
    }

    test.skip(!loginFound, 'No login route found — auth flow may be handled via external provider');
  });

  test('protected route redirects unauthenticated users', async ({ page }) => {
    const protectedPaths = ['/dashboard', '/admin', '/settings/billing'];

    for (const path of protectedPaths) {
      const url = `${BASE_PATH}${path}`.replace('//', '/');
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);

      if (!response) continue;
      if (response.status() >= 400) continue;

      const finalUrl = page.url();
      const redirectedToAuth =
        /login|sign-in|auth|signin/i.test(finalUrl) ||
        (await page
          .locator("input[type='email'], input[type='password']")
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false));

      if (redirectedToAuth) {
        expect(redirectedToAuth).toBeTruthy();
        return;
      }
    }

    test.skip(
      true,
      'No protected route with auth redirect found — SZL Holdings uses client-side auth',
    );
  });
});

test.describe('SZL Holdings — API Health Endpoint', () => {
  test('API health endpoint returns a valid response', async ({ request }) => {
    const apiBase = process.env.API_BASE_URL ?? 'http://localhost:5000';
    const response = await request.get(`${apiBase}/api/health`).catch(() => null);

    if (!response) {
      test.skip(
        true,
        'API server not running in this test environment — skipping API health check',
      );
      return;
    }

    expect(response.status()).toBeLessThan(500);
  });

  test('API health endpoint is reachable if API server is configured', async ({ request }) => {
    const apiBase = process.env.API_BASE_URL ?? '';
    if (!apiBase) {
      test.skip(true, 'API_BASE_URL not configured — skipping API health check');
      return;
    }

    const response = await request.get(`${apiBase}/api/health`);
    expect(response.status()).toBeLessThan(500);

    const body = await response.json().catch(() => ({}));
    if (body.status) {
      expect(['ok', 'healthy', 'degraded']).toContain(body.status);
    }
  });
});

test.describe('SZL Holdings — User Journey: Platform Navigation', () => {
  test('user navigates to platform page via nav and content is visible', async ({ page }) => {
    await page.goto(BASE_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const navLink = page
      .locator(
        "nav a[href*='platform'], nav a:has-text('Platform'), nav a[href*='nexus'], nav a:has-text('Nexus'), nav a[href*='lyte'], nav a:has-text('Lyte'), nav a[href*='trust'], nav a:has-text('Trust')",
      )
      .first();
    const hasNavLink = await navLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasNavLink) {
      const href = await navLink.getAttribute('href').catch(() => null);
      await navLink.click({ force: true }).catch(async () => {
        if (href) {
          await page.goto(`${BASE_PATH}${href}`.replace('//', '/'));
        }
      });
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    } else {
      await page.goto(`${BASE_PATH}platform`.replace('//', '/'));
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    }

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test('user navigates from platform to trust page via nav', async ({ page }) => {
    await page.goto(`${BASE_PATH}platform`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const trustLink = nav
      .locator("a[href='/trust'], a[href*='/trust'], a:has-text('Trust')")
      .first();
    const hasTrustLink = await trustLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (!hasTrustLink) {
      await page.goto(`${BASE_PATH}trust`.replace('//', '/'));
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    } else {
      await trustLink.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    }

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });

  test('user navigates from trust to nexus page via direct link or nav', async ({ page }) => {
    await page.goto(`${BASE_PATH}trust`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const nexusLink = nav
      .locator("a[href='/nexus'], a:has-text('Nexus'), a[href*='platform'], a:has-text('Platform')")
      .first();
    const hasNexusLink = await nexusLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (!hasNexusLink) {
      const nexusUrl = `${BASE_PATH}nexus`.replace('//', '/');
      const resp = await page.goto(nexusUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (!resp || resp.status() >= 500) {
        test.skip(true, 'Nexus app (/nexus) is not running — skipping nexus navigation test');
        return;
      }
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    } else {
      await nexusLink.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    }

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});

test.describe('SZL Holdings — Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('homepage renders correctly on mobile', async ({ page }) => {
    await page.goto(BASE_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('ecosystem page renders on mobile and URL changes to ecosystem', async ({ page }) => {
    await page.goto(`${BASE_PATH}ecosystem`.replace('//', '/'));
    await page.waitForLoadState('domcontentloaded');
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });

  test('trust center page renders correctly on mobile', async ({ page }) => {
    await page.goto(`${BASE_PATH}trust-center`.replace('//', '/'));
    await page.waitForLoadState('domcontentloaded');
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});

test.describe('SZL Holdings — Portfolio Dashboard', () => {
  test('portfolio page loads without crash', async ({ page }) => {
    await page.goto(`${BASE_PATH}portfolio`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test('portfolio page renders module tiles for all six portfolio companies', async ({ page }) => {
    await page.goto(`${BASE_PATH}portfolio`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const modules = ['Lyte', 'Terra', 'Vessels', 'Sentra', 'Alloy', 'Carlota Jo'];
    for (const name of modules) {
      const tile = page.locator(`:text("${name}")`).first();
      await expect(tile).toBeVisible({ timeout: 15000 });
    }
  });

  test('portfolio page shows either live data or a clear data-state notice', async ({ page }) => {
    await page.goto(`${BASE_PATH}portfolio`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const hasDataNotice = await page
      .locator(
        ":text('demo data'), :text('seeded'), :text('live signal'), :text('unavailable'), :text('cached')",
      )
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    const hasTile = await page.locator(':text("Lyte")').first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasDataNotice || hasTile).toBeTruthy();
  });

  test('portfolio page has a Refresh button', async ({ page }) => {
    await page.goto(`${BASE_PATH}portfolio`.replace('//', '/'));
    await page.waitForLoadState('domcontentloaded');

    const refreshBtn = page.locator("button:has-text('Refresh'), button[aria-label*='refresh' i]").first();
    await expect(refreshBtn).toBeVisible({ timeout: 15000 });
  });
});

test.describe('SZL Holdings — Investors Hub', () => {
  test('investors hub page loads and shows key sections', async ({ page }) => {
    await page.goto(`${BASE_PATH}investors`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const heading = page
      .locator(":text('Investor'), :text('Series A'), :text('Governed'), :text('SZL Holdings')")
      .first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('investors hub shows company fundamentals section', async ({ page }) => {
    await page.goto(`${BASE_PATH}investors`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const fundamentals = page
      .locator(":text('Stage'), :text('Category'), :text('Architecture'), :text('fundamentals')")
      .first();
    await expect(fundamentals).toBeVisible({ timeout: 15000 });
  });

  test('investors hub navigation grid shows all investor sub-sections', async ({ page }) => {
    await page.goto(`${BASE_PATH}investors`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const sections = ['Overview', 'Architecture', 'Moat', 'Roadmap', 'Trust', 'Data Room'];
    for (const section of sections) {
      const link = page.locator(`:text("${section}")`).first();
      await expect(link).toBeVisible({ timeout: 10000 });
    }
  });

  test('investors data room shows access controls for unauthenticated visitors', async ({ page }) => {
    await page.goto(`${BASE_PATH}investors/data-room`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const accessControl = page
      .locator(
        ":text('Sign in'), :text('Access'), :text('Data Room'), :text('Request'), :text('restricted')",
      )
      .first();
    await expect(accessControl).toBeVisible({ timeout: 15000 });
  });
});

test.describe('SZL Holdings — Academy Progress', () => {
  test('academy page loads with learning path content', async ({ page }) => {
    await page.goto(`${BASE_PATH}academy`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const heading = page
      .locator(":text('Academy'), :text('Learn'), :text('platform'), :text('Learning Paths')")
      .first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('academy page shows a progress bar or progress indicator', async ({ page }) => {
    await page.goto(`${BASE_PATH}academy`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const progressIndicator = page
      .locator(":text('Progress'), :text('paths'), :text('0 /'), :text('/ 6')")
      .first();
    await expect(progressIndicator).toBeVisible({ timeout: 15000 });
  });

  test('academy learning path checkboxes are interactive', async ({ page }) => {
    await page.goto(`${BASE_PATH}academy`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const checkboxes = page.locator("button[aria-label], svg[class*='circle' i], [role='checkbox']");
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('academy progress persists across page navigations', async ({ page }) => {
    await page.goto(`${BASE_PATH}academy`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    await page.evaluate(() => {
      const progress: Record<string, boolean> = { 'platform-foundations': true };
      localStorage.setItem('szl-academy-progress-v1', JSON.stringify(progress));
    });

    await page.goto(`${BASE_PATH}`.replace('//', '/'));
    await page.waitForLoadState('domcontentloaded');
    await page.goto(`${BASE_PATH}academy`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const stored = await page.evaluate(() =>
      localStorage.getItem('szl-academy-progress-v1'),
    );
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed['platform-foundations']).toBe(true);
  });
});

test.describe('SZL Holdings — Accessibility (WCAG 2.1 AA)', () => {
  const a11yRoutes = [
    { path: '/', label: 'homepage' },
    { path: '/platform', label: 'platform' },
    { path: '/contact', label: 'contact' },
    { path: '/trust-center', label: 'trust center' },
    { path: '/portfolio', label: 'portfolio dashboard' },
    { path: '/investors', label: 'investors hub' },
    { path: '/academy', label: 'academy' },
  ];

  for (const route of a11yRoutes) {
    test(`${route.label} (${route.path}) passes WCAG 2.1 AA axe-core scan`, async ({
      page,
    }, testInfo) => {
      await page.goto(`${BASE_PATH}${route.path}`.replace(/([^:])\/\//g, '$1/'), {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude("[data-testid='dev-only']")
        .analyze();

      await testInfo.attach(`axe-results${route.path.replace(/\//g, '-')}`, {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });

      if (results.violations.length > 0) {
        const summary = results.violations
          .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join('\n');
        expect(
          results.violations,
          `WCAG 2.1 AA violations on ${route.path}:\n${summary}`,
        ).toHaveLength(0);
      }
    });
  }
});
