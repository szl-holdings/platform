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
import { like, or } from "drizzle-orm";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  console.error("[ci-preflight] DATABASE_URL is not set — skipping cleanup");
  process.exit(0);
}

async function main() {
  console.log("[ci-preflight] Connecting to database…");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);

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
          console.log(`[ci-preflight] Deleted ${result.rowCount} leftover row(s) from ${table}`);
          totalDeleted += result.rowCount;
        }
      } catch (err) {
        if ((err as { code?: string }).code === "42P01") {
          // Table does not exist yet — migration pending; skip silently.
        } else {
          console.warn(`[ci-preflight] Warning: could not clean ${table}:`, err);
        }
      }
    }

    // carlota_inquiries uses a different pattern
    try {
      const result = await client.query(
        `DELETE FROM carlota_inquiries WHERE email LIKE '%@smoke.test' OR (name = 'Jane Smith' AND email = 'jane@example.com') RETURNING id`,
      );
      if (result.rowCount && result.rowCount > 0) {
        console.log(`[ci-preflight] Deleted ${result.rowCount} leftover row(s) from carlota_inquiries`);
        totalDeleted += result.rowCount;
      }
    } catch (err) {
      if ((err as { code?: string }).code === "42P01") {
      } else {
        console.warn(`[ci-preflight] Warning: could not clean carlota_inquiries:`, err);
      }
    }

    client.release();
  } finally {
    await pool.end();
  }

  if (totalDeleted === 0) {
    console.log("[ci-preflight] No leftover smoke-test records found — environment is clean.");
  } else {
    console.log(`[ci-preflight] Total deleted: ${totalDeleted} record(s). Environment is now clean.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("[ci-preflight] Fatal error:", err);
  process.exit(1);
});
