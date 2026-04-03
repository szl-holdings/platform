import fs from "fs";
import path from "path";
import { pool } from "@workspace/db";
import { logger } from "./logger";

function getMigrationFilePath(): string {
  const relativePath = path.join("lib", "db", "drizzle", "0013_terra_action_items.sql");
  const replHome = process.env["REPL_HOME"];
  if (replHome) {
    const candidate = path.join(replHome, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  const cwdCandidate = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(cwdCandidate)) return cwdCandidate;
  return path.resolve(process.cwd(), "..", "..", relativePath);
}

export async function ensureTerraActionItemsTable(): Promise<void> {
  const migrationFile = getMigrationFilePath();
  let migrationSql: string;

  try {
    migrationSql = fs.readFileSync(migrationFile, "utf-8");
  } catch (err) {
    logger.warn({ err, path: migrationFile }, "terra_action_items migration file not found — skipping");
    return;
  }

  const statements = migrationSql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + ";");

  try {
    for (const statement of statements) {
      await pool.query(statement);
    }
    logger.info({ statementCount: statements.length }, "terra_action_items table ensured");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      logger.debug("terra_action_items table already exists — skipping");
      return;
    }
    logger.error({ err }, "Failed to apply terra_action_items migration");
    throw err;
  }
}
