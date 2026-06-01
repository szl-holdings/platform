/**
 * smoke-test-preflight.ts
 *
 * Vitest globalSetup — runs once before the entire integration suite starts.
 *
 * Removes any orphan rows that match well-known smoke-test sentinel patterns.
 * This is a safety net for records left behind by a hard crash or SIGKILL that
 * prevented afterEach cleanup from running in a prior CI job.
 *
 * Can also be executed as a standalone CLI script between CI retries:
 *   pnpm cleanup:test-records
 */

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const SENTINELS = {
  /** Pattern matched against text columns that hold the record's display name. */
  NAME_PATTERN: '%Smoke Test%',
  /** Pattern matched against carlota inquiry messages. */
  CARLOTA_MESSAGE_PATTERN: '%smoke test%',
  /** Pattern matched against carlota inquiry names (fallback). */
  CARLOTA_NAME_PATTERN: '%Integration test%',
  /** Pattern matched against pcGcMatters matterNumber column. */
  MATTER_NUMBER_PATTERN: 'SMOKE-%',
  /** Pattern matched against holdingsVentures slug column. */
  VENTURE_SLUG_PATTERN: 'smoke-test-venture-%',
} as const;

async function purge(): Promise<void> {
  const { db } = await import('@szl-holdings/db');
  const schema = (await import('@szl-holdings/db/schema')) as Record<string, unknown>;
  const { ilike, like, or } = await import('drizzle-orm');

  type AnyTable = Parameters<(typeof db)['delete']>[0];
  type AnyCondition = Parameters<ReturnType<(typeof db)['delete']>['where']>[0];

  const deleted: string[] = [];
  const errors: string[] = [];

  async function sweep(label: string, table: AnyTable, condition: AnyCondition): Promise<void> {
    try {
      const rows = await db
        .delete(table)
        .where(condition)
        .returning({ id: (table as Record<string, unknown>).id as never });
      if (rows.length > 0) {
        deleted.push(`  ${label}: ${rows.length} row(s) removed`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`  ${label}: ${msg}`);
    }
  }

  const s = schema as {
    vesselsFleetsTable: AnyTable;
    vesselsAlertRulesTable: AnyTable;
    firestormAssessmentsTable: AnyTable;
    firestormFindingsTable: AnyTable;
    carlotaInquiriesTable: AnyTable;
    holdingsVenturesTable: AnyTable;
    pcGcMattersTable: AnyTable;
  };

  const col = (table: AnyTable, name: string) =>
    (table as Record<string, unknown>)[name] as never;

  await sweep(
    'vesselsFleetsTable',
    s.vesselsFleetsTable,
    ilike(col(s.vesselsFleetsTable, 'name'), SENTINELS.NAME_PATTERN),
  );

  await sweep(
    'vesselsAlertRulesTable',
    s.vesselsAlertRulesTable,
    ilike(col(s.vesselsAlertRulesTable, 'name'), SENTINELS.NAME_PATTERN),
  );

  await sweep(
    'firestormAssessmentsTable',
    s.firestormAssessmentsTable,
    ilike(col(s.firestormAssessmentsTable, 'name'), SENTINELS.NAME_PATTERN),
  );

  await sweep(
    'firestormFindingsTable',
    s.firestormFindingsTable,
    ilike(col(s.firestormFindingsTable, 'title'), SENTINELS.NAME_PATTERN),
  );

  await sweep(
    'carlotaInquiriesTable',
    s.carlotaInquiriesTable,
    or(
      ilike(col(s.carlotaInquiriesTable, 'message'), SENTINELS.CARLOTA_MESSAGE_PATTERN),
      ilike(col(s.carlotaInquiriesTable, 'name'), SENTINELS.CARLOTA_NAME_PATTERN),
    ) as AnyCondition,
  );

  await sweep(
    'holdingsVenturesTable',
    s.holdingsVenturesTable,
    or(
      ilike(col(s.holdingsVenturesTable, 'name'), SENTINELS.NAME_PATTERN),
      like(col(s.holdingsVenturesTable, 'slug'), SENTINELS.VENTURE_SLUG_PATTERN),
    ) as AnyCondition,
  );

  await sweep(
    'pcGcMattersTable',
    s.pcGcMattersTable,
    or(
      ilike(col(s.pcGcMattersTable, 'name'), SENTINELS.NAME_PATTERN),
      like(col(s.pcGcMattersTable, 'matterNumber'), SENTINELS.MATTER_NUMBER_PATTERN),
    ) as AnyCondition,
  );

  if (deleted.length > 0) {
    const _totalRows = deleted.reduce((sum, line) => {
      const match = line.match(/(\d+) row\(s\)/);
      return sum + (match ? parseInt(match[1], 10) : 0);
    }, 0);
  } else {
  }

  if (errors.length > 0) {
    throw new Error(
      `[smoke-test-preflight] ${errors.length} sweep(s) failed — CI may have residual test data:\n` +
        errors.join('\n'),
    );
  }
}

/** Vitest globalSetup hook — called once before the test suite starts. */
export async function setup(): Promise<void> {
  await purge();
}

/**
 * Allow direct execution: `pnpm cleanup:test-records` via tsx.
 * Uses fileURLToPath + path.resolve for robust cross-platform matching.
 */
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isMain) {
  purge()
    .then(() => process.exit(0))
    .catch((_err) => {
      process.exit(1);
    });
}
