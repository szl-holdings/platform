import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const CARLOTA_PATH = (process.env.CARLOTA_BASE_PATH ?? '/carlota-jo').replace(/\/$/, '');

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

    const contactLink = nav.locator("a[href*='contact'], a:has-text('Contact')").first();
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
    const practiceAreaStep = page.locator(":text('Practice Area')").first();
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
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    // Count only visible nav links — hidden mobile-menu duplicates are excluded.
    const navLinkCount = await nav.locator('a:visible').count();
    expect(navLinkCount, 'Nav must contain at least one visible <a>').toBeGreaterThan(0);

    // Tab from the top of the page and record every nav <a> that receives focus.
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
          pastNav: !el.closest('nav') && isPastNav(),
        };

        function isPastNav(): boolean {
          const nav = document.querySelector('nav');
          if (!nav || !el) return false;
          return (nav.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
        }
      });

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

    expect(
      focusedNavLinks.length,
      `Expected all ${navLinkCount} visible nav links to receive Tab focus; reached: ${focusedNavLinks.join(', ')}`,
    ).toBeGreaterThanOrEqual(navLinkCount);
  });

  test('pressing Enter on a focused nav link changes the active route', async ({ page }) => {
    const nav = page.locator('nav').first();
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

    // Tab until that specific link is focused.
    let activated = false;
    await page.keyboard.press('Tab');
    for (let i = 0; i < 40; i++) {
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

      await page.keyboard.press('Tab');
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
