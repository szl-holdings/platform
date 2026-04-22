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
    for (const _f of failures) {
    }
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
