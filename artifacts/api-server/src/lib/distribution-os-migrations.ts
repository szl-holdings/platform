import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

const IDEMPOTENT_ERROR_FRAGMENTS = [
  "already exists",
  "duplicate column",
  "duplicate key value",
];

function isIdempotentError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return IDEMPOTENT_ERROR_FRAGMENTS.some(f => msg.includes(f));
}

const DDL_STATEMENTS = [
  `ALTER TABLE dos_leads ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMPTZ`,
  `ALTER TABLE dos_leads ADD COLUMN IF NOT EXISTS last_action TEXT`,
];

export async function ensureDistributionOsTables(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const ddl of DDL_STATEMENTS) {
      const stmt = ddl.trim();
      if (!stmt) continue;
      try {
        await client.query(stmt);
      } catch (err) {
        if (isIdempotentError(err)) continue;
        logger.error({ err, stmt: stmt.slice(0, 120) }, "[distribution-os-migrations] DDL error — schema drift may not be resolved");
        throw err;
      }
    }
    logger.info("[distribution-os-migrations] Distribution OS schema drift resolved");
  } finally {
    client.release();
  }
}
