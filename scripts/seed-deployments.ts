/**
 * seed-deployments.ts — Seeds the deployment registry with realistic version
 * history for every registered platform app, so the Pulse System Health
 * rollback button (and the underlying GET /api/deployments/:appId,
 * GET /api/deployments/:appId/history, POST /api/deployments/:appId/rollback
 * routes) have data to operate on out of the box.
 *
 * Idempotent: skips apps that already have at least one row.
 */

import { db, deploymentsTable } from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';

interface AppSeed {
  appId: string;
  appName: string;
  versions: string[];
}

const APPS: AppSeed[] = [
  { appId: 'api-server', appName: 'API Server', versions: ['v1.0.0', 'v1.1.0', 'v1.2.0'] },
  { appId: 'command', appName: 'Unified Command', versions: ['v1.0.0', 'v1.1.0'] },
  { appId: 'szl-holdings', appName: 'SZL Holdings Dashboard', versions: ['v1.0.0', 'v1.1.0'] },
  { appId: 'szl-holdings-mobile', appName: 'APEX — Mobile Command', versions: ['v1.0.0'] },
  { appId: 'pulse', appName: 'Pulse — AI Executive Briefing', versions: ['v1.0.0', 'v1.1.0'] },
  { appId: 'aegis', appName: 'Aegis — Defense & Intelligence', versions: ['v1.0.0', 'v1.0.1'] },
  { appId: 'vessels', appName: 'Vessels Maritime Intelligence', versions: ['v1.0.0', 'v1.1.0'] },
  { appId: 'terra', appName: 'Terra — Real Estate Intelligence', versions: ['v1.0.0', 'v1.1.0'] },
  { appId: 'sentra', appName: 'Aegis — Cyber Resilience', versions: ['v1.0.0'] },
  {
    appId: 'prism-counsel',
    appName: 'Counsel — Legal Command',
    versions: ['v1.0.0', 'v1.0.1'],
  },
  {
    appId: 'lyte-command-center',
    appName: 'Lyte — Decision Intelligence',
    versions: ['v1.0.0', 'v1.1.0'],
  },
  { appId: 'carlota-jo', appName: 'Carlota Jo Consulting', versions: ['v1.0.0'] },
];

const ENVIRONMENTS: Array<'production' | 'staging'> = ['production', 'staging'];
const NOW = Date.now();
// Space versions ~1 day apart so the timeline reads naturally in the UI.
const DAY_MS = 24 * 60 * 60 * 1000;

async function seed(): Promise<void> {
  let _inserted = 0;
  let _skipped = 0;

  for (const app of APPS) {
    for (const env of ENVIRONMENTS) {
      const existing = await db
        .select({ id: deploymentsTable.id })
        .from(deploymentsTable)
        .where(and(eq(deploymentsTable.appId, app.appId), eq(deploymentsTable.environment, env)))
        .limit(1);

      if (existing.length > 0) {
        _skipped++;
        continue;
      }

      const versions = app.versions;
      const rows = versions.map((version, i) => {
        const isLast = i === versions.length - 1;
        const deployedAt = new Date(NOW - (versions.length - 1 - i) * DAY_MS);
        return {
          appId: app.appId,
          appName: app.appName,
          version,
          environment: env,
          status: (isLast ? 'active' : 'inactive') as 'active' | 'inactive',
          deployedAt,
          deployedBy: 'system',
          notes: isLast
            ? `Initial seed — current ${env} version.`
            : `Initial seed — historical ${env} version.`,
        };
      });

      await db.insert(deploymentsTable).values(rows);
      _inserted += rows.length;
    }
  }
}

seed()
  .then(() => process.exit(0))
  .catch((_err) => {
    process.exit(1);
  });
