import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium, expect as playwrightExpect } from '@playwright/test';
import { collectLayoutEvidence } from './screenshot-layout-helpers.mjs';

// Browser action and assertion readiness share one deadline. Playwright's
// implicit five-second assertion default otherwise expires before the declared
// ten-second lazy-route readiness budget on a cold local build.
const READINESS_TIMEOUT_MS = 10_000;
const expect = playwrightExpect.configure({ timeout: READINESS_TIMEOUT_MS });

// Read-only, loopback-only browser checks. These exercise fixture interfaces;
// they never approve a Workcell, authenticate a provider, or execute an action.
export async function verifyProductInteractions(origin) {
  const target = new URL(origin);
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname));
  assert.equal(target.protocol, 'http:');
  assert.equal(target.username + target.password + target.search + target.hash, '');
  const capturePlan = JSON.parse(
    await readFile(
      new URL('../../audit/series-a-screenshot-capture-plan.json', import.meta.url),
      'utf8',
    ),
  );
  const browser = await chromium.launch({ headless: true });
  let timedOut = false;
  // Locator timeouts do not cover evaluate()/font readiness. Close the owned
  // browser at the suite deadline so a stalled renderer cannot strand capture.
  const deadline = setTimeout(
    () => {
      timedOut = true;
      void browser.close().catch(() => {});
    },
    10 * 60 * 1000,
  );
  deadline.unref();
  const records = [];
  try {
    for (const width of [320, 390, 768, 1366, 1728]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: 'block',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(READINESS_TIMEOUT_MS);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.name));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push('console.error');
      });
      await context.routeWebSocket('**/*', (socket) => {
        errors.push('WebSocket connection is not admitted for fixture verification');
        socket.close();
      });
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === target.origin || ['data:', 'blob:'].includes(url.protocol)) {
          await route.continue();
        } else {
          errors.push(`undeclared origin: ${url.origin}`);
          await route.abort();
        }
      });
      const check = async (name) => {
        const layout = await page.evaluate(collectLayoutEvidence);
        for (const [key, value] of Object.entries(layout)) {
          if (Array.isArray(value) && !key.startsWith('allowed')) {
            assert.equal(
              value.length,
              0,
              `${width}/${name}/${key}: ${JSON.stringify(value.slice(0, 3))}`,
            );
          }
        }
        const smallButtons = await page
          .locator('main button, dialog button')
          .evaluateAll((buttons) =>
            buttons
              .filter((button) => {
                const rect = button.getBoundingClientRect();
                return (
                  !button.closest('[inert]') &&
                  rect.width > 0 &&
                  rect.height > 0 &&
                  (rect.width < 43 || rect.height < 43)
                );
              })
              .map((button) => button.getAttribute('aria-label') || button.textContent),
          );
        assert.deepEqual(smallButtons, [], `${width}/${name}: undersized buttons`);
        const wrappedStatusPills = await page
          .locator('main [data-status-pill]')
          .evaluateAll((pills) =>
            pills
              .filter((pill) => getComputedStyle(pill).whiteSpace !== 'nowrap')
              .map((pill) => pill.textContent),
          );
        assert.deepEqual(wrappedStatusPills, [], `${width}/${name}: split operational status`);
        assert.deepEqual(errors, [], `${width}/${name} browser errors`);
        records.push({ width, state: name, result: 'PASS', layout });
      };
      const go = async (route) => {
        const response = await page.goto(`${target.origin}/a11oy/${route}`);
        assert.equal(response?.status(), 200, route);
        await page.waitForFunction(() => document.body.dataset.screenshotReady === 'true');
        await page.evaluate(async () => document.fonts.ready);
        await expect(page.locator('main h1')).toBeVisible();
      };

      for (const entry of capturePlan.targets) {
        await go(entry.route.replace('/a11oy/', ''));
        await expect(page.locator('main h1')).toHaveText(entry.expected_heading);
        await check(`initial-route:${entry.route}`);
      }

      await go('workcells');
      const toggle = page.getByRole('button', { name: 'Toggle sidebar', exact: true });
      if (width < 768) {
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await toggle.click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(page.locator('main')).toHaveAttribute('inert', '');
        const first = dialog.getByRole('button', { name: 'Close navigation', exact: true });
        await expect(first).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        assert.ok(await dialog.evaluate((element) => element.contains(document.activeElement)));
        await page.keyboard.press('Tab');
        await expect(first).toBeFocused();
        await check('mobile-drawer-open');
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await expect(toggle).toBeFocused();
        await expect(page.locator('main')).not.toHaveAttribute('inert', '');
        await toggle.click();
        await first.click();
        await expect(dialog).not.toBeVisible();
        await expect(toggle).toBeFocused();
        await check('mobile-drawer-close-button');
        await toggle.click();
        await expect(dialog).toBeVisible();
        await page.mouse.click(width - 5, 450);
        await expect(dialog).not.toBeVisible();
        await expect(toggle).toBeFocused();
        await check('mobile-drawer-backdrop-close');
        await toggle.click();
        await expect(dialog).toBeVisible();
        await page.setViewportSize({ width: 1366, height: 900 });
        await expect(dialog).not.toBeVisible();
        await expect(page.locator('aside#primary-navigation')).toBeVisible();
        await expect(page.locator('main')).not.toHaveAttribute('inert', '');
        assert.notEqual(
          await page.locator('body').evaluate((body) => body.style.overflow),
          'hidden',
        );
        await page.setViewportSize({ width, height: 900 });
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('#primary-navigation')).toHaveCount(0);
        await check('mobile-drawer-resize-restoration');
        await toggle.click();
        await expect(first).toBeFocused();
        await dialog.getByRole('link', { name: 'Product Journey', exact: true }).click();
        await expect(page).toHaveURL(/\/a11oy\/product-journey$/);
        await expect(dialog).not.toBeVisible();
        await expect(page.locator('main h1')).toHaveText('One fabric. Two clear ways in.');
        await check('mobile-drawer-navigation');
        await go('workcells');
      }
      const detailLinks = page
        .locator('main')
        .getByRole('link', { name: 'View Detail', exact: true });
      await expect(detailLinks).toHaveCount(20);
      let count = 0;
      for (const status of ['running', 'completed', 'idle', 'paused', 'error']) {
        const button = page.getByRole('button', { name: status, exact: true });
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        const observed = await detailLinks.count();
        count += observed;
        await expect(page.getByText(`${observed} workcells`, { exact: true })).toBeVisible();
        if (!observed) {
          await expect(page.getByText('No workcells match the current filter.')).toBeVisible();
        }
        await check(`workcells-filter-${status}`);
      }
      assert.equal(count, 20, 'status filters must partition the full registry');
      await page.getByRole('button', { name: 'all', exact: true }).click();
      await page.getByLabel('Filter workcells by vertical').selectOption('lyte-revenue');
      assert.ok((await detailLinks.count()) > 0 && (await detailLinks.count()) < 20);
      await check('workcells-filter-vertical');
      await detailLinks.first().click();
      await expect(page.locator('main')).toContainText(
        'no authenticated production operation is represented',
      );
      await check('workcell-detail-navigation');

      await go('workcells/wc-001/replay');
      await page.clock.install();
      const progress = page.getByText(/^\d+ \/ \d+ steps$/);
      await expect(progress).toHaveText(/^0 \/ \d+ steps$/);
      await page.getByRole('button', { name: '2×', exact: true }).click();
      await page.getByRole('button', { name: '▶ Play Replay', exact: true }).click();
      await page.clock.runFor(500);
      await expect(progress).toHaveText(/^1 \/ \d+ steps$/);
      await page.getByRole('button', { name: '⏸ Pause', exact: true }).click();
      const paused = await progress.textContent();
      await page.clock.runFor(2000);
      await expect(progress).toHaveText(paused);
      await page.getByRole('button', { name: '▶ Resume Replay', exact: true }).click();
      await page.clock.runFor(500);
      await expect(progress).toHaveText(/^2 \/ \d+ steps$/);
      await page.clock.runFor(15_000);
      await expect(page.getByRole('button', { name: '↩ Restart', exact: true })).toBeVisible();
      await check('replay-complete-after-pause-resume');
      await page.getByRole('button', { name: '↺ Reset', exact: true }).click();
      await expect(progress).toHaveText(/^0 \/ \d+ steps$/);
      await check('replay-reset');

      await go('proof');
      await page.getByRole('button', { name: 'Reasoning Replay', exact: true }).click();
      const prev = page.getByRole('button', { name: '← Prev', exact: true });
      const next = page.getByRole('button', { name: 'Next →', exact: true });
      await expect(prev).toBeDisabled();
      let iterations = 0;
      while (await next.isEnabled()) {
        assert.ok(iterations++ < 30, 'bounded fixture replay');
        await next.click();
      }
      await check('proof-replay-final');
      await prev.click();
      await expect(next).toBeEnabled();
      await page.getByRole('button', { name: 'Proof Diff', exact: true }).click();
      await check('proof-diff');
      await page.getByRole('button', { name: 'Proof Chain', exact: true }).click();
      await check('proof-chain');

      await go('demo');
      await page.locator('main button').first().click();
      await page.getByRole('button', { name: '▶ Start', exact: true }).click();
      iterations = 0;
      const advance = page.getByRole('button', { name: '→ Next Step', exact: true });
      while (await advance.count()) {
        assert.ok(iterations++ < 30, 'bounded demo walkthrough');
        await advance.click();
      }
      await expect(page.getByRole('button', { name: '↩ Reset', exact: true })).toBeVisible();
      await expect(page.locator('main')).toContainText(
        'No hashes, signatures, or external executions',
      );
      await check('demo-complete');
      await page.getByRole('button', { name: '↩ Reset', exact: true }).click();
      await expect(page.getByRole('button', { name: '▶ Start', exact: true })).toBeVisible();
      await check('demo-reset');
      await context.close();
      process.stderr.write(
        `Product interactions verified at ${width}px (${records.length} cumulative states).\n`,
      );
    }
    assert.equal(timedOut, false, 'product interaction suite exceeded its ten-minute deadline');
    return {
      schema: 'szl.a11oy-product-interactions/v1',
      state: 'PASS',
      browser: browser.version(),
      records,
      non_claim:
        'Local deterministic fixture interactions only; no external execution or hosted authority.',
    };
  } finally {
    clearTimeout(deadline);
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const receipt = await verifyProductInteractions(process.env.A11OY_URL || 'http://127.0.0.1:4110');
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}
