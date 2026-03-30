import fs from "fs";
import path from "path";
import { pool } from "@workspace/db";
import { logger } from "./logger";

function getMigrationFilePath(): string {
  const relativePath = path.join("lib", "db", "drizzle", "0005_platform_ops_tables.sql");
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

export async function ensurePlatformOpsTables(): Promise<void> {
  const migrationFile = getMigrationFilePath();
  let migrationSql: string;

  try {
    migrationSql = fs.readFileSync(migrationFile, "utf-8");
  } catch (err) {
    logger.error({ err, path: migrationFile }, "Platform ops migration file not found");
    throw new Error(`Platform ops migration SQL file not found at ${migrationFile}`);
  }

  const statements = parseMigrationStatements(migrationSql);

  try {
    for (const statement of statements) {
      await pool.query(statement);
    }
    logger.info({ statementCount: statements.length, migrationFile }, "Platform ops tables (workflow_runs, artifact_approvals) ensured from migration file");
  } catch (err) {
    logger.error({ err }, "Failed to apply platform ops migration");
    throw err;
  }
}
