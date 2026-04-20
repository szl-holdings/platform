#!/usr/bin/env node
/**
 * audit:routes — SZL Holdings Platform
 * Checks route coverage across all apps: verifies that registered routes exist as page files.
 *
 * Usage:
 *   node scripts/qa/audit-routes.js
 */

import { existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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
      'dashboard',
      'signals-page',
      'actions-page',
      'readiness-page',
      'approvals-center',
      'ownership-map-new',
      'escalation-center',
      'command-inbox',
      'action-queue',
      'operational-queue',
      'demo-dashboard',
      'demo-signals',
      'demo-priorities',
      'demo-workflows',
      'demo-recommendations',
      'demo-audit',
      'demo-exceptions',
      'demo-readiness',
      'demo-integrations',
      'demo-reports',
      'demo-settings',
      'demo-alerts',
    ],
    subDirRoutes: [
      {
        subDir: 'admin',
        routes: [
          'overview',
          'users',
          'feature-flags',
          'audit-log',
          'jobs',
          'run-viewer',
          'approval-queue',
          'seeder',
          'export-history',
          'diagnostics',
          'billing-admin',
          'platform-health',
          'connectors',
          'workflows',
        ],
      },
    ],
  },
  {
    name: 'API Server',
    appPath: join(ROOT, 'artifacts/api-server/src'),
    pagesDir: 'routes',
    knownRoutes: [
      'health',
      'core',
      'admin',
      'auth',
      'alloy',
      'lyte',
      'vessels',
      'firestorm',
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
  console.log('\nSZL Holdings — Route Coverage Audit');
  console.log('Checking that expected route files exist in each app...\n');

  let totalChecks = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const failures = [];

  for (const config of APP_CONFIGS) {
    const pagesDir = join(config.appPath, config.pagesDir);
    const existingFiles = new Set(listPageFiles(pagesDir));
    const existingSubDirs = new Set(listSubDirs(pagesDir));

    console.log(`  ${config.name} (${config.pagesDir}/)`);

    // Check top-level routes
    for (const route of config.knownRoutes) {
      totalChecks++;
      if (existingFiles.has(route)) {
        totalPassed++;
      } else {
        totalFailed++;
        failures.push({ app: config.name, route, context: 'top-level' });
        console.log(`    ✗ MISSING: ${route}`);
      }
    }

    // Check sub-directory routes
    if (config.subDirRoutes) {
      for (const { subDir, routes } of config.subDirRoutes) {
        const subPath = join(pagesDir, subDir);
        const subFiles = new Set(listPageFiles(subPath));

        for (const route of routes) {
          totalChecks++;
          if (subFiles.has(route)) {
            totalPassed++;
          } else {
            totalFailed++;
            failures.push({ app: config.name, route: `${subDir}/${route}`, context: 'sub-dir' });
            console.log(`    ✗ MISSING: ${subDir}/${route}`);
          }
        }
      }
    }

    console.log(
      `    → ${config.knownRoutes.length + (config.subDirRoutes?.reduce((a, b) => a + b.routes.length, 0) ?? 0)} routes checked`,
    );
  }

  console.log(`\nSummary: ${totalPassed}/${totalChecks} routes present, ${totalFailed} missing`);

  if (totalFailed > 0) {
    console.error(`\nFAIL — ${totalFailed} expected route file(s) are missing:`);
    for (const f of failures) {
      console.error(`  [${f.app}] ${f.route}`);
    }
    process.exit(1);
  } else {
    console.log(`\nPASS — All expected route files present.`);
    process.exit(0);
  }
}

main();
