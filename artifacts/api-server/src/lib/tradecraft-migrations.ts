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
    logger.error({ err, path: migrationFile }, "Tradecraft migration file not found");
    throw new Error(`Tradecraft migration file not found at ${migrationFile}`);
  }

  const cleanSql = stripSqlComments(rawSql);
  const statements = cleanSql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const rawStatement of statements) {
    await pool.query(rawStatement + ";");
  }

  logger.info({ total: statements.length }, "Firestorm tradecraft tables ensured");
}
