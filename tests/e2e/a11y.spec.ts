import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:80';
const BASE_PATH = process.env.SZL_BASE_PATH ?? '/';

const CRITICAL_PUBLIC_ROUTES = [
  { path: '/', label: 'homepage' },
  { path: '/about', label: 'about' },
  { path: '/contact', label: 'contact' },
  { path: '/trust-center', label: 'trust center' },
  { path: '/ecosystem', label: 'ecosystem' },
];

test.describe('Accessibility — SZL Holdings Public Routes', () => {
  for (const route of CRITICAL_PUBLIC_ROUTES) {
    test(`${route.label} (${route.path}) has no critical a11y violations`, async ({ page }) => {
      const url = `${BASE_URL}${BASE_PATH}${route.path}`.replace(/\/\//g, '/').replace(':/', '://');
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude("[data-testid='dev-only']")
        .analyze();

      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      if (criticalOrSerious.length > 0) {
        const summary = criticalOrSerious
          .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join('\n');
        expect(criticalOrSerious, `Critical/serious a11y violations:\n${summary}`).toHaveLength(0);
      }
    });
  }

  test('homepage document has a title', async ({ page }) => {
    await page.goto(`${BASE_URL}${BASE_PATH}`, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('homepage has a main landmark', async ({ page }) => {
    await page.goto(`${BASE_URL}${BASE_PATH}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
    const main = page.locator("main, [role='main']").first();
    await expect(main).toBeVisible({ timeout: 10000 });
  });

  test('interactive elements on homepage have accessible names', async ({ page }) => {
    await page.goto(`${BASE_URL}${BASE_PATH}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    const results = await new AxeBuilder({ page })
      .withRules(['button-name', 'link-name', 'image-alt', 'label'])
      .analyze();

    const violations = results.violations;
    if (violations.length > 0) {
      const summary = violations
        .map((v) => `${v.id}: ${v.description} (${v.nodes.length} node(s))`)
        .join('\n');
      expect(violations, `Interactive element a11y violations:\n${summary}`).toHaveLength(0);
    }
  });
});

/**
 * Per-artifact root-page axe scan.
 *
 * In the a11y CI workflow each matrix job sets A11Y_ARTIFACT_NAME and
 * PLAYWRIGHT_BASE_URL to point at a locally-served build of one artifact.
 * When run in that mode only the single-artifact suite executes.
 *
 * When PLAYWRIGHT_BASE_URL is the monorepo proxy (default), every artifact
 * is tested via its known path prefix (e.g. /a11oy/, /terra/).
 */
const ARTIFACT_NAME = process.env.A11Y_ARTIFACT_NAME ?? 'all';

const ARTIFACTS = [
  { name: 'a11oy',         rootPath: '/a11oy/' },
  { name: 'sentra',        rootPath: '/sentra/' },
  { name: 'terra',         rootPath: '/terra/' },
  { name: 'carlota-jo',    rootPath: '/carlota-jo/' },
  { name: 'counsel',       rootPath: '/counsel/' },
  { name: 'vessels',       rootPath: '/vessels/' },
];

const artifactsToScan =
  ARTIFACT_NAME === 'all'
    ? ARTIFACTS
    : ARTIFACTS.filter((a) => a.name === ARTIFACT_NAME);

test.describe('Accessibility — Per-Artifact Root Page axe Scan', () => {
  for (const artifact of artifactsToScan) {
    test.describe(`${artifact.name}`, () => {
      let resolvedBaseUrl: string;
      let resolvedRootPath: string;

      test.beforeAll(() => {
        if (ARTIFACT_NAME !== 'all') {
          resolvedBaseUrl = BASE_URL;
          resolvedRootPath = '/';
        } else {
          resolvedBaseUrl = BASE_URL;
          resolvedRootPath = artifact.rootPath;
        }
      });

      test('root page has no critical or serious axe violations (WCAG 2.1 AA)', async ({ page }) => {
        const url = `${resolvedBaseUrl}${resolvedRootPath}`.replace(/([^:])\/\//g, '$1/');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .exclude("[data-testid='dev-only']")
          .analyze();

        const criticalOrSerious = results.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious',
        );

        if (criticalOrSerious.length > 0) {
          const summary = criticalOrSerious
            .map(
              (v) =>
                `[${v.impact.toUpperCase()}] ${v.id}: ${v.description}\n` +
                v.nodes
                  .slice(0, 3)
                  .map((n) => `  • ${n.html.slice(0, 120)}`)
                  .join('\n'),
            )
            .join('\n\n');
          expect(
            criticalOrSerious,
            `\n⚠ ${artifact.name} — ${criticalOrSerious.length} critical/serious violation(s):\n${summary}\n`,
          ).toHaveLength(0);
        }
      });

      test('root page html element has a lang attribute', async ({ page }) => {
        const url = `${resolvedBaseUrl}${resolvedRootPath}`.replace(/([^:])\/\//g, '$1/');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const lang = await page.$eval('html', (el) => el.getAttribute('lang') ?? '');
        expect(lang.trim(), `<html> must have a lang attribute on ${artifact.name}`).not.toBe('');
      });

      test('root page document has a non-empty title', async ({ page }) => {
        const url = `${resolvedBaseUrl}${resolvedRootPath}`.replace(/([^:])\/\//g, '$1/');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const title = await page.title();
        expect(title.trim(), `<title> must be non-empty on ${artifact.name}`).not.toBe('');
      });
    });
  }
});
