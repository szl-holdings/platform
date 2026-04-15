import path from "path";
import fs from "fs";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@szl-holdings/db";
import { logger } from "./logger";

function getMigrationsFolder(): string {
  const candidates: string[] = [];

  const replHome = process.env["REPL_HOME"];
  if (replHome) {
    candidates.push(path.join(replHome, "lib", "db", "drizzle"));
  }

  candidates.push(path.resolve(process.cwd(), "lib", "db", "drizzle"));
  candidates.push(path.resolve(process.cwd(), "..", "..", "lib", "db", "drizzle"));
  candidates.push(path.resolve(process.cwd(), "..", "db", "drizzle"));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const fallback = candidates[0] ?? path.resolve(process.cwd(), "..", "..", "lib", "db", "drizzle");
  logger.warn({ fallback, candidates }, "[migrations] Could not find drizzle folder — falling back to first candidate");
  return fallback;
}

export async function runMigrations(): Promise<void> {
  const migrationsFolder = getMigrationsFolder();
  logger.info({ migrationsFolder }, "[migrations] Running Drizzle migrations");

  try {
    await migrate(db, { migrationsFolder });
    logger.info("[migrations] All migrations applied successfully");
  } catch (err) {
    logger.error({ err }, "[migrations] Migration failed");
    throw err;
  }
}
