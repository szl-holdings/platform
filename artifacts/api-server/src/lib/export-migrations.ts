import fs from "fs";
import path from "path";
import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

function getMigrationFilePath(): string {
  const relativePath = path.join("lib", "db", "drizzle", "0020_export_jobs.sql");
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

export async function ensureExportJobsTable(): Promise<void> {
  const migrationFile = getMigrationFilePath();
  let migrationSql: string;

  try {
    migrationSql = fs.readFileSync(migrationFile, "utf-8");
  } catch (err) {
    logger.error({ err, path: migrationFile }, "Export jobs migration file not found");
    throw new Error(`Export jobs migration SQL file not found at ${migrationFile}`);
  }

  const statements = migrationSql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + ";");

  for (const statement of statements) {
    await pool.query(statement);
  }

  logger.info({ statementCount: statements.length }, "Export jobs table ensured");
}
