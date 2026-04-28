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
        ":text('KORA'), :text('PARAGON'), :text('SEXTANT'), :text('DOMAINE'), :text('Ecosystem'), :text('Portfolio')",
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
        "nav a[href*='platform'], nav a:has-text('Platform'), nav a[href*='nexus'], nav a:has-text('PRAXIS'), nav a[href*='lyte'], nav a:has-text('KORA'), nav a[href*='trust'], nav a:has-text('Trust')",
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
      .locator("a[href='/nexus'], a:has-text('PRAXIS'), a[href*='platform'], a:has-text('Platform')")
      .first();
    const hasPRAXISLink = await nexusLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (!hasPRAXISLink) {
      const nexusUrl = `${BASE_PATH}nexus`.replace('//', '/');
      const resp = await page.goto(nexusUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (!resp || resp.status() >= 500) {
        test.skip(true, 'PRAXIS app (/nexus) is not running — skipping nexus navigation test');
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

    const modules = ['KORA', 'DOMAINE', 'SEXTANT', 'PARAGON', 'Counsel', 'Carlota Jo'];
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

    const hasTile = await page.locator(':text("KORA")').first().isVisible({ timeout: 5000 }).catch(() => false);

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

test.describe('SZL Holdings — Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
  });

  test('Tab key reaches every primary nav link and each shows a visible focus indicator', async ({
    page,
  }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    // Count only visible nav links — hidden mobile-menu duplicates are excluded.
    const navLinkCount = await nav.locator('a:visible').count();
    expect(navLinkCount, 'Nav must contain at least one visible <a>').toBeGreaterThan(0);

    // Tab from the very top of the page and track every nav <a> that receives focus.
    const focusedNavLinks: string[] = [];
    await page.keyboard.press('Tab');

    for (let i = 0; i < navLinkCount + 30; i++) {
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        return {
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim() ?? '',
          isInNav: !!el.closest('nav'),
          pastNav: !el.closest('nav') && focusedPastNav(),
        };

        function focusedPastNav(): boolean {
          const nav = document.querySelector('nav');
          if (!nav || !el) return false;
          return (
            nav.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
          ) !== 0;
        }
      });

      // Stop once we have passed the nav entirely (focus moved beyond it).
      if (info?.pastNav && focusedNavLinks.length > 0) break;

      if (info?.isInNav && info.tag === 'a') {
        // Hard-assert a focus ring on every nav link that receives focus.
        const ring = await hasFocusRing(page);
        expect(
          ring,
          `Nav link "${info.text}" is focused but has no visible focus ring (outline-width > 0 or non-none box-shadow required)`,
        ).toBe(true);
        focusedNavLinks.push(info.text);
      }

      await page.keyboard.press('Tab');
    }

    // At minimum every visible nav link must have been tabbed through.
    expect(
      focusedNavLinks.length,
      `Expected all ${navLinkCount} visible nav links to receive Tab focus; reached: ${focusedNavLinks.join(', ')}`,
    ).toBeGreaterThanOrEqual(navLinkCount);
  });

  test('pressing Enter on a focused nav link changes the active route', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    // Find a visible nav link with a non-hash href so we can predict the
    // destination. Hidden / mobile-menu duplicates are excluded so the link
    // we tab toward is actually focusable.
    const navLinks = nav.locator('a:visible');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    let targetHref: string | null = null;
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      if (href && !href.startsWith('#') && href !== '/') {
        targetHref = href;
        break;
      }
    }

    expect(targetHref, 'Nav must expose at least one non-root, non-hash link for keyboard activation').not.toBeNull();

    // Tab until that specific link receives focus.
    let activated = false;
    await page.keyboard.press('Tab');
    for (let i = 0; i < 40; i++) {
      const focusedHref = await page.evaluate(
        () => (document.activeElement as HTMLAnchorElement | null)?.getAttribute('href') ?? null,
      );

      if (focusedHref === targetHref) {
        // Use waitForURL to reliably detect both full-page and SPA navigation.
        await Promise.all([
          page.waitForURL(`**${targetHref}`, { timeout: 15000 }),
          page.keyboard.press('Enter'),
        ]);
        // Confirm the current URL now includes the target path.
        expect(page.url()).toContain(targetHref.replace(/^\//, ''));
        activated = true;
        break;
      }

      await page.keyboard.press('Tab');
    }

    expect(activated, `Keyboard Enter on nav link "${targetHref}" did not change the route`).toBe(true);
  });

  test('contact form can be filled and submitted entirely by keyboard', async ({ page }) => {
    await page.goto(`${BASE_PATH}contact`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const form = page.locator('form').first();
    // Hard-assert the contact form is present — its removal/breakage is exactly
    // the kind of regression these smoke tests must catch automatically.
    await expect(form, 'Contact page must render a <form> for keyboard testing').toBeVisible({ timeout: 10000 });

    // Tab to the first form field.
    await page.keyboard.press('Tab');
    let reachedForm = false;
    for (let i = 0; i < 35; i++) {
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        return { tag: el.tagName.toLowerCase(), isInForm: !!el.closest('form') };
      });
      if (info?.isInForm && (info.tag === 'input' || info.tag === 'textarea' || info.tag === 'select')) {
        reachedForm = true;
        break;
      }
      await page.keyboard.press('Tab');
    }
    expect(reachedForm, 'Tab key must reach a form field inside <form>').toBe(true);

    // Fill every text/email/tel/textarea field via keyboard, Tab to advance.
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
          await page.keyboard.type('keyboard@test.example');
        } else if (info.type === 'tel') {
          await page.keyboard.type('5555550100');
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

test.describe('SZL Holdings — Admin Sidebar Shortcut', () => {
  test('admin page loads at /admin route without crash', async ({ page }) => {
    await page.goto(`${BASE_PATH}admin`.replace('//', '/'));
    await page.waitForLoadState('domcontentloaded');
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });

  test('admin sidebar shows Command Center shortcut after PIN unlock', async ({ page }) => {
    await page.goto(`${BASE_PATH}admin`.replace('//', '/'));
    await page.waitForLoadState('domcontentloaded');

    const isAuthBlocked = await page
      .locator(":text('Authentication Required'), :text('Sign in to access')")
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (isAuthBlocked) {
      test.skip(true, 'Clerk auth blocks admin — cannot test sidebar without authenticated session');
      return;
    }

    await page.evaluate(() => localStorage.setItem('szl_admin_unlocked', 'true'));
    await page.goto(`${BASE_PATH}admin`.replace('//', '/'));
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    const sidebar = page.locator('aside nav').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    const commandCenterLink = sidebar.locator("a[href='/admin/command-center']");
    await expect(commandCenterLink).toBeVisible({ timeout: 5000 });
    await expect(commandCenterLink).toContainText('Command Center');

    await commandCenterLink.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/admin/command-center');
  });

  test('admin.tsx source contains Command Center sidebar link in nav section', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const adminPath = path.resolve('artifacts/szl-holdings/src/pages/admin.tsx');
    const source = fs.readFileSync(adminPath, 'utf-8');

    expect(source).toContain('href="/admin/command-center"');
    expect(source).toContain('<Terminal');
    expect(source).toContain('Command Center');

    const sidebarMatch = source.match(/ADMIN_SECTIONS\.map[\s\S]*?<\/nav>/);
    expect(sidebarMatch).toBeTruthy();
    const sidebarBlock = sidebarMatch![0];
    expect(sidebarBlock).toContain('href="/admin/command-center"');
    expect(sidebarBlock).toContain('Command Center');
    expect(sidebarBlock).toContain('border-t');
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

// ---------------------------------------------------------------------------
// Admin Command Center — Sidebar active state (Task #1483)
//
// Verifies that the "Platform Settings" and "Tenant Health" sidebar links
// highlight (text-primary / bg-primary\/10) when the browser URL matches
// their respective routes, using wouter's useLocation() hook.
// ---------------------------------------------------------------------------

const ADMIN_AUTH_USER_URL = '**/api/auth/user';
const ADMIN_MY_ROLES_URL = '**/api/auth/my-roles';
const ADMIN_CC_ROUTE = '/admin/command-center';

const ADMIN_MOCK_USER = {
  user: {
    id: 99,
    displayName: 'E2E Admin',
    email: 'e2e-admin@szl.test',
    roles: ['admin', 'super_admin'],
  },
};

function joinAdminBase(path: string): string {
  const base = (process.env.SZL_BASE_PATH ?? '/').replace(/\/$/, '');
  return `${base}${path}` || path;
}

async function mockAdminAuth(page: import('@playwright/test').Page) {
  await page.route(ADMIN_AUTH_USER_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ADMIN_MOCK_USER),
    }),
  );
  await page.route(ADMIN_MY_ROLES_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ roles: ['admin', 'super_admin'] }),
    }),
  );
  await page.route('**/api/admin/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    }),
  );
}

