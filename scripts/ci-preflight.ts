#!/usr/bin/env tsx
/**
 * CI Pre-Flight Cleanup — Safety Net
 *
 * Deletes any leftover smoke-test records that a previous CI run may have
 * orphaned due to a mid-test failure or timeout.  Run this BEFORE the
 * integration test suite (e.g. as a pre-test hook in CI) so tests start
 * from a known-clean state.
 *
 * Usage:
 *   tsx scripts/ci-preflight.ts
 *   NODE_ENV=test tsx scripts/ci-preflight.ts
 *
 * Criteria for "smoke-test records" — conservative patterns that identify
 * records inserted only by the integration test suite:
 *   - vessels_alert_rules where name starts with "Smoke Test Alert Rule"
 *   - vessels_fleets        where name starts with "Smoke Test Fleet"
 *   - firestorm_assessments where name starts with "Smoke Test Assessment"
 *   - firestorm_findings    where title starts with "Smoke Test Finding"
 *   - holdings_ventures     where name starts with "Smoke Test Venture"
 *   - carlota_inquiries     where email ends with "@smoke.test" or name = "Jane Smith"
 *   - pc_gc_matters         where name starts with "Smoke Test Matter"
 *
 * The script is intentionally idempotent and read-through safe — if no
 * records match, it exits 0 without complaint.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  process.exit(0);
}

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const _db = drizzle(pool);

  let totalDeleted = 0;

  try {
    const client = await pool.connect();

    const tables: Array<{ table: string; column: string; pattern: string }> = [
      { table: "vessels_alert_rules", column: "name", pattern: "Smoke Test%" },
      { table: "vessels_fleets",      column: "name", pattern: "Smoke Test%" },
      { table: "firestorm_assessments", column: "name", pattern: "Smoke Test%" },
      { table: "firestorm_findings",  column: "title", pattern: "Smoke Test%" },
      { table: "holdings_ventures",   column: "name", pattern: "Smoke Test%" },
      { table: "pc_gc_matters",       column: "name", pattern: "Smoke Test%" },
    ];

    for (const { table, column, pattern } of tables) {
      try {
        const result = await client.query(
          `DELETE FROM ${table} WHERE ${column} LIKE $1 RETURNING id`,
          [pattern],
        );
        if (result.rowCount && result.rowCount > 0) {
          totalDeleted += result.rowCount;
        }
      } catch (err) {
        if ((err as { code?: string }).code === "42P01") {
          // Table does not exist yet — migration pending; skip silently.
        } else {
        }
      }
    }

    // carlota_inquiries uses a different pattern
    try {
      const result = await client.query(
        `DELETE FROM carlota_inquiries WHERE email LIKE '%@smoke.test' OR (name = 'Jane Smith' AND email = 'jane@example.com') RETURNING id`,
      );
      if (result.rowCount && result.rowCount > 0) {
        totalDeleted += result.rowCount;
      }
    } catch (err) {
      if ((err as { code?: string }).code === "42P01") {
      } else {
      }
    }

    client.release();
  } finally {
    await pool.end();
  }

  if (totalDeleted === 0) {
  } else {
  }

  process.exit(0);
}

main().catch((_err) => {
  process.exit(1);
});
