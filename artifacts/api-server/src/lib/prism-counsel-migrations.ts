import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

const PRISM_COUNSEL_MIGRATIONS = [
  `ALTER TABLE pc_matters ADD COLUMN IF NOT EXISTS practice_area TEXT`,
  `ALTER TABLE pc_matters ADD COLUMN IF NOT EXISTS date_of_loss TIMESTAMP`,
  `ALTER TABLE pc_matters ADD COLUMN IF NOT EXISTS service_date TIMESTAMP`,
  `ALTER TABLE pc_matters ADD COLUMN IF NOT EXISTS incident_date TIMESTAMP`,
  `ALTER TABLE pc_matters ADD COLUMN IF NOT EXISTS discovery_date TIMESTAMP`,
  `CREATE INDEX IF NOT EXISTS pc_matters_practice_area_idx ON pc_matters (practice_area)`,
  `CREATE INDEX IF NOT EXISTS pc_matters_date_of_loss_idx ON pc_matters (date_of_loss)`,
];

export async function ensurePrismCounselSchema(): Promise<void> {
  for (const statement of PRISM_COUNSEL_MIGRATIONS) {
    await pool.query(statement);
  }
  logger.info({ total: PRISM_COUNSEL_MIGRATIONS.length }, "PRISM Counsel schema migration complete");
}
