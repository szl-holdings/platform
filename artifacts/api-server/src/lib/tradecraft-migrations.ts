import fs from "fs";
import path from "path";
import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

function getMigrationFilePath(): string {
  const relativePath = path.join("lib", "db", "drizzle", "0014_firestorm_tradecraft_tables.sql");
  const replHome = process.env["REPL_HOME"];
  if (replHome) {
    const candidate = path.join(replHome, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  const cwdCandidate = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(cwdCandidate)) return cwdCandidate;
  return path.resolve(process.cwd(), "..", "..", relativePath);
}

const IDEMPOTENT_ERROR_FRAGMENTS = [
  "already exists",
  "duplicate column",
  "duplicate key",
];

function isIdempotentError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return IDEMPOTENT_ERROR_FRAGMENTS.some(fragment => msg.includes(fragment));
}

function stripSqlComments(sql: string): string {
  return sql
    .split("\n")
    .filter(line => !line.trim().startsWith("--"))
    .join("\n");
}

export async function ensureTradecraftTables(): Promise<void> {
  const migrationFile = getMigrationFilePath();
  let rawSql: string;

  try {
    rawSql = fs.readFileSync(migrationFile, "utf-8");
  } catch (err) {
    logger.warn({ err, path: migrationFile }, "Tradecraft migration file not found — skipping");
    return;
  }

  const cleanSql = stripSqlComments(rawSql);
  const statements = cleanSql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let applied = 0;
  let skipped = 0;
  for (const rawStatement of statements) {
    const statement = rawStatement + ";";
    try {
      await pool.query(statement);
      applied++;
    } catch (err: unknown) {
      if (isIdempotentError(err)) {
        skipped++;
        logger.debug({ msg: err instanceof Error ? err.message : String(err) }, "Tradecraft migration statement skipped (idempotent)");
      } else {
        logger.error({ err, statement: statement.slice(0, 100) }, "Failed to apply tradecraft migration statement");
        throw err;
      }
    }
  }
  logger.info({ applied, skipped, total: statements.length }, "Firestorm tradecraft tables ensured");
}
