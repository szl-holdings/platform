#!/usr/bin/env node
/**
 * audit:routes — SZL Holdings Platform
 * Verifies that every lazily-registered page route resolves to a real page file.
 *
 * Historically this used a hand-maintained `knownRoutes` list per app. That list
 * drifted badly once the monorepo was shrunk to its six product artifacts — it
 * still referenced deleted apps (szl-holdings, lyte-command-center) and the
 * pre-restructure api-server route layout, so the guard failed on 69 phantom
 * routes that no longer exist.
 *
 * Instead of re-hardcoding a list that will drift again, this scans each current
 * product app's router (`src/App.tsx`) for dynamic page imports —
 * `import('@/pages/...')` / `import('./pages/...')` — and asserts the referenced
 * page module exists on disk. This keeps the guard self-maintaining and honest:
 * a page that is still routed but whose file was deleted will fail the audit.
 *
 * Usage:
 *   node scripts/qa/audit-routes.js
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const ARTIFACTS = join(ROOT, 'artifacts');

// Current product apps (monorepo was shrunk to these six — see .github/workflows/e2e.yml).
const APPS = ['a11oy', 'sentra', 'terra', 'carlota-jo', 'counsel', 'vessels'];

const PAGE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// Matches static page imports registered in an app router, e.g.
//   import('@/pages/deals')      import("./pages/dashboard")
//   import('../pages/foo/bar')   import('src/pages/x')
// The captured group is the page path relative to the app's `pages` directory.
const PAGE_IMPORT_RE = /import\(\s*['"](?:@|\.\.?|src)\/pages\/([^'"]+)['"]\s*\)/g;

function pageExists(pagesDir, routePath) {
  const base = join(pagesDir, routePath);
  for (const ext of PAGE_EXTENSIONS) {
    if (existsSync(base + ext)) return true;
  }
  // A page may also be a directory with an index file.
  if (existsSync(base) && statSync(base).isDirectory()) {
    for (const ext of PAGE_EXTENSIONS) {
      if (existsSync(join(base, `index${ext}`))) return true;
    }
  }
  return false;
}

function collectRoutes(routerFile) {
  const routes = new Set();
  let contents;
  try {
    contents = readFileSync(routerFile, 'utf8');
  } catch {
    return routes;
  }
  for (const match of contents.matchAll(PAGE_IMPORT_RE)) {
    if (match[1]) routes.add(match[1]);
  }
  return routes;
}

function main() {
  let totalChecks = 0;
  let totalPassed = 0;
  const failures = [];

  for (const app of APPS) {
    const appSrc = join(ARTIFACTS, app, 'src');
    const pagesDir = join(appSrc, 'pages');
    const routerFile = join(appSrc, 'App.tsx');

    if (!existsSync(routerFile)) {
      failures.push({ app, route: 'src/App.tsx', context: 'missing app router' });
      continue;
    }

    const routes = [...collectRoutes(routerFile)].sort();
    for (const routePath of routes) {
      totalChecks++;
      if (pageExists(pagesDir, routePath)) {
        totalPassed++;
      } else {
        failures.push({ app, route: routePath, context: 'top-level' });
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\n❌ audit:routes — ${failures.length} missing route file(s):\n`);
    for (const f of failures) {
      console.error(`  [${f.app}] Missing page file: ${f.route} (${f.context})`);
    }
    console.error(
      `\nEnsure each listed route has a corresponding page file under artifacts/<app>/src/pages/,`,
    );
    console.error(
      `or remove the dynamic import from the app router if the page was intentionally deleted.\n`,
    );
    process.exit(1);
  }

  console.log(
    `✅ audit:routes — all ${totalPassed}/${totalChecks} registered page routes across ${APPS.length} apps have matching page files.`,
  );
  process.exit(0);
}

main();
