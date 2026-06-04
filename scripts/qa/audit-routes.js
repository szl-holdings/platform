#!/usr/bin/env node
/**
 * audit:routes — SZL Holdings Platform
 * Checks route coverage across all apps: verifies that registered routes exist as page files.
 *
 * Usage:
 *   node scripts/qa/audit-routes.js
 */

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

const APP_CONFIGS = [
  {
    name: 'SZL Holdings',
    appPath: join(ROOT, 'artifacts/szl-holdings/src'),
    pagesDir: 'pages',
    knownRoutes: [
      'landing',
      'platform',
      'design-partners',
      'contact',
      'trust-center',
      'trust',
      'trust-security',
      'trust-governance',
      'trust-architecture',
      'trust-ai',
      'trust-approvals',
      'trust-operations',
      'ventures',
      'portfolio',
      'how-it-works',
      'solutions',
      'solutions-aegis',
      'solutions-vessels',
      'solutions-terra',
      'solutions-prism-counsel',
      'lyte-page',
      'alloy-page',
      'docs',
      'status',
      'legal-privacy',
      'legal-terms',
      'accessibility',
      'not-found',
      'founder',
      'company',
    ],
  },
  {
    name: 'Lyte Command Center',
    appPath: join(ROOT, 'artifacts/lyte-command-center/src'),
    pagesDir: 'pages',
    knownRoutes: [
      'action-debt',
      'aef-knowledge-search',
      'billing-account',
      'board-view',
      'briefing',
      'brief',
      'causal-intelligence',
      'decision-center',
      'decision-replay',
      'decision-twin',
      'entity-graph',
      'eval-studio',
      'evidence-explorer',
      'forecast',
      'landing',
      'onboarding',
      'overview',
      'ownership-drift',
      'policy-center',
      'pressure-map',
      'run-console',
      'scenario-composer',
      'signals-console',
      'workflow-health',
    ],
  },
  {
    name: 'API Server',
    appPath: join(ROOT, 'artifacts/api-server/src'),
    pagesDir: 'routes',
    knownRoutes: [
      'health',
      'core',
      'auth',
      'alloy',
      'lyte',
      'vessels',
      'terra',
      'billing',
      'notifications',
      'connectors',
      'analytics',
      'jobs',
      'webhooks',
      'exports',
      'feedback',
    ],
  },
];

function listPageFiles(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name))
      .map((e) => e.name.replace(/\.(ts|tsx|js|jsx)$/, ''));
  } catch {
    return [];
  }
}

function listSubDirs(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}

function main() {

  let _totalChecks = 0;
  let _totalPassed = 0;
  let totalFailed = 0;
  const failures = [];

  for (const config of APP_CONFIGS) {
    const pagesDir = join(config.appPath, config.pagesDir);
    const existingFiles = new Set(listPageFiles(pagesDir));
    const _existingSubDirs = new Set(listSubDirs(pagesDir));

    // Check top-level routes
    for (const route of config.knownRoutes) {
      _totalChecks++;
      if (existingFiles.has(route)) {
        _totalPassed++;
      } else {
        totalFailed++;
        failures.push({ app: config.name, route, context: 'top-level' });
      }
    }

    // Check sub-directory routes
    if (config.subDirRoutes) {
      for (const { subDir, routes } of config.subDirRoutes) {
        const subPath = join(pagesDir, subDir);
        const subFiles = new Set(listPageFiles(subPath));

        for (const route of routes) {
          _totalChecks++;
          if (subFiles.has(route)) {
            _totalPassed++;
          } else {
            totalFailed++;
            failures.push({ app: config.name, route: `${subDir}/${route}`, context: 'sub-dir' });
          }
        }
      }
    }
  }

  if (totalFailed > 0) {
    console.error(`\n❌ audit:routes — ${totalFailed} missing route file(s):\n`);
    for (const f of failures) {
      console.error(`  [${f.app}] Missing page file: ${f.route} (${f.context})`);
    }
    console.error(`\nEnsure each listed route has a corresponding .tsx file in the pages directory,`);
    console.error(`or remove the route from knownRoutes in scripts/qa/audit-routes.js if intentionally deleted.\n`);
    process.exit(1);
  } else {
    console.log(`✅ audit:routes — all ${_totalChecks} registered routes have matching page files.`);
    process.exit(0);
  }
}

main();
