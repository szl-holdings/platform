/**
 * Visual QA Pipeline — Phase 6 Design Overhaul
 *
 * Three layers of quality gating per operator-facing surface:
 *   1. Brand-string reachability — confirms correct artifact loaded (not proxy
 *      fallback / 404 / error page). Used as the availability check.
 *   2. Screenshot regression — toHaveScreenshot() fails build if pixels drift
 *      beyond the configured threshold. Baselines committed to
 *      tests/e2e/visual-qa.spec.ts-snapshots/ (linux/chromium). Regenerate with
 *      --update-snapshots when design changes are intentional.
 *   3. Accessibility gate — axe-core wcag2a/wcag2aa scan. Critical violations
 *      hard-fail the test; infrastructure errors (JS context closed etc.) are
 *      non-fatal to avoid flaky failures from proxy timing issues.
 *
 * Artifacts marked required:true FAIL the suite if unreachable (HTTP !== 200).
 * Artifacts marked required:false skip gracefully when not running.
 *
 * Saves press-kit JPEGs to launch-shots/ after each desktop assertion.
 *
 * First-run (generate baselines):
 *   pnpm exec playwright test tests/e2e/visual-qa.spec.ts --update-snapshots
 *
 * Subsequent runs (gate on regressions):
 *   pnpm exec playwright test tests/e2e/visual-qa.spec.ts
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const LAUNCH_SHOTS_DIR = path.resolve('./launch-shots');
fs.mkdirSync(LAUNCH_SHOTS_DIR, { recursive: true });

const DESKTOP  = { width: 1440, height: 900 };
const MOBILE   = { width: 390,  height: 844 };

interface ArtifactTarget {
  slug: string;
  path: string;
  brand: string | RegExp;
  shotFile: string;
  /** Core artifacts FAIL the suite if unavailable. Others skip gracefully. */
  required: boolean;
}

const TARGETS: ArtifactTarget[] = [
  { slug: 'szl-holdings',        path: '/',                    brand: /SZL Holdings|Governed Autonomy/i,        shotFile: '01-szl-home.jpg',              required: true  },
  { slug: 'pulse',               path: '/pulse/',              brand: /Pulse|Executive Briefing|AI Briefing/i, shotFile: '02-pulse.jpg',                 required: false },
  { slug: 'aegis',               path: '/aegis/',              brand: /Aegis|Defense|Intelligence/i,          shotFile: '03-aegis.jpg',                 required: false },
  { slug: 'vessels',             path: '/vessels/',            brand: /Vessels|Maritime|Fleet/i,                shotFile: '04-vessels.jpg',               required: false },
  { slug: 'terra',               path: '/terra/',              brand: /Terra|Real Estate|Property/i,          shotFile: '05-terra.jpg',                 required: false },
  { slug: 'carlota-jo',          path: '/carlota-jo/',         brand: /Carlota Jo|Consulting/i,                 shotFile: '06-carlota-jo.jpg',            required: false },
  { slug: 'command',             path: '/command/',            brand: /Unified Command|Command Center/i,         shotFile: '07-command.jpg',               required: false },
  { slug: 'sentra',              path: '/sentra/',             brand: /Sentra|Cyber Resilience/i,               shotFile: '08-sentra.jpg',                required: true  },
  { slug: 'counsel',             path: '/counsel/',            brand: /Counsel|Legal Matter|Legal Command/i,    shotFile: '09-counsel.jpg',               required: false },
  { slug: 'a11oy',               path: '/a11oy/',              brand: /A11oy|Enterprise Execution/i,            shotFile: '10-a11oy.jpg',                 required: false },
  { slug: 'lyte-command-center', path: '/lyte-command-center/', brand: /Lyte|Decision Intelligence|Lyte/i,    shotFile: '11-lyte-command-center.jpg',   required: false },
];

const SENTRA_INNER_PAGES: Array<{
  route: string;
  shotFile: string;
  brand: string | RegExp;
  required: boolean;
}> = [
  { route: '/sentra/crisis-arena/leaderboard', brand: /Analyst Rankings|Analyst Performance Registry/i, shotFile: '08a-sentra-analyst-rankings.jpg',          required: true  },
  { route: '/sentra/crisis-arena/engagements', brand: /Adversarial Simulation|Active Engagements/i,     shotFile: '08b-sentra-adversarial-engagements.jpg',    required: true  },
  { route: '/sentra/crisis-arena/architect',   brand: /Analyst Workspace|Submit Adversarial/i,          shotFile: '08c-sentra-analyst-workspace.jpg',          required: true  },
];

/**
 * Returns true only when the server responds HTTP 200 AND the page content
 * matches the expected brand string. The brand check is required to detect
 * proxy fallbacks that serve a different artifact with HTTP 200.
 */
