import fs from "fs";
import path from "path";
import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

function getMigrationFilePath(): string {
  const relativePath = path.join("lib", "db", "drizzle", "0008_lyte_dashboards.sql");
  const replHome = process.env["REPL_HOME"];
  if (replHome) {
    const candidate = path.join(replHome, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  const cwdCandidate = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(cwdCandidate)) return cwdCandidate;
  const fromArtifactRoot = path.resolve(process.cwd(), "..", "..", relativePath);
  return fromArtifactRoot;
}

export async function ensureLyteDashboardsTable(): Promise<void> {
  const migrationFile = getMigrationFilePath();
  let migrationSql: string;
  try {
    migrationSql = fs.readFileSync(migrationFile, "utf-8");
  } catch {
    logger.warn({ path: migrationFile }, "lyte_dashboards migration file not found — skipping");
    return;
  }

  const statements = migrationSql
    .split(";")
    .map(s =>
      s
        .split("\n")
        .filter(line => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter(s => s.length > 0);

  try {
    for (const statement of statements) {
      await pool.query(statement);
    }
    logger.info({ statementCount: statements.length }, "lyte_dashboards table ensured");
  } catch (err: unknown) {
    if ((err as { message?: string }).message?.includes("already exists")) {
      logger.debug("lyte_dashboards table already exists — skipping");
      return;
    }
    logger.error({ err }, "Failed to apply lyte_dashboards migration");
    throw err;
  }
}
