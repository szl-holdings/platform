import fs from "fs";
import path from "path";
import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

const MIGRATION_FILES = [
  "0017_push_infra_hardening.sql",
  "0018_push_tokens_nullable_user.sql",
];

function resolveMigrationPath(filename: string): string {
  const relativePath = path.join("lib", "db", "drizzle", filename);
  const replHome = process.env["REPL_HOME"];
  if (replHome) {
    const candidate = path.join(replHome, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  const cwdCandidate = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(cwdCandidate)) return cwdCandidate;
  return path.resolve(process.cwd(), "..", "..", relativePath);
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

async function runMigrationFile(filePath: string): Promise<{ applied: number; skipped: number }> {
  let migrationSql: string;
  try {
    migrationSql = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    logger.warn({ err, path: filePath }, "[push-infra] Migration file not found — skipping");
    return { applied: 0, skipped: 0 };
  }

  const statements = parseMigrationStatements(migrationSql);
  let applied = 0;
  let skipped = 0;

  for (const statement of statements) {
    try {
      await pool.query(statement);
      applied++;
    } catch (err: unknown) {
      const code = err instanceof Object && "code" in err ? (err as { code: unknown }).code : undefined;
      const codeStr = typeof code === "string" ? code : undefined;
      // Idempotent: skip already-exists / duplicate / constraint already exists errors
      if (codeStr === "42701" || codeStr === "42710" || codeStr === "42P07" || codeStr === "23505") {
        skipped++;
      } else {
        logger.warn({ err, statement: statement.slice(0, 120) }, "[push-infra] Migration statement failed — continuing");
        skipped++;
      }
    }
  }

  return { applied, skipped };
}

export async function ensurePushInfraTables(): Promise<void> {
  let totalApplied = 0;
  let totalSkipped = 0;

  for (const filename of MIGRATION_FILES) {
    const filePath = resolveMigrationPath(filename);
    const { applied, skipped } = await runMigrationFile(filePath);
    totalApplied += applied;
    totalSkipped += skipped;
  }

  logger.info(
    { applied: totalApplied, skipped: totalSkipped, files: MIGRATION_FILES.length },
    "[push-infra] Push infrastructure tables ensured"
  );
}