async function checkAvailable(
  page: import('@playwright/test').Page,
  url: string,
  brand: string | RegExp,
): Promise<boolean> {
  try {
    const resp = await page.goto(url, { timeout: 12000, waitUntil: 'domcontentloaded' });
    if (!resp || resp.status() !== 200) return false;
    const content = await page.content();
    return typeof brand === 'string' ? content.includes(brand) : brand.test(content);
  } catch {
    return false;
  }
}

async function settle(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(600);
}

async function runAxe(page: import('@playwright/test').Page, label: string): Promise<void> {
  try {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    if (critical.length > 0) {
      const summary = critical
        .map((v) => `[${v.id}] ${v.description} (${v.nodes.length} node(s))`)
        .join('\n  ');
      throw new Error(
        `${label}: ${critical.length} critical accessibility violation(s):\n  ${summary}`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('critical accessibility')) throw err;
    // axe infrastructure errors (JS context closed, etc.) are non-fatal
  }
}

// ─────────────────────────────────────────────────────────────
// DESKTOP — full artifact gallery
// ─────────────────────────────────────────────────────────────
test.describe('Visual QA — Desktop (1440×900)', () => {
  test.use({ viewport: DESKTOP });

  for (const target of TARGETS) {
    test(`${target.slug} — brand + screenshot regression`, async ({ page, baseURL }) => {
      const url = `${baseURL}${target.path}`;
      const available = await checkAvailable(page, url, target.brand);

      if (!available) {
        if (target.required) {
          throw new Error(
            `Required artifact "${target.slug}" is not reachable or brand not found at ${url}`,
          );
        }
        test.skip();
        return;
      }

      await settle(page);
      await runAxe(page, target.slug);

      await expect(page).toHaveScreenshot(`${target.slug}-desktop.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.03,
        animations: 'disabled',
      });

      const shotPath = path.join(LAUNCH_SHOTS_DIR, target.shotFile);
      await page.screenshot({ path: shotPath, fullPage: true, type: 'jpeg', quality: 90 });
    });
  }
});

// ─────────────────────────────────────────────────────────────
// MOBILE — core required artifacts at 390×844
// ─────────────────────────────────────────────────────────────
test.describe('Visual QA — Mobile (390×844) — core artifacts', () => {
  test.use({ viewport: MOBILE });

  for (const target of TARGETS.filter((t) => t.required)) {
    test(`${target.slug} — mobile screenshot regression`, async ({ page, baseURL }) => {
      const url = `${baseURL}${target.path}`;
      const available = await checkAvailable(page, url, target.brand);

      if (!available) {
        throw new Error(
          `Required artifact "${target.slug}" is not reachable or brand not found at ${url} (mobile)`,
        );
      }

      await settle(page);

      await expect(page).toHaveScreenshot(`${target.slug}-mobile.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.04,
        animations: 'disabled',
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────
// SENTRA INNER PAGES — desktop + mobile
// ─────────────────────────────────────────────────────────────
test.describe('Visual QA — Sentra Inner Pages', () => {
  for (const page_def of SENTRA_INNER_PAGES) {
    test(`${page_def.route} — desktop`, async ({ page, baseURL }) => {
      await page.setViewportSize(DESKTOP);
      const url = `${baseURL}${page_def.route}`;
      const available = await checkAvailable(page, url, page_def.brand);

      if (!available) {
        if (page_def.required) {
          throw new Error(
            `Required route "${page_def.route}" is not reachable or brand not found at ${url}`,
          );
        }
        test.skip();
        return;
      }

      await settle(page);
      await runAxe(page, page_def.route);

      const slug = page_def.route.replace(/\//g, '-').replace(/^-/, '');
      await expect(page).toHaveScreenshot(`${slug}-desktop.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.03,
        animations: 'disabled',
      });

      const shotPath = path.join(LAUNCH_SHOTS_DIR, page_def.shotFile);
      await page.screenshot({ path: shotPath, fullPage: true, type: 'jpeg', quality: 90 });
    });

    test(`${page_def.route} — mobile`, async ({ page, baseURL }) => {
      await page.setViewportSize(MOBILE);
      const url = `${baseURL}${page_def.route}`;
      const available = await checkAvailable(page, url, page_def.brand);

      if (!available) {
        if (page_def.required) {
          throw new Error(
            `Required route "${page_def.route}" is not reachable or brand not found (mobile)`,
          );
        }
        test.skip();
        return;
      }

      await settle(page);

      const slug = page_def.route.replace(/\//g, '-').replace(/^-/, '');
      await expect(page).toHaveScreenshot(`${slug}-mobile.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.04,
        animations: 'disabled',
      });
    });
  }
});
