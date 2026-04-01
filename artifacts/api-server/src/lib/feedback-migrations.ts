import fs from "fs";
import path from "path";
import { pool } from "@workspace/db";
import { logger } from "./logger";

function getMigrationFilePath(): string {
  const relativePath = path.join("lib", "db", "drizzle", "0009_feedback_tables.sql");
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

export async function ensureFeedbackTables(): Promise<void> {
  const migrationFile = getMigrationFilePath();
  let migrationSql: string;

  try {
    migrationSql = fs.readFileSync(migrationFile, "utf-8");
  } catch (err) {
    logger.warn({ err, path: migrationFile }, "Feedback migration file not found — skipping bootstrap");
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
      if (code === "42701" || code === "42710" || code === "42P07") {
        skipped++;
      } else {
        logger.warn({ err, statement: statement.slice(0, 120) }, "Feedback migration statement failed — continuing");
        skipped++;
      }
    }
  }

  logger.info({ applied, skipped, total: statements.length }, "Feedback tables ensured");
}