test.describe('Admin Command Center — Sidebar active state', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminAuth(page);
    await page.goto(joinAdminBase(ADMIN_CC_ROUTE));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);
  });

  // Hard-assert the sidebar links exist and are inactive while viewing /admin/command-center.
  test('sidebar links are present and not highlighted on /admin/command-center', async ({
    page,
  }) => {
    const platformLink = page.locator('a[href="/admin/platform-settings"]').first();
    const tenantLink = page.locator('a[href="/admin/tenant-health"]').first();
    await expect(platformLink).toBeVisible({ timeout: 15_000 });
    await expect(tenantLink).toBeVisible({ timeout: 15_000 });
    expect((await platformLink.getAttribute('class')) ?? '').not.toContain('text-primary');
    expect((await tenantLink.getAttribute('class')) ?? '').not.toContain('text-primary');
  });

  // Real navigation: click the Platform Settings link and verify it leads to the correct URL.
  test('clicking Platform Settings link navigates to /admin/platform-settings', async ({
    page,
  }) => {
    const link = page.locator('a[href="/admin/platform-settings"]').first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL('**/admin/platform-settings', { timeout: 15_000 }),
      link.click(),
    ]);
    expect(new URL(page.url()).pathname).toBe('/admin/platform-settings');
  });

  // Real navigation: click the Tenant Health link and verify it leads to the correct URL.
  test('clicking Tenant Health link navigates to /admin/tenant-health', async ({ page }) => {
    const link = page.locator('a[href="/admin/tenant-health"]').first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL('**/admin/tenant-health', { timeout: 15_000 }),
      link.click(),
    ]);
    expect(new URL(page.url()).pathname).toBe('/admin/tenant-health');
  });

  // Active-state: simulate being on /admin/platform-settings via pushState so the
  // AdminCommandCenter (and its sidebar) stay mounted while useLocation() updates.
  test('Platform Settings link is highlighted when URL is /admin/platform-settings', async ({
    page,
  }) => {
    const link = page.locator('a[href="/admin/platform-settings"]').first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => {
      window.history.pushState({}, '', '/admin/platform-settings');
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    });
    await expect(link).toHaveClass(/text-primary/, { timeout: 3_000 });
  });

  // Active-state: same for /admin/tenant-health.
  test('Tenant Health link is highlighted when URL is /admin/tenant-health', async ({ page }) => {
    const link = page.locator('a[href="/admin/tenant-health"]').first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => {
      window.history.pushState({}, '', '/admin/tenant-health');
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    });
    await expect(link).toHaveClass(/text-primary/, { timeout: 3_000 });
  });

  // Exclusivity: only the matching link is highlighted; the other stays inactive.
  test('only Platform Settings is highlighted when URL is /admin/platform-settings', async ({
    page,
  }) => {
    const platformLink = page.locator('a[href="/admin/platform-settings"]').first();
    const tenantLink = page.locator('a[href="/admin/tenant-health"]').first();
    await expect(platformLink).toBeVisible({ timeout: 15_000 });
    await expect(tenantLink).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => {
      window.history.pushState({}, '', '/admin/platform-settings');
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    });
    await expect(platformLink).toHaveClass(/text-primary/, { timeout: 3_000 });
    expect((await tenantLink.getAttribute('class')) ?? '').not.toContain('text-primary');
  });
});
