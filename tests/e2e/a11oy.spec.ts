import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3010';
const BASE_PATH = normalizeBasePath(process.env.A11OY_BASE_PATH ?? '/');

function normalizeBasePath(value: string): string {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash === '/' ? '' : withLeadingSlash.replace(/\/+$/, '');
}

function routeUrl(route: string): string {
  const suffix = route === '/' ? '/' : `/${route.replace(/^\/+/, '')}`;
  return new URL(`${BASE_PATH}${suffix}`, BASE_URL).toString();
}

async function openMountedRoute(
  page: Page,
  route: string,
  expectedHeading?: string | RegExp,
): Promise<void> {
  const response = await page.goto(routeUrl(route), {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  expect(response, `${route} must return an HTTP response`).not.toBeNull();
  expect(response?.status(), `${route} must not return an HTTP error`).toBeLessThan(400);

  const root = page.locator('#root');
  await expect(root, `${route} must include the React mount`).toBeAttached();
  await expect
    .poll(() => root.locator(':scope > *').count(), {
      message: `${route} must mount non-empty product content`,
      timeout: 15_000,
    })
    .toBeGreaterThan(0);
  if (expectedHeading) {
    await expect(
      page.getByRole('heading', { level: 1, name: expectedHeading }),
      `${route} must resolve its route-specific lazy page`,
    ).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByTestId('route-loader')).toHaveCount(0);
  await expect(page.getByTestId('candidate-boundary')).toBeVisible();
  await expect(page.getByText('Something went wrong', { exact: true })).toHaveCount(0);
}

test.describe('A11oy product E2E', () => {
  test('boots the product shell with identity, title, and primary navigation', async ({ page }) => {
    await openMountedRoute(page, '/');

    await expect(page).toHaveTitle(/a11oy/i);
    await expect(page.locator('nav').first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Agent visualization', exact: true }),
    ).toBeVisible();
  });

  for (const route of [
    { path: '/agent-viz', label: 'agent visualization', heading: 'Agent Visualization' },
    { path: '/adversarial', label: 'adversarial fixture', heading: 'Governance Stress Testing' },
    {
      path: '/frontier',
      label: 'positioning fixture',
      heading: 'Competitive Positioning Matrix',
    },
    { path: '/verifier', label: 'verifier fixture', heading: 'Autonomous Verification Suite' },
    {
      path: '/security-agents',
      label: 'security agent fixture',
      heading: 'AI Security Operations',
    },
  ]) {
    test(`${route.label} route resolves its reviewed fixture page`, async ({ page }) => {
      await openMountedRoute(page, route.path, route.heading);
      await expect(page.getByTestId('publication-hold')).toHaveCount(0);
    });
  }

  for (const route of [
    '/sdk',
    '/compass',
    '/care',
    '/boardroom',
    '/terminal',
    '/agent-identity',
    '/agent-bom',
    '/applications',
  ]) {
    test(`${route} is excluded from the public candidate bundle`, async ({ page }) => {
      await openMountedRoute(page, route, 'Evidence review required before publication');
      await expect(page.getByTestId('publication-hold')).toBeVisible();
      await expect(page.getByText(`${BASE_PATH}${route}`, { exact: true })).toBeVisible();
    });
  }

  test('primary navigation changes the client route and preserves mounted content', async ({
    page,
  }) => {
    await openMountedRoute(page, '/');

    await page.getByRole('link', { name: 'Agent visualization', exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`${BASE_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/agent-viz/?$`),
    );
    await expect(
      page.getByRole('heading', { level: 1, name: 'Agent Visualization' }),
    ).toBeVisible();
    await expect(page.getByTestId('publication-hold')).toHaveCount(0);
    await expect(page.getByTestId('route-loader')).toHaveCount(0);
  });

  test('root has no critical or serious WCAG 2.1 A/AA violations', async ({ page }) => {
    await openMountedRoute(page, '/');
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => null);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude("[data-testid='dev-only']")
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    );

    expect(
      blocking,
      blocking
        .map(
          (violation) =>
            `[${violation.impact}] ${violation.id}: ${violation.description} (${violation.nodes.length} node(s))`,
        )
        .join('\n'),
    ).toHaveLength(0);
  });
});
