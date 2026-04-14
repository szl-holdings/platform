import fs from "fs";
import path from "path";
import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

function getMigrationFilePath(): string {
  const relativePath = path.join("lib", "db", "drizzle", "0003_alloy_canonical_schema.sql");
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

function parseMigrationStatements(sql: string): string[] {
  return sql
    .split("--> statement-breakpoint")
    .map(chunk => {
      const lines = chunk.split("\n");
      const nonCommentLines = lines.filter(line => !line.trim().startsWith("--"));
      return nonCommentLines.join("\n").trim();
    })
    .filter(s => s.length > 0);
}

export async function ensureAlloyTables(): Promise<void> {
  const migrationFile = getMigrationFilePath();
  let migrationSql: string;

  try {
    migrationSql = fs.readFileSync(migrationFile, "utf-8");
  } catch (err) {
    logger.warn({ err, path: migrationFile }, "Alloy migration file not found — skipping bootstrap");
    return;
  }

  const statements = parseMigrationStatements(migrationSql);
  let applied = 0;
  let skipped = 0;

  for (const statement of statements) {
    try {
      await pool.query(statement);
      applied++;
    } catch (err: any) {
      const code = err?.code as string | undefined;
      const benign = ["42P07", "42701", "42703", "42710", "23505"];
      if (code && benign.includes(code)) {
        skipped++;
      } else {
        logger.warn({ err, statement: statement.slice(0, 120) }, "Alloy migration statement failed (non-fatal)");
        skipped++;
      }
    }
  }

  logger.info({ applied, skipped, total: statements.length }, "Alloy canonical tables ensured");
}
